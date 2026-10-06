/**
 * IndexedDB storage utility for staged photo blobs and Base64 strings.
 * Safely persists large image files client-side without hitting the 5MB localStorage quota limit.
 */

const DB_NAME = 'sbe_staged_photos_db';
const STORE_NAME = 'staged_blobs';
const DB_VERSION = 1;

let dbPromise = null;

function getDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return resolve(null);
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'productName' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      console.warn('[StagedStorage] IndexedDB failed to open:', req.error);
      resolve(null);
    };
  });
  return dbPromise;
}

/**
 * Save Base64 data for a staged product
 */
export async function saveStagedBase64(productName, base64Data, publicId = '') {
  if (!productName || !base64Data) return;
  try {
    const db = await getDb();
    if (!db) return;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put({
        productName: productName.trim().toLowerCase(),
        rawName: productName,
        publicId,
        base64Data,
        savedAt: Date.now()
      });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (e) {
    console.warn('[StagedStorage] Failed to save staged Base64:', e);
  }
}

/**
 * Retrieve Base64 data for a product
 */
export async function getStagedBase64(productName) {
  if (!productName) return null;
  try {
    const db = await getDb();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(productName.trim().toLowerCase());
      req.onsuccess = () => resolve(req.result ? req.result.base64Data : null);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

/**
 * Get all staged photo records
 */
export async function getAllStagedPhotos() {
  try {
    const db = await getDb();
    if (!db) return [];
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch (e) {
    return [];
  }
}

/**
 * Remove a single staged photo
 */
export async function removeStagedBase64(productName) {
  if (!productName) return;
  try {
    const db = await getDb();
    if (!db) return;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(productName.trim().toLowerCase());
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (e) {
    console.warn('[StagedStorage] Failed to delete staged Base64:', e);
  }
}

/**
 * Clear all staged photos after batch commit or discard
 */
export async function clearAllStagedBase64() {
  try {
    const db = await getDb();
    if (!db) return;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (e) {
    console.warn('[StagedStorage] Failed to clear staged Base64:', e);
  }
}
