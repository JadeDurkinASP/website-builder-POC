import {
  ACCEPTED_DOCUMENT_TYPES,
  ACCEPTED_IMAGE_TYPES,
  MAX_DOCUMENT_BYTES,
  MAX_IMAGE_BYTES,
  MAX_PROJECT_BYTES,
} from '../constants';

const DB_NAME = 'composer-rapid-assets';
const STORE_NAME = 'assets';
const DB_VERSION = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open asset storage.'));
  });
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore(mode, executor) {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const store = tx.objectStore(STORE_NAME);
      let settled = false;

      Promise.resolve()
        .then(() => executor(store, requestToPromise))
        .then((value) => {
          settled = true;
          resolve(value);
        })
        .catch((error) => {
          settled = true;
          reject(error);
        });

      tx.oncomplete = () => {
        if (!settled) resolve(undefined);
      };
      tx.onerror = () => {
        if (!settled) reject(tx.error || new Error('Asset storage transaction failed.'));
      };
    });
  } finally {
    db.close();
  }
}

export function createAssetId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `asset-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function classifyFile(file) {
  const type = file?.type || '';
  const name = (file?.name || '').toLowerCase();

  if (ACCEPTED_IMAGE_TYPES.includes(type) || /\.(png|jpe?g|webp)$/.test(name)) {
    return 'image';
  }
  if (
    ACCEPTED_DOCUMENT_TYPES.includes(type) ||
    /\.(pdf|docx|txt)$/.test(name)
  ) {
    return 'document';
  }
  return null;
}

export function validateUploadFile(file, existingAssets = []) {
  if (!file) return { ok: false, error: 'No file selected.' };

  const kind = classifyFile(file);
  if (!kind) {
    return {
      ok: false,
      error: 'Unsupported file type. Use PDF, Word (.docx), PNG, JPG, WebP or plain text (.txt).',
    };
  }

  if (kind === 'image' && file.size > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      error: `Images must be under ${Math.round(MAX_IMAGE_BYTES / 1024)} KB.`,
    };
  }

  if (kind === 'document' && file.size > MAX_DOCUMENT_BYTES) {
    return {
      ok: false,
      error: `Documents must be under ${Math.round(MAX_DOCUMENT_BYTES / (1024 * 1024))} MB.`,
    };
  }

  const currentTotal = existingAssets.reduce((sum, asset) => sum + (asset.size || 0), 0);
  if (currentTotal + file.size > MAX_PROJECT_BYTES) {
    return {
      ok: false,
      error: `This project can store up to ${Math.round(MAX_PROJECT_BYTES / (1024 * 1024))} MB of attachments in total.`,
    };
  }

  return { ok: true, kind };
}

export async function putAsset({ id, blob, meta }) {
  try {
    await withStore('readwrite', (store, toPromise) =>
      toPromise(
        store.put({
          id,
          blob,
          name: meta.name,
          mimeType: meta.mimeType,
          size: meta.size,
          kind: meta.kind,
          createdAt: meta.createdAt,
        }),
      ),
    );
    return { ok: true };
  } catch (error) {
    const isQuota =
      error?.name === 'QuotaExceededError' || /quota/i.test(String(error?.message ?? ''));
    return {
      ok: false,
      error: isQuota
        ? 'Could not store that file — browser storage is full. Remove another attachment or export your project first.'
        : 'Could not store that file in this browser.',
    };
  }
}

export async function getAsset(id) {
  if (!id) return null;
  return withStore('readonly', (store, toPromise) => toPromise(store.get(id)));
}

export async function deleteAsset(id) {
  if (!id) return;
  await withStore('readwrite', (store, toPromise) => toPromise(store.delete(id)));
}

export async function getAssetsByIds(ids = []) {
  const unique = [...new Set(ids.filter(Boolean))];
  const results = await Promise.all(unique.map((id) => getAsset(id)));
  return results.filter(Boolean);
}

export async function clearAllAssets() {
  await withStore('readwrite', (store, toPromise) => toPromise(store.clear()));
}

export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Could not read file data.'));
    reader.readAsDataURL(blob);
  });
}

export function base64ToBlob(base64, mimeType) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType || 'application/octet-stream' });
}

export async function addFileAsAsset(file, existingAssets = []) {
  const validation = validateUploadFile(file, existingAssets);
  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  const id = createAssetId();
  const meta = {
    id,
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    kind: validation.kind,
    status: 'attached',
    createdAt: new Date().toISOString(),
  };

  const result = await putAsset({ id, blob: file, meta });
  if (!result.ok) return result;
  return { ok: true, meta };
}
