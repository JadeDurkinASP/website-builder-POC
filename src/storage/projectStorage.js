import {
  DEFAULT_BRANDING,
  DEFAULT_CONTENT_AVAILABILITY,
  DEFAULT_CONTENT_SETUP,
  DEFAULT_OPTIONAL_SECTIONS,
  EMPTY_EVENT,
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
  deleteAsset,
  getAsset,
  getAssetsByIds,
  putAsset,
} from './assetStore';

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
  if (value == null) return true;
  if (typeof value !== 'object') return false;
  if (!Array.isArray(value.content)) return false;
  if (!value.root || typeof value.root !== 'object') return false;
  return true;
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
  localStorage.removeItem(STORAGE_KEY);
  try {
    await clearAllAssets();
  } catch {
    // Keep localStorage clear even if IndexedDB cleanup fails.
  }
}

export function exportProjectAsJson(project) {
  const migrated = migrateProject(project) || project;
  const blob = new Blob([JSON.stringify(migrated, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  anchor.href = url;
  anchor.download = `composer-rapid-project-${stamp}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function exportProjectBundle(project) {
  const migrated = migrateProject(project) || project;
  const assetIds = (migrated.contentSetup?.assets || []).map((asset) => asset.id);
  const stored = await getAssetsByIds(assetIds);
  const assets = [];

  for (const item of stored) {
    const dataBase64 = await blobToBase64(item.blob);
    assets.push({
      id: item.id,
      name: item.name,
      mimeType: item.mimeType,
      size: item.size,
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
  };

  const blob = new Blob([JSON.stringify(bundle)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  anchor.href = url;
  anchor.download = `project-${stamp}.composer-rapid-bundle.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function importProjectFromFile(file) {
  const text = await file.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }

  // Bundle import
  if (parsed?.format === 'composer-rapid-bundle') {
    if (!isValidProjectShape(parsed.project)) {
      throw new Error('That bundle does not contain a valid Composer Rapid project.');
    }
    const migrated = migrateProject(parsed.project);
    for (const asset of parsed.assets || []) {
      const blob = base64ToBlob(asset.dataBase64, asset.mimeType);
      const result = await putAsset({
        id: asset.id,
        blob,
        meta: {
          name: asset.name,
          mimeType: asset.mimeType,
          size: asset.size,
          kind: asset.kind,
          createdAt: asset.createdAt,
        },
      });
      if (!result.ok) {
        throw new Error(result.error || 'Could not restore an attached file from the bundle.');
      }
    }
    return {
      ...migrated,
      version: PROJECT_VERSION,
      updatedAt: new Date().toISOString(),
    };
  }

  if (!isValidProjectShape(parsed)) {
    throw new Error(
      'That file does not look like a Composer Rapid project. Check the version and required fields.',
    );
  }

  const migrated = migrateProject(parsed);
  return {
    ...migrated,
    version: PROJECT_VERSION,
    updatedAt: new Date().toISOString(),
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
