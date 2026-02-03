
import { ref } from 'vue';
import axios from 'axios';
import { toast } from 'vue3-toastify';

export function useStockData(isLocal) {
    const stockData = ref([]);
    const loading = ref(false);
    const isRefreshing = ref(false);
    const error = ref(null);
    const lastRefresh = ref(null);
    const uploading = ref({});
    const uploadErrors = ref({});
    const imageFiles = ref({});
    const CACHE_KEY = 'sbe_stock_data_cache';
    const REMOTE_DATA_URL = 'https://sahilsync07.github.io/sbe/assets/stock-data.json';

    // Check if network is fast enough for background fetch
    const isNetworkFast = () => {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (!connection) return true; // Assume fast if API unavailable

        // Check connection type
        const type = connection.effectiveType || connection.type;
        if (type === '2g' || type === 'slow-2g') return false;

        // Check downlink speed (Mbps)
        const downlink = connection.downlink;
        if (downlink && downlink < 0.5) return false;

        return true;
    };

    // Helper: Custom Grouping Interceptor
    const processCustomGroups = (data) => {
        if (!Array.isArray(data)) return data;

        // Custom Rule: P-TOES PARALITE
        const targetName = "P-TOES PARALITE";
        let foundProduct = null;
        let originalGroupIndex = -1;

        // 1. Find the product
        for (let i = 0; i < data.length; i++) {
            const group = data[i];
            const pIndex = group.products.findIndex(p => p.productName.toUpperCase() === targetName);

            if (pIndex !== -1) {
                foundProduct = group.products[pIndex];
                // Remove from original group
                group.products.splice(pIndex, 1);
                // If group is empty, mark for cleanup (optional, skipping for safety)
                break;
            }
        }

        // 2. Create new group if found
        if (foundProduct) {
            // Check if group already exists (avoid dupes on re-runs)
            const existingGroup = data.find(g => g.groupName === targetName);
            if (!existingGroup) {
                data.push({
                    groupName: targetName,
                    products: [foundProduct],
                    isSpecial: true // Optional flag for styling
                });
            }
        }

        return data;
    };

    // Fetch Initial Data
    const loadStockData = async () => {
        loading.value = true;
        let hasData = false;

        // --- Tier 1: LocalStorage Cache (Instant) ---
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (parsed && Array.isArray(parsed)) {
                    stockData.value = processCustomGroups(parsed);
                    hasData = true;
                    loading.value = false; // Show cached data immediately
                    console.log("Loaded stock data from LocalStorage Cache (Tier 1)");
                }
            } catch (e) {
                console.error("Cache parse error", e);
                localStorage.removeItem(CACHE_KEY);
            }
        }

        // --- Tier 2: Local Bundle (Fast Fallback for First Time) ---
        // If no cache, try fetching the local file bundled with the app
        if (!hasData) {
            try {
                const baseUrl = import.meta.env.BASE_URL.endsWith('/')
                    ? import.meta.env.BASE_URL
                    : `${import.meta.env.BASE_URL}/`;

                const localUrl = `${baseUrl}assets/stock-data.json`;
                console.log("Attempting Local Bundle fetch:", localUrl);

                const response = await fetch(localUrl);
                if (response.ok) {
                    const localData = await response.json();
                    stockData.value = processCustomGroups(localData);
                    hasData = true;
                    loading.value = false; // Show local data
                    console.log("Loaded stock data from Local Bundle (Tier 2)");

                    // Seed the cache so next time is Tier 1
                    try {
                        localStorage.setItem(CACHE_KEY, JSON.stringify(localData));
                    } catch (e) { }
                }
            } catch (localErr) {
                console.warn("Local Bundle fetch failed:", localErr);
            }
        }

        // --- Tier 3: Live Network Fetch (Always Validate) ---
        try {
            console.log("Starting Background Live Fetch (Tier 3)...");

            // 5 second max wait time for live data
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const liveUrl = "https://sahilsync07.github.io/sbe/assets/stock-data.json";
            const response = await fetch(`${liveUrl}?t=${new Date().getTime()}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                const liveData = await response.json();

                // Update UI with fresh data
                stockData.value = processCustomGroups(liveData);

                // Update Cache
                localStorage.setItem(CACHE_KEY, JSON.stringify(liveData));

                console.log("Updated stock data from Live URL (Tier 3)");

                if (!hasData) {
                    loading.value = false; // Stop loading if we were still waiting
                }
            } else {
                throw new Error("Live fetch failed");
            }
        } catch (liveErr) {
            console.warn("Background live fetch failed or timed out:", liveErr);
            if (!hasData) {
                // Only show error if we strictly have NO data (Tier 1, 2, and 3 all failed)
                error.value = "Failed to load stock data. Please check connection.";
                toast.error(error.value, { autoClose: 3000 });
                loading.value = false;
            }
        }

        // Process Metadata (run on whatever data we have)
        if (stockData.value.length > 0) {
            const data = stockData.value;
            const metaIndex = data.findIndex((g) => g.groupName === "_META_DATA_");
            if (metaIndex !== -1) {
                const meta = data[metaIndex];
                if (meta.lastSync) {
                    lastRefresh.value = new Date(meta.lastSync);
                }
                // Don't splice metadata out of the reactive array to avoid issues with cache consistency or re-runs
                // Ideally, we filter it out in the view, but the current app likely splices it. 
                // Since we might be saving to cache, splicing it removes it from cache for next time.
                // Let's splice it for the VIEW, but note:
                // If we splice, stockData is modified.
                data.splice(metaIndex, 1);
            } else {
                lastRefresh.value = null;
            }
            error.value = null;
        }
    };

    // Update Data (Admin)
    const updateStockData = async () => {
        loading.value = true;
        error.value = null;
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/updateStockData`
            );
            let data = response.data.data;

            const metaIndex = data.findIndex((g) => g.groupName === "_META_DATA_");
            if (metaIndex !== -1) {
                const meta = data[metaIndex];
                if (meta.lastSync) {
                    lastRefresh.value = new Date(meta.lastSync);
                }
                data.splice(metaIndex, 1);
            } else {
                lastRefresh.value = new Date();
            }

            stockData.value = processCustomGroups(data);
            // Update Cache on Admin Sync too
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));

            toast.success("Stock data updated successfully!", { autoClose: 2500 });
        } catch (err) {
            error.value = err.response?.data?.error || "Failed to update stock data";
            toast.error(error.value, { autoClose: 3000 });
        } finally {
            loading.value = false;
        }
    };

    // Image Upload
    const handleFileChange = (event, productName) => {
        imageFiles.value[productName] = event.target.files[0];
        uploadErrors.value[productName] = null;
    };

    const uploadImage = async (productName) => {
        if (!imageFiles.value[productName]) return;
        uploading.value[productName] = true;
        uploadErrors.value[productName] = null;
        try {
            const formData = new FormData();
            formData.append("file", imageFiles.value[productName]);
            formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
            const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                { method: "POST", body: formData }
            );
            const data = await response.json();

            if (!data.secure_url) {
                throw new Error("Upload failed");
            }

            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/updateImage`, {
                productName,
                imageUrl: data.secure_url,
            });

            // Optimistic Update
            stockData.value = stockData.value.map((group) => ({
                ...group,
                products: group.products.map((product) =>
                    product.productName === productName
                        ? { ...product, imageUrl: data.secure_url, imageUploadedAt: new Date().toISOString() }
                        : product
                ),
            }));

            // Update Cache
            localStorage.setItem(CACHE_KEY, JSON.stringify(stockData.value));

            toast.success("Image uploaded updated!", { autoClose: 2500 });
        } catch (err) {
            uploadErrors.value[productName] = "Failed to load image";
            toast.error(uploadErrors.value[productName], { autoClose: 3000 });
        } finally {
            uploading.value[productName] = false;
            imageFiles.value[productName] = null;
        }
    };

    const deleteImage = async (productName) => {
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/removeImage`, {
                productName,
            });

            stockData.value = stockData.value.map((group) => ({
                ...group,
                products: group.products.map((product) =>
                    product.productName === productName
                        ? { ...product, imageUrl: null }
                        : product
                ),
            }));

            // Update Cache
            localStorage.setItem(CACHE_KEY, JSON.stringify(stockData.value));

            toast.success(`Image removed for ${productName}.`, { autoClose: 2500 });
        } catch (err) {
            toast.error("Failed to remove image", { autoClose: 3000 });
        }
    };

    // Manual refresh for Android - force fetch fresh data
    const refreshStockData = async () => {
        isRefreshing.value = true;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout for manual refresh

            const response = await fetch(`${REMOTE_DATA_URL}?t=${Date.now()}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                let data = await response.json();

                // Process metadata
                const metaIndex = data.findIndex((g) => g.groupName === "_META_DATA_");
                if (metaIndex !== -1) {
                    const meta = data[metaIndex];
                    if (meta.lastSync) {
                        lastRefresh.value = new Date(meta.lastSync);
                    }
                    data.splice(metaIndex, 1);
                }

                stockData.value = processCustomGroups(data);
                localStorage.setItem(CACHE_KEY, JSON.stringify(data));
                toast.success('Data updated!', { autoClose: 2000 });
            } else {
                throw new Error('Fetch failed');
            }
        } catch (err) {
            console.warn('Refresh failed:', err);
            toast.error('Update failed. Try again.', { autoClose: 2000 });
        } finally {
            isRefreshing.value = false;
        }
    };

    return {
        stockData,
        loading,
        isRefreshing,
        error,
        lastRefresh,
        uploading,
        uploadErrors,
        imageFiles,
        loadStockData,
        updateStockData,
        refreshStockData,
        handleFileChange,
        uploadImage,
        deleteImage,
        isNetworkFast
    };
}
