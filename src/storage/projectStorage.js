import {
  collectAssetIdsFromProject,
  remapAssetIdsInProject,
} from '../assets/assetRefs';
import {
  DEFAULT_BRANDING,
  DEFAULT_CONTENT_AVAILABILITY,
  DEFAULT_CONTENT_SETUP,
  DEFAULT_OPTIONAL_SECTIONS,
  EMPTY_EVENT,
  MAX_DOCUMENT_BYTES,
  MAX_IMAGE_BYTES,
  MAX_PROJECT_BYTES,
  PROJECT_VERSION,
  STORAGE_KEY,
} from '../constants';
import {
  createHomePageRecord,
  getHomePage,
  projectHasPages,
} from '../pages/pageModel';
import {
  base64ToBlob,
  blobToBase64,
  clearAllAssets,
  createAssetId,
  deleteAsset,
  getAsset,
  getAssetsByIds,
  putAsset,
} from './assetStore';
import {
  isValidPuckDataShape,
  validateProjectForImport,
} from './projectValidation';

export function createEmptyContentSetup() {
  return {
    ...DEFAULT_CONTENT_SETUP,
    coveredSectionIds: [],
    assets: [],
  };
}

export function createEmptyProject() {
  return {
    version: PROJECT_VERSION,
    event: { ...EMPTY_EVENT },
    branding: { ...DEFAULT_BRANDING },
    contentAvailability: { ...DEFAULT_CONTENT_AVAILABILITY },
    contentSetup: createEmptyContentSetup(),
    sectionOverrides: {},
    optionalSections: { ...DEFAULT_OPTIONAL_SECTIONS },
    pages: [],
    activePageId: null,
    puckData: null,
    updatedAt: null,
  };
}

function isValidPuckData(value) {
  return isValidPuckDataShape(value);
}

function mapOptionalSectionsToOverrides(optionalSections = {}) {
  const overrides = {};
  const mapping = {
    stats: 'stats',
    testimonials: 'testimonials',
    speakers: 'speakers',
    sponsors: 'sponsors',
    faqs: 'practical',
  };

  Object.entries(mapping).forEach(([oldKey, sectionId]) => {
    if (typeof optionalSections[oldKey] === 'boolean') {
      overrides[sectionId] = optionalSections[oldKey];
    }
  });

  return overrides;
}

function hasAvailableContent(contentAvailability = {}) {
  return Object.values(contentAvailability).some((value) => value === 'available');
}

export function migrateProject(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const version = Number(raw.version) || 1;
  if (version > PROJECT_VERSION) return null;

  let project = {
    ...createEmptyProject(),
    ...raw,
    event: { ...EMPTY_EVENT, ...(raw.event || {}) },
    branding: { ...DEFAULT_BRANDING, ...(raw.branding || {}) },
    contentAvailability: {
      ...DEFAULT_CONTENT_AVAILABILITY,
      ...(raw.contentAvailability || {}),
    },
    contentSetup: {
      ...createEmptyContentSetup(),
      ...(raw.contentSetup || {}),
      coveredSectionIds: [...(raw.contentSetup?.coveredSectionIds || [])],
      assets: [...(raw.contentSetup?.assets || [])],
    },
    sectionOverrides: { ...(raw.sectionOverrides || {}) },
    optionalSections: {
      ...DEFAULT_OPTIONAL_SECTIONS,
      ...(raw.optionalSections || {}),
    },
    pages: Array.isArray(raw.pages) ? raw.pages.map((page) => ({ ...page })) : [],
    activePageId: raw.activePageId ?? null,
    puckData: raw.puckData ?? null,
    updatedAt: raw.updatedAt ?? null,
  };

  if (version < 2) {
    project.event = {
      ...EMPTY_EVENT,
      ...project.event,
      eventType: project.event.eventType || 'other',
      format: project.event.format || 'in_person',
      objective: project.event.objective ?? null,
      ctaLabelCustomised:
        typeof project.event.ctaLabelCustomised === 'boolean'
          ? project.event.ctaLabelCustomised
          : Boolean(project.event.ctaLabel),
    };

    if (!raw.sectionOverrides) {
      project.sectionOverrides = mapOptionalSectionsToOverrides(raw.optionalSections);
    }
  }

  if (version < 3) {
    const existingSetup = raw.contentSetup || {};
    project.contentSetup = {
      ...createEmptyContentSetup(),
      ...existingSetup,
      coveredSectionIds: [...(existingSetup.coveredSectionIds || [])],
      assets: [...(existingSetup.assets || [])],
      hasExistingContent:
        existingSetup.hasExistingContent ??
        (hasAvailableContent(project.contentAvailability) ? 'yes' : null),
      wantSuggestions: existingSetup.wantSuggestions ?? null,
      suggestMissingAreas: Boolean(existingSetup.suggestMissingAreas),
      pastedText: existingSetup.pastedText || '',
    };
  }

  if (version < 4) {
    if ((!project.pages || project.pages.length === 0) && project.puckData) {
      const home = createHomePageRecord(project.puckData);
      project.pages = [home];
      project.activePageId = home.id;
    } else if (project.pages?.length) {
      project.pages = project.pages.map((page) => ({
        id: page.id || createHomePageRecord(page.puckData).id,
        slug: page.slug || (page.role === 'home' ? 'home' : 'page'),
        title: page.title || (page.role === 'home' ? 'Home' : 'Page'),
        role: page.role || (page.slug === 'home' ? 'home' : 'page'),
        puckData: page.puckData ?? null,
      }));
      if (!project.activePageId) {
        project.activePageId = getHomePage(project)?.id || project.pages[0]?.id || null;
      }
    }
  }

  // Keep legacy puckData mirrored from home when pages exist
  if (projectHasPages(project)) {
    const home = getHomePage(project);
    project.puckData = home?.puckData || project.puckData;
    if (!project.activePageId) {
      project.activePageId = home?.id || project.pages[0]?.id || null;
    }
  }

  project.version = PROJECT_VERSION;
  return project;
}

/** Loose structural check for localStorage load. Import uses validateProjectForImport. */
export function isValidProjectShape(value) {
  if (!value || typeof value !== 'object') return false;
  const version = Number(value.version);
  if (![1, 2, 3, 4].includes(version)) return false;
  if (!value.event || typeof value.event !== 'object') return false;
  if (!value.branding || typeof value.branding !== 'object') return false;
  if (!isValidPuckData(value.puckData)) return false;
  if (value.pages != null) {
    if (!Array.isArray(value.pages)) return false;
    for (const page of value.pages) {
      if (!page || typeof page !== 'object') return false;
      if (!isValidPuckData(page.puckData)) return false;
    }
  }
  return true;
}

export function isValidProject(value) {
  if (!isValidProjectShape(value)) return false;
  return Boolean(migrateProject(value));
}

export function loadProject() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isValidProjectShape(parsed)) return null;
    return migrateProject(parsed);
  } catch {
    return null;
  }
}

export function saveProject(project) {
  const migrated = migrateProject(project) || createEmptyProject();
  const payload = {
    ...migrated,
    version: PROJECT_VERSION,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return { ok: true, project: payload };
  } catch (error) {
    const isQuota =
      error?.name === 'QuotaExceededError' ||
      error?.code === 22 ||
      /quota/i.test(String(error?.message ?? ''));

    return {
      ok: false,
      error: isQuota
        ? 'Could not save — browser storage is full. Try a smaller logo or fewer attachments, or export and clear the saved project.'
        : 'Could not save the project to browser storage.',
    };
  }
}

export async function clearProject() {
  // Clear attachments first so a failed cleanup does not leave a half-reset project.
  await clearAllAssets();
  localStorage.removeItem(STORAGE_KEY);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function exportProjectAsJson(project) {
  const migrated = migrateProject(project) || project;
  const blob = new Blob([JSON.stringify(migrated, null, 2)], {
    type: 'application/json',
  });
  const stamp = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `composer-rapid-project-${stamp}.json`);
  return {
    ok: true,
    warning:
      'JSON only does not include uploaded files stored in this browser. Use Export project with attachments to transfer them.',
  };
}

/**
 * Export project + attachment binaries. Reports missing IndexedDB files.
 */
export async function exportProjectBundle(project) {
  const migrated = migrateProject(project) || project;
  const expectedIds = [...collectAssetIdsFromProject(migrated)];
  const stored = await getAssetsByIds(expectedIds);
  const foundIds = new Set(stored.map((item) => item.id));
  const missingIds = expectedIds.filter((id) => !foundIds.has(id));

  const assets = [];
  for (const item of stored) {
    const dataBase64 = await blobToBase64(item.blob);
    assets.push({
      id: item.id,
      name: item.name,
      mimeType: item.mimeType,
      size: item.blob?.size ?? item.size,
      kind: item.kind,
      createdAt: item.createdAt,
      dataBase64,
    });
  }

  const bundle = {
    format: 'composer-rapid-bundle',
    version: PROJECT_VERSION,
    project: migrated,
    assets,
    missingAssetIds: missingIds,
  };

  const blob = new Blob([JSON.stringify(bundle)], { type: 'application/json' });
  const stamp = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `project-${stamp}.composer-rapid-bundle.json`);

  if (missingIds.length > 0) {
    return {
      ok: true,
      warning: `${missingIds.length} attachment(s) are referenced but missing from this browser and were not included in the bundle.`,
      missingAssetIds: missingIds,
    };
  }

  return { ok: true, assetCount: assets.length };
}

function validateBundleAssetPayload(asset, runningTotal) {
  if (!asset || typeof asset !== 'object') {
    return { ok: false, error: 'Bundle contains an invalid attachment entry.' };
  }
  if (typeof asset.id !== 'string' || !asset.id.trim()) {
    return { ok: false, error: 'An attachment is missing an id.' };
  }
  if (typeof asset.dataBase64 !== 'string' || !asset.dataBase64) {
    return { ok: false, error: `Attachment “${asset.name || asset.id}” has no file data.` };
  }

  let blob;
  try {
    blob = base64ToBlob(asset.dataBase64, asset.mimeType);
  } catch {
    return { ok: false, error: `Could not decode attachment “${asset.name || asset.id}”.` };
  }

  const actualSize = blob.size;
  const kind =
    asset.kind === 'image' || asset.kind === 'document'
      ? asset.kind
      : (asset.mimeType || '').startsWith('image/')
        ? 'image'
        : 'document';

  if (kind === 'image' && actualSize > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      error: `Attachment “${asset.name || asset.id}” exceeds the image size limit.`,
    };
  }
  if (kind === 'document' && actualSize > MAX_DOCUMENT_BYTES) {
    return {
      ok: false,
      error: `Attachment “${asset.name || asset.id}” exceeds the document size limit.`,
    };
  }
  if (runningTotal + actualSize > MAX_PROJECT_BYTES) {
    return {
      ok: false,
      error: 'Bundle attachments exceed the total project storage limit.',
    };
  }

  return {
    ok: true,
    blob,
    meta: {
      id: asset.id,
      name: asset.name || 'attachment',
      mimeType: asset.mimeType || blob.type || 'application/octet-stream',
      size: actualSize,
      kind,
      status: 'attached',
      createdAt: asset.createdAt || new Date().toISOString(),
    },
  };
}

/**
 * Import JSON project or Composer Rapid bundle.
 * Options: { allowJsonWithoutAttachments: true } for plain JSON after user confirmation.
 * Never mutates the current project on failure (caller keeps existing state).
 */
export async function importProjectFromFile(file, options = {}) {
  const text = await file.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }

  if (parsed?.format === 'composer-rapid-bundle') {
    const validation = validateProjectForImport(parsed.project);
    if (!validation.ok) {
      throw new Error(validation.errors[0] || 'That bundle does not contain a valid project.');
    }

    const migrated = migrateProject(parsed.project);
    if (!migrated) {
      throw new Error('Could not migrate the bundled project.');
    }

    const listedAssets = Array.isArray(parsed.assets) ? parsed.assets : [];
    const prepared = [];
    let total = 0;
    for (const asset of listedAssets) {
      const check = validateBundleAssetPayload(asset, total);
      if (!check.ok) throw new Error(check.error);
      total += check.meta.size;
      prepared.push(check);
    }

    const referenced = collectAssetIdsFromProject(migrated);
    const providedIds = new Set(prepared.map((item) => item.meta.id));
    const missingInBundle = [...referenced].filter((id) => !providedIds.has(id));
    if (missingInBundle.length > 0 && !options.allowMissingBundleAssets) {
      throw new Error(
        `This bundle is missing ${missingInBundle.length} referenced attachment(s). Export again from a browser that still has those files, or use a complete bundle.`,
      );
    }

    // Stage under new ids so a failed write never overwrites existing assets.
    const idMap = {};
    const stagedIds = [];
    try {
      for (const item of prepared) {
        const newId = createAssetId();
        idMap[item.meta.id] = newId;
        const result = await putAsset({
          id: newId,
          blob: item.blob,
          meta: { ...item.meta, id: newId },
        });
        if (!result.ok) {
          throw new Error(result.error || 'Could not store an attached file from the bundle.');
        }
        stagedIds.push(newId);
      }

      let next = remapAssetIdsInProject(migrated, idMap);
      next = {
        ...next,
        version: PROJECT_VERSION,
        updatedAt: new Date().toISOString(),
        contentSetup: {
          ...next.contentSetup,
          assets: prepared.map((item) => ({
            ...item.meta,
            id: idMap[item.meta.id],
          })),
        },
      };

      // Drop previous browser assets that are no longer referenced.
      const keep = new Set(stagedIds);
      const previous = await getAssetsByIds([
        ...collectAssetIdsFromProject(loadProject() || {}),
      ]);
      await Promise.all(
        previous
          .filter((asset) => !keep.has(asset.id))
          .map((asset) => deleteAsset(asset.id)),
      );

      return {
        project: next,
        kind: 'bundle',
        warning:
          missingInBundle.length > 0
            ? `${missingInBundle.length} referenced attachment(s) were absent from the bundle.`
            : '',
      };
    } catch (error) {
      await Promise.all(stagedIds.map((id) => deleteAsset(id).catch(() => {})));
      throw error;
    }
  }

  const validation = validateProjectForImport(parsed);
  if (!validation.ok) {
    throw new Error(
      validation.errors[0] ||
        'That file does not look like a Composer Rapid project. Check the version and required fields.',
    );
  }

  const migrated = migrateProject(parsed);
  if (!migrated) {
    throw new Error('Could not migrate that project file.');
  }

  const assetMetas = migrated.contentSetup?.assets || [];
  const needsAttachmentWarning =
    assetMetas.length > 0 || collectAssetIdsFromProject(migrated).size > 0;

  if (needsAttachmentWarning && !options.allowJsonWithoutAttachments) {
    const error = new Error(
      'This JSON file lists attachments, but uploaded files live in browser storage and are not included. Importing will keep the page layout without those files unless you use a project bundle.',
    );
    error.code = 'JSON_WITHOUT_ATTACHMENTS';
    error.project = {
      ...migrated,
      version: PROJECT_VERSION,
      updatedAt: new Date().toISOString(),
    };
    throw error;
  }

  return {
    project: {
      ...migrated,
      version: PROJECT_VERSION,
      updatedAt: new Date().toISOString(),
    },
    kind: 'json',
    warning: needsAttachmentWarning
      ? 'Imported layout only. Uploaded files from the original browser were not included in this JSON file.'
      : '',
  };
}

export async function removeProjectAsset(project, assetId) {
  await deleteAsset(assetId);
  return {
    ...project,
    contentSetup: {
      ...project.contentSetup,
      assets: (project.contentSetup?.assets || []).filter((asset) => asset.id !== assetId),
    },
  };
}

export async function downloadProjectAsset(assetId) {
  const stored = await getAsset(assetId);
  if (!stored?.blob) {
    throw new Error('That attachment is missing from this browser’s storage.');
  }
  const url = URL.createObjectURL(stored.blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = stored.name || 'attachment';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function readImageAsDataUrl(file, maxBytes) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file selected.'));
      return;
    }

    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file.'));
      return;
    }

    if (file.size > maxBytes) {
      const limitKb = Math.round(maxBytes / 1024);
      reject(new Error(`Image is too large. Please use a file under ${limitKb} KB.`));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read that image.'));
    reader.readAsDataURL(file);
  });
}

export function syncOptionalSectionsFromResolved(sections = []) {
  const ids = new Set(sections.map((section) => section.id));
  return {
    stats: ids.has('stats'),
    testimonials: ids.has('testimonials'),
    speakers: ids.has('speakers'),
    sponsors: ids.has('sponsors'),
    faqs: ids.has('practical'),
    highlights: sections.some((section) => section.component === 'Highlights'),
    information: sections.some((section) => section.component === 'Information'),
  };
}
