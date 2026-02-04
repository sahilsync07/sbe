/**
 * useImageCache - Composable for offline image caching
 * Uses the Cache API (industry-standard for PWA image caching)
 */
import { ref, computed } from 'vue';

const CACHE_NAME = 'sbe-images-v1';
const CACHE_VERSION = 1;

// Shared state across component instances
const isCaching = ref(false);
const cacheProgress = ref({ current: 0, total: 0 });
const lastCacheTime = ref(null);
const cachedCount = ref(0);

export function useImageCache() {

    /**
     * Check if Cache API is available
     */
    const isCacheSupported = () => {
        return 'caches' in window;
    };

    /**
     * Check internet speed using a small test download
     * Returns: 'fast' | 'slow' | 'offline'
     */
    const checkInternetSpeed = async () => {
        try {
            // Use a small Cloudinary image for speed test
            const testUrl = 'https://res.cloudinary.com/demo/image/upload/w_10/sample.jpg';
            const startTime = performance.now();

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

            const response = await fetch(testUrl, {
                signal: controller.signal,
                cache: 'no-store'
            });

            clearTimeout(timeout);

            if (!response.ok) return 'slow';

            const endTime = performance.now();
            const duration = endTime - startTime;

            // < 500ms = fast, < 2000ms = slow, else offline-ish
            if (duration < 500) return 'fast';
            if (duration < 2000) return 'slow';
            return 'slow';

        } catch (error) {
            if (error.name === 'AbortError') return 'offline';
            return 'offline';
        }
    };

    /**
     * Get optimized Cloudinary URL for caching (smaller size for storage)
     */
    const getCacheOptimizedUrl = (imageUrl) => {
        if (!imageUrl) return null;
        try {
            const parts = imageUrl.split('/upload/');
            if (parts.length !== 2) return imageUrl;
            // Use w_400 for good quality but reasonable storage
            const transformation = 'w_400,q_70,f_auto';
            return `${parts[0]}/upload/${transformation}/${parts[1]}`;
        } catch (e) {
            return imageUrl;
        }
    };

    /**
     * Cache a single image
     */
    const cacheImage = async (imageUrl) => {
        if (!imageUrl || !isCacheSupported()) return false;

        try {
            const cache = await caches.open(CACHE_NAME);
            const optimizedUrl = getCacheOptimizedUrl(imageUrl);

            // Check if already cached
            const existing = await cache.match(optimizedUrl);
            if (existing) return true;

            // Fetch and cache
            const response = await fetch(optimizedUrl, { mode: 'cors' });
            if (response.ok) {
                await cache.put(optimizedUrl, response.clone());
                return true;
            }
            return false;
        } catch (error) {
            console.warn('Failed to cache image:', imageUrl, error);
            return false;
        }
    };

    /**
     * Cache all product images
     * @param {Array} products - Array of product objects with imageUrl property
     * @param {Function} onProgress - Callback for progress updates (current, total)
     * @returns {Object} - { success: number, failed: number }
     */
    const cacheAllImages = async (products, onProgress = null) => {
        if (!isCacheSupported()) {
            return { success: 0, failed: 0, error: 'Cache API not supported' };
        }

        // Filter products with images
        const productsWithImages = products.filter(p => p.imageUrl);
        const total = productsWithImages.length;

        if (total === 0) {
            return { success: 0, failed: 0, error: 'No images to cache' };
        }

        isCaching.value = true;
        cacheProgress.value = { current: 0, total };

        let success = 0;
        let failed = 0;

        try {
            const cache = await caches.open(CACHE_NAME);

            // Process in batches of 5 for better performance
            const batchSize = 5;
            for (let i = 0; i < productsWithImages.length; i += batchSize) {
                const batch = productsWithImages.slice(i, i + batchSize);

                const results = await Promise.allSettled(
                    batch.map(async (product) => {
                        const optimizedUrl = getCacheOptimizedUrl(product.imageUrl);

                        // Skip if already cached
                        const existing = await cache.match(optimizedUrl);
                        if (existing) return true;

                        const response = await fetch(optimizedUrl, { mode: 'cors' });
                        if (response.ok) {
                            await cache.put(optimizedUrl, response.clone());
                            return true;
                        }
                        throw new Error('Fetch failed');
                    })
                );

                results.forEach(result => {
                    if (result.status === 'fulfilled' && result.value) {
                        success++;
                    } else {
                        failed++;
                    }
                });

                cacheProgress.value = { current: i + batch.length, total };

                if (onProgress) {
                    onProgress(i + batch.length, total);
                }
            }

            lastCacheTime.value = new Date().toISOString();
            localStorage.setItem('sbe_last_cache_time', lastCacheTime.value);

        } catch (error) {
            console.error('Cache operation failed:', error);
        } finally {
            isCaching.value = false;
            cacheProgress.value = { current: total, total };
        }

        // Update cached count
        await updateCachedCount();

        return { success, failed };
    };

    /**
     * Get current cache status
     */
    const getCacheStatus = async () => {
        if (!isCacheSupported()) {
            return { count: 0, supported: false };
        }

        try {
            const cache = await caches.open(CACHE_NAME);
            const keys = await cache.keys();
            cachedCount.value = keys.length;
            return { count: keys.length, supported: true };
        } catch (error) {
            return { count: 0, supported: true, error: error.message };
        }
    };

    /**
     * Update cached count in reactive state
     */
    const updateCachedCount = async () => {
        const status = await getCacheStatus();
        cachedCount.value = status.count;
    };

    /**
     * Clear all cached images
     */
    const clearImageCache = async () => {
        if (!isCacheSupported()) return false;

        try {
            await caches.delete(CACHE_NAME);
            cachedCount.value = 0;
            lastCacheTime.value = null;
            localStorage.removeItem('sbe_last_cache_time');
            return true;
        } catch (error) {
            console.error('Failed to clear cache:', error);
            return false;
        }
    };

    /**
     * Check if a specific image is cached
     */
    const isImageCached = async (imageUrl) => {
        if (!imageUrl || !isCacheSupported()) return false;

        try {
            const cache = await caches.open(CACHE_NAME);
            const optimizedUrl = getCacheOptimizedUrl(imageUrl);
            const response = await cache.match(optimizedUrl);
            return !!response;
        } catch (error) {
            return false;
        }
    };

    /**
     * Get estimated storage size (rough estimate)
     */
    const getEstimatedStorageSize = async () => {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                return {
                    usage: estimate.usage || 0,
                    quota: estimate.quota || 0,
                    usageMB: Math.round((estimate.usage || 0) / 1024 / 1024 * 10) / 10
                };
            } catch (e) {
                return null;
            }
        }
        return null;
    };

    // Load last cache time from storage
    const storedCacheTime = localStorage.getItem('sbe_last_cache_time');
    if (storedCacheTime) {
        lastCacheTime.value = storedCacheTime;
    }

    // Computed
    const progressPercent = computed(() => {
        if (cacheProgress.value.total === 0) return 0;
        return Math.round((cacheProgress.value.current / cacheProgress.value.total) * 100);
    });

    return {
        // State
        isCaching,
        cacheProgress,
        lastCacheTime,
        cachedCount,
        progressPercent,

        // Methods
        isCacheSupported,
        checkInternetSpeed,
        cacheAllImages,
        cacheImage,
        getCacheStatus,
        clearImageCache,
        isImageCached,
        getEstimatedStorageSize,
        updateCachedCount
    };
}
