const DB_NAME = 'clipper-studio-obsidian';
const DB_VERSION = 1;
const STORE_NAME = 'handles';
const VAULT_HANDLE_KEY = 'vaultRootHandle';

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function withStore(mode, runner) {
  return openDb().then(
    db =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);
        let result;
        try {
          result = runner(store);
        } catch (err) {
          reject(err);
          return;
        }
        tx.oncomplete = () => {
          db.close();
          resolve(result);
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error || new Error('IndexedDB transaction failed'));
        };
      })
  );
}

export function normalizePathSegments(raw) {
  return String(raw || '')
    .split(/[\\/]+/)
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => part.replace(/^\.+|\.+$/g, '').trim())
    .filter(Boolean);
}

export async function saveVaultRootHandle(handle) {
  if (!handle) throw new Error('Vault handle is required');
  await withStore('readwrite', store => {
    store.put(handle, VAULT_HANDLE_KEY);
  });
}

export async function getVaultRootHandle() {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const request = store.get(VAULT_HANDLE_KEY);
  return await new Promise((resolve, reject) => {
    request.onerror = () => {
      db.close();
      reject(request.error || new Error('Failed to read vault handle'));
    };
    request.onsuccess = () => {
      const handle = request.result || null;
      tx.oncomplete = () => {
        db.close();
        resolve(handle);
      };
    };
  });
}

export async function clearVaultRootHandle() {
  await withStore('readwrite', store => {
    store.delete(VAULT_HANDLE_KEY);
  });
}

export async function queryHandlePermission(handle, mode = 'readwrite') {
  if (!handle || typeof handle.queryPermission !== 'function') return 'prompt';
  try {
    return await handle.queryPermission({ mode });
  } catch {
    return 'prompt';
  }
}

export async function requestHandlePermission(handle, mode = 'readwrite') {
  if (!handle || typeof handle.requestPermission !== 'function') return 'denied';
  try {
    return await handle.requestPermission({ mode });
  } catch {
    return 'denied';
  }
}

export async function ensureDirectoryHandle(rootHandle, pathSegments, create = true) {
  let current = rootHandle;
  for (const part of pathSegments) {
    current = await current.getDirectoryHandle(part, { create });
  }
  return current;
}

export async function writeTextFileByPath(rootHandle, pathSegments, content) {
  if (!Array.isArray(pathSegments) || pathSegments.length < 1) throw new Error('Invalid file path');
  const dirPath = pathSegments.slice(0, -1);
  const fileName = pathSegments[pathSegments.length - 1];
  const dirHandle = await ensureDirectoryHandle(rootHandle, dirPath, true);
  const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

export async function writeBlobFileByPath(rootHandle, pathSegments, blob) {
  if (!Array.isArray(pathSegments) || pathSegments.length < 1) throw new Error('Invalid file path');
  const dirPath = pathSegments.slice(0, -1);
  const fileName = pathSegments[pathSegments.length - 1];
  const dirHandle = await ensureDirectoryHandle(rootHandle, dirPath, true);
  const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}

function splitNameExt(fileName) {
  const value = String(fileName || '').trim();
  const idx = value.lastIndexOf('.');
  if (idx <= 0 || idx === value.length - 1) return { name: value, ext: '' };
  return { name: value.slice(0, idx), ext: value.slice(idx) };
}

async function fileExistsInDirectory(dirHandle, fileName) {
  try {
    await dirHandle.getFileHandle(fileName, { create: false });
    return true;
  } catch {
    return false;
  }
}

export async function resolveUniqueFilePath(rootHandle, pathSegments) {
  if (!Array.isArray(pathSegments) || pathSegments.length < 1) throw new Error('Invalid file path');
  const dirPath = pathSegments.slice(0, -1);
  const fileName = pathSegments[pathSegments.length - 1];
  const dirHandle = await ensureDirectoryHandle(rootHandle, dirPath, true);
  const exists = await fileExistsInDirectory(dirHandle, fileName);
  if (!exists) return [...pathSegments];

  const { name, ext } = splitNameExt(fileName);
  for (let i = 2; i < 10000; i += 1) {
    const candidate = `${name} (${i})${ext}`;
    const hit = await fileExistsInDirectory(dirHandle, candidate);
    if (!hit) return [...dirPath, candidate];
  }
  throw new Error('Too many duplicate file names');
}

export function buildRelativePath(fromDirSegments, toPathSegments) {
  const from = Array.isArray(fromDirSegments) ? fromDirSegments : [];
  const to = Array.isArray(toPathSegments) ? toPathSegments : [];
  let i = 0;
  while (i < from.length && i < to.length && from[i] === to[i]) i += 1;
  const up = new Array(from.length - i).fill('..');
  const down = to.slice(i);
  const out = [...up, ...down].join('/');
  return out || '.';
}

async function readFileTextSafe(fileHandle) {
  try {
    const file = await fileHandle.getFile();
    return await file.text();
  } catch {
    return '';
  }
}

async function readObsidianAppConfig(vaultRootHandle) {
  if (!vaultRootHandle) return '';
  try {
    const obsidianDir = await vaultRootHandle.getDirectoryHandle('.obsidian', { create: false });
    const appConfigHandle = await obsidianDir.getFileHandle('app.json', { create: false });
    const text = await readFileTextSafe(appConfigHandle);
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function detectObsidianAttachmentFolder(vaultRootHandle) {
  const json = await readObsidianAppConfig(vaultRootHandle);
  const value = typeof json?.attachmentFolderPath === 'string' ? json.attachmentFolderPath.trim() : '';
  return value || '';
}

export async function detectObsidianNewNoteFolder(vaultRootHandle) {
  const json = await readObsidianAppConfig(vaultRootHandle);
  if (!json || json?.newFileLocation !== 'folder') return '';
  const value = typeof json?.newFileFolderPath === 'string' ? json.newFileFolderPath.trim() : '';
  return value || '';
}

export async function detectObsidianNewNoteRule(vaultRootHandle) {
  const json = await readObsidianAppConfig(vaultRootHandle);
  return {
    location: typeof json?.newFileLocation === 'string' ? json.newFileLocation.trim() : '',
    folder: typeof json?.newFileFolderPath === 'string' ? json.newFileFolderPath.trim() : '',
  }
}
