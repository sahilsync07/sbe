import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { getOptimizedImageUrl } from './formatters';

const CACHE_DIR = 'image_cache';
const CACHE_NAME = 'sbe-images-v1';
let isSyncing = false;

/**
 * Generate a safe unique filename key for an image URL and product name
 */
export function getSafeCacheKey(productName, imageUrl) {
  if (!productName && !imageUrl) return 'unknown';
  const namePart = (productName || '').toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 50);
  const urlPart = (imageUrl || '').split('/').pop().split('?')[0].replace(/[^a-z0-9]/gi, '_').slice(0, 30);
  return `${namePart}_${urlPart}`;
}

/**
 * Downloads and saves a single optimized image to device filesystem / web cache
 */
async function downloadAndCacheImage(url, cacheKey) {
  if (!url) return false;
  const optimizedUrl = getOptimizedImageUrl(url) || url;

  try {
    const response = await fetch(optimizedUrl);
    if (!response.ok) return false;
    const blob = await response.blob();

    if (Capacitor.isNativePlatform()) {
      // Convert Blob to Base64
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result;
          if (typeof res === 'string') {
            resolve(res.includes(',') ? res.split(',')[1] : res);
          } else {
            resolve('');
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      if (!base64Data) return false;

      await Filesystem.writeFile({
        path: `${CACHE_DIR}/${cacheKey}.jpg`,
        data: base64Data,
        directory: Directory.Data,
        recursive: true
      });
      return true;
    } else if (typeof window !== 'undefined' && 'caches' in window) {
      // Store in Web CacheStorage API
      const cache = await caches.open(CACHE_NAME);
      await cache.put(url, new Response(blob, {
        headers: { 'Content-Type': blob.type || 'image/jpeg' }
      }));
      return true;
    }
  } catch (e) {
    // Non-fatal per-image error
  }
  return false;
}

/**
 * Returns a local URI (file:// / blob:) for immediate 0ms rendering
 */
export async function getLocalImageUri(cacheKey, originalUrl) {
  if (!cacheKey && !originalUrl) return null;

  if (Capacitor.isNativePlatform()) {
    try {
      const path = `${CACHE_DIR}/${cacheKey}.jpg`;
      const stat = await Filesystem.stat({
        path,
        directory: Directory.Data
      });

      if (stat) {
        const uriResult = await Filesystem.getUri({
          path,
          directory: Directory.Data
        });
        return Capacitor.convertFileSrc(uriResult.uri);
      }
    } catch (e) {
      // Not yet on native disk
    }
  } else if (typeof window !== 'undefined' && 'caches' in window && originalUrl) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(originalUrl);
      if (cached) {
        const blob = await cached.blob();
        return URL.createObjectURL(blob);
      }
    } catch (e) {}
  }

  return null;
}

/**
 * Reads local cached image directly as Base64 (for fast & offline PDF/WhatsApp generation)
 */
export async function fetchCachedImageAsBase64(url, productName) {
  if (!url) return null;
  const cacheKey = getSafeCacheKey(productName, url);

  if (Capacitor.isNativePlatform()) {
    try {
      const path = `${CACHE_DIR}/${cacheKey}.jpg`;
      const fileData = await Filesystem.readFile({
        path,
        directory: Directory.Data
      });

      if (fileData && fileData.data) {
        const dataStr = typeof fileData.data === 'string' ? fileData.data : '';
        return dataStr.startsWith('data:') ? dataStr : `data:image/jpeg;base64,${dataStr}`;
      }
    } catch (e) {
      // Fallback to fetch and cache
    }
  }

  // If not cached locally or on web, fetch optimized URL and cache it
  const optimizedUrl = getOptimizedImageUrl(url) || url;
  try {
    const response = await fetch(optimizedUrl);
    if (!response.ok) return null;
    const blob = await response.blob();

    // Cache in background for next time
    downloadAndCacheImage(url, cacheKey).catch(() => {});

    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return null;
  }
}

/**
 * Perform a gentle, non-blocking Background Delta Sync:
 * 1. Checks which images already exist in device storage.
 * 2. Compares with current stockData array.
 * 3. Downloads ONLY missing images (in batches of 5) using the single w_400 optimized URL.
 * 4. Deletes orphaned/discontinued images to keep device clean.
 */
export async function performDeltaSync(stockDataList = null) {
  if (isSyncing) return;
  isSyncing = true;

  try {
    let data = stockDataList;
    if (!data || !Array.isArray(data) || data.length === 0) {
      try {
        const res = await fetch('/assets/stock-data.json');
        if (res.ok) data = await res.json();
      } catch (e) {}
    }

    if (!data || !Array.isArray(data)) return;

    // Collect all required active images
    const requiredMap = new Map();
    for (const group of data) {
      if (group.groupName === '_META_DATA_' || !group.products) continue;
      for (const prod of group.products) {
        if (prod.imageUrl && prod.imageUrl.trim()) {
          const key = getSafeCacheKey(prod.productName, prod.imageUrl);
          requiredMap.set(key, prod.imageUrl.trim());
        }
      }
    }

    if (Capacitor.isNativePlatform()) {
      // 1. Ensure directory exists and read existing files
      let existingKeys = new Set();
      try {
        const result = await Filesystem.readdir({
          path: CACHE_DIR,
          directory: Directory.Data
        });
        if (result && result.files) {
          result.files.forEach((f) => {
            const name = typeof f === 'string' ? f : f.name;
            if (name) existingKeys.add(name.replace(/\.jpg$/i, ''));
          });
        }
      } catch (e) {
        await Filesystem.mkdir({
          path: CACHE_DIR,
          directory: Directory.Data,
          recursive: true
        }).catch(() => {});
      }

      // 2. Delta Delete: Remove discontinued images
      for (const fileKey of existingKeys) {
        if (!requiredMap.has(fileKey)) {
          await Filesystem.deleteFile({
            path: `${CACHE_DIR}/${fileKey}.jpg`,
            directory: Directory.Data
          }).catch(() => {});
        }
      }

      // 3. Delta Download: Download missing images in gentle batches of 5
      const missingKeys = [];
      for (const [key, url] of requiredMap.entries()) {
        if (!existingKeys.has(key)) {
          missingKeys.push({ key, url });
        }
      }

      if (missingKeys.length > 0) {
        console.log(`[SBE Hub DeltaSync] Syncing ${missingKeys.length} new/missing images in background...`);
        const BATCH_SIZE = 5;
        for (let i = 0; i < missingKeys.length; i += BATCH_SIZE) {
          const chunk = missingKeys.slice(i, i + BATCH_SIZE);
          await Promise.all(chunk.map((item) => downloadAndCacheImage(item.url, item.key)));
          // Brief 50ms pause between batches to keep device responsive
          await new Promise((r) => setTimeout(r, 50));
        }
        console.log(`[SBE Hub DeltaSync] Done! Successfully synced ${missingKeys.length} images.`);
      } else {
        console.log('[SBE Hub DeltaSync] All catalog images are up to date on device.');
      }
    }
  } catch (err) {
    console.warn('[SBE Hub DeltaSync] Sync note:', err);
  } finally {
    isSyncing = false;
  }
}