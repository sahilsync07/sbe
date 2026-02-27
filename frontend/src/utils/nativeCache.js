import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { useAdmin } from '../composables/useAdmin';
import { store } from '../store';
import { toast } from 'vue3-toastify';

/**
 * Downloads a single image to the device's Data directory.
 */
async function downloadAndCacheImage(url, cacheKey) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network error');
        const blob = await response.blob();

        // Convert Blob to Base64 to save via capacitor filesystem
        const base64Data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

        await Filesystem.writeFile({
            path: `image_cache/${cacheKey}.jpg`,
            data: base64Data,
            directory: Directory.Data
        });
        return true;
    } catch (e) {
        console.error(`Failed to cache ${cacheKey}:`, e);
        return false;
    }
}

/**
 * Perform a Delta Sync:
 * 1. Checks which images are already on the device.
 * 2. Compares with current stock-data.json.
 * 3. Downloads missing images and deletes old/orphaned images.
 */
export async function performDeltaSync() {
    if (!Capacitor.isNativePlatform()) return; // Only runs on Android/iOS natively

    const { isAdmin, isSuperAdmin } = useAdmin();
    if (!isAdmin.value && !isSuperAdmin.value) return;

    if (store.isSyncing) return;
    store.isSyncing = true;

    try {
        // 1. Fetch latest stock-data
        const response = await fetch('/assets/stock-data.json');
        const stockData = await response.json();

        // Flatten all required image URLs and gen their cacheKeys
        const requiredImages = new Map();
        for (const group of stockData) {
            if (group.groupName === '_META_DATA_') continue;
            for (const prod of group.products) {
                if (prod.imageUrl) {
                    // Keep it simple: hash or sanitize the URL. The app uses getCacheKeyUrl in utils
                    // Assuming product name is basically unique enough for the cache key
                    const safeName = prod.productName.replace(/[^a-zA-Z0-9]/g, '_');
                    requiredImages.set(safeName, prod.imageUrl);
                }
            }
        }

        // 2. Scan existing Directory.Data/image_cache/
        let existingFiles = [];
        try {
            const result = await Filesystem.readdir({
                path: 'image_cache',
                directory: Directory.Data
            });
            existingFiles = result.files.map(f => f.name.replace('.jpg', ''));
        } catch (e) {
            // Directory probably doesn't exist yet, create it!
            await Filesystem.mkdir({
                path: 'image_cache',
                directory: Directory.Data,
                recursive: true
            });
        }

        // 3. Delta Delete (Orphaned images)
        let deletedCount = 0;
        for (const fileKey of existingFiles) {
            if (!requiredImages.has(fileKey)) {
                await Filesystem.deleteFile({
                    path: `image_cache/${fileKey}.jpg`,
                    directory: Directory.Data
                });
                deletedCount++;
            }
        }

        // 4. Delta Download (Missing images)
        let downloadedCount = 0;
        const requiredKeys = Array.from(requiredImages.keys());

        // Batch processing to avoid overwhelming memory
        const BATCH_SIZE = 5;
        let batch = [];

        for (const key of requiredKeys) {
            if (!existingFiles.includes(key)) {
                batch.push(key);
            }

            if (batch.length >= BATCH_SIZE) {
                await Promise.all(batch.map(k => downloadAndCacheImage(requiredImages.get(k), k)));
                downloadedCount += batch.length;
                batch = [];
            }
        }
        if (batch.length > 0) {
            await Promise.all(batch.map(k => downloadAndCacheImage(requiredImages.get(k), k)));
            downloadedCount += batch.length;
        }

        if (downloadedCount > 0 || deletedCount > 0) {
            console.log(`Delta Sync Complete: Downloaded ${downloadedCount}, Deleted ${deletedCount}`);
            toast.info(`Offline Cache Synced (+${downloadedCount}, -${deletedCount})`, { autoClose: 3000, position: 'bottom-center' });
        }

        store.setSyncTime(new Date().toISOString());

    } catch (err) {
        console.error("Delta Sync Failed", err);
    } finally {
        store.isSyncing = false;
    }
}

/**
 * Function to resolve an image immediately from local storage if checking existence
 */
export async function getLocalImageUri(cacheKey) {
    if (!Capacitor.isNativePlatform()) return null;

    try {
        const safeName = cacheKey.replace(/[^a-zA-Z0-9]/g, '_');
        const path = `image_cache/${safeName}.jpg`;

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
        return null; // Not found locally
    }
}
