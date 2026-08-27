import { ref } from 'vue';
import axios from 'axios';
import { toast } from 'vue3-toastify';
import { useAppStore } from '../stores/appStore';
import { storeToRefs } from 'pinia';

export function useStockData(isLocal) {
    const appStore = useAppStore();
    const { stockData, isRefreshing, lastSyncTime: lastRefresh } = storeToRefs(appStore);
    
    const loading = ref(false);
    const error = ref(null);
    const uploading = ref({});
    const uploadErrors = ref({});
    const imageFiles = ref({});
    const CACHE_KEY = 'sbe_stock_data_cache';
    const SYNC_KEY = 'sbe_last_sync_timestamp';
    const REMOTE_DATA_URL = 'https://raw.githubusercontent.com/sahilsync07/sbe/refs/heads/main/frontend/public/assets/stock-data.json';

    // Safely extract and apply metadata timestamp from any data array
    const extractAndApplyMetadata = (dataArray) => {
        if (!dataArray || !Array.isArray(dataArray)) return;
        const metaItem = dataArray.find(g => g.groupName === '_META_DATA_' || g.group === '_META_DATA_');
        if (metaItem && metaItem.lastSync) {
            const syncDate = new Date(metaItem.lastSync);
            if (!isNaN(syncDate.getTime())) {
                lastRefresh.value = syncDate;
                appStore.setSyncTime(syncDate);
                try {
                    localStorage.setItem(SYNC_KEY, metaItem.lastSync);
                } catch (e) {}
            }
        }
    };

    // Initialize persisted sync time immediately
    try {
        const savedSync = localStorage.getItem(SYNC_KEY);
        if (savedSync && !lastRefresh.value) {
            const parsed = new Date(savedSync);
            if (!isNaN(parsed.getTime())) {
                lastRefresh.value = parsed;
                appStore.setSyncTime(parsed);
            }
        }
    } catch (e) {}

    // Helper: Custom Grouping Interceptor
    const processCustomGroups = (data) => {
        if (!Array.isArray(data)) return data;

        // Custom Rule: P-TOES PARALITE
        const targetName = "P-TOES PARALITE";
        let foundProduct = null;

        for (let i = 0; i < data.length; i++) {
            const group = data[i];
            if (!group.products || group.groupName === '_META_DATA_') continue;
            const pIndex = group.products.findIndex(p => p.productName && p.productName.toUpperCase() === targetName);

            if (pIndex !== -1) {
                foundProduct = group.products[pIndex];
                group.products.splice(pIndex, 1);
                break;
            }
        }

        if (foundProduct) {
            const existingGroup = data.find(g => g.groupName === targetName);
            if (!existingGroup) {
                data.push({
                    groupName: targetName,
                    products: [foundProduct],
                    isSpecial: true
                });
            }
        }

        // Extract Ajanta from Airson into its own group
        const airsonGroup = data.find(g => g.groupName === 'Airson' || g.group === 'Airson');
        if (airsonGroup && airsonGroup.brands) {
            const ajantaBrands = airsonGroup.brands.filter(b => b.brand === 'AJANTA');
            if (ajantaBrands.length > 0) {
                airsonGroup.brands = airsonGroup.brands.filter(b => b.brand !== 'AJANTA');
                if (!data.some(g => g.groupName === 'AJANTA')) {
                    data.push({
                        groupName: 'AJANTA',
                        group: 'AJANTA',
                        brands: ajantaBrands,
                        products: ajantaBrands.flatMap(b => b.products || [])
                    });
                }
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
                    extractAndApplyMetadata(parsed);
                    stockData.value = processCustomGroups(parsed);
                    hasData = true;
                    loading.value = false;
                    console.log("Loaded stock data from LocalStorage Cache (Tier 1), sync:", lastRefresh.value);
                }
            } catch (e) {
                console.error("Cache parse error", e);
                localStorage.removeItem(CACHE_KEY);
            }
        }

        // --- Tier 2: Local Bundle (Fast Fallback for First Time) ---
        if (!hasData) {
            try {
                const baseUrl = import.meta.env.BASE_URL.endsWith('/')
                    ? import.meta.env.BASE_URL
                    : `${import.meta.env.BASE_URL}/`;

                const localUrl = `${baseUrl}assets/stock-data.json`;
                console.log("Attempting Local Bundle fetch:", localUrl);

                const response = await fetch(`${localUrl}?t=${Date.now()}`);
                if (response.ok) {
                    const localData = await response.json();
                    extractAndApplyMetadata(localData);
                    stockData.value = processCustomGroups(localData);
                    hasData = true;
                    loading.value = false;
                    console.log("Loaded stock data from Local Bundle (Tier 2), sync:", lastRefresh.value);

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
            if (isLocal && isLocal.value) {
                console.log("Skipping Live Fetch on localhost.");
                return;
            }
            console.log("Starting Background Live Fetch (Tier 3)...");

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 7000);

            const liveUrl = REMOTE_DATA_URL;

            // Simple GET request without custom headers avoids CORS OPTIONS preflight check
            const response = await fetch(`${liveUrl}?t=${Date.now()}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                const liveData = await response.json();
                extractAndApplyMetadata(liveData);
                stockData.value = processCustomGroups(liveData);

                try {
                    localStorage.setItem(CACHE_KEY, JSON.stringify(liveData));
                } catch (e) {}

                console.log("Updated stock data from Live URL (Tier 3), sync:", lastRefresh.value);

                if (!hasData) {
                    loading.value = false;
                }
            } else {
                throw new Error("Live fetch failed");
            }
        } catch (liveErr) {
            console.warn("Background live fetch failed or timed out:", liveErr);
            if (!hasData) {
                error.value = "Failed to load stock data. Please check connection.";
                toast.error(error.value, { autoClose: 3000 });
                loading.value = false;
            }
        }

        // Final Metadata Clean-up for views
        if (stockData.value.length > 0) {
            extractAndApplyMetadata(stockData.value);
            const data = stockData.value;
            const metaIndex = data.findIndex((g) => g.groupName === "_META_DATA_");
            if (metaIndex !== -1) {
                data.splice(metaIndex, 1);
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
            
            const resData = response.data;
            let data = resData.data;

            if (resData.tallyError || resData.message?.includes('existing data') || resData.message?.includes('Tally unavailable')) {
                toast.warning('Tally is offline — showing cached data', { autoClose: 4000 });
                loading.value = false;
                return;
            }

            if (!data || !Array.isArray(data)) {
                toast.error('Unexpected response from server', { autoClose: 3000 });
                loading.value = false;
                return;
            }

            extractAndApplyMetadata(data);
            stockData.value = processCustomGroups(data);
            
            try {
                localStorage.setItem(CACHE_KEY, JSON.stringify(data));
            } catch (e) {}

            const metaIndex = data.findIndex((g) => g.groupName === "_META_DATA_");
            if (metaIndex !== -1) {
                data.splice(metaIndex, 1);
            }

            toast.success('Stock data updated successfully!', { autoClose: 2000 });
        } catch (err) {
            console.error(err);
            error.value = "Failed to update stock data: " + (err.response?.data?.error || err.message);
            toast.error(error.value, { autoClose: 4000 });
        } finally {
            loading.value = false;
        }
    };

    const uploadImage = async (product, file, groupName) => {
        const key = product.productName;
        uploading.value[key] = true;
        uploadErrors.value[key] = null;

        const formData = new FormData();
        formData.append('image', file);
        formData.append('productName', product.productName);
        formData.append('groupName', groupName);

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/uploadImage`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            product.imageUrl = response.data.imageUrl;
            delete imageFiles.value[key];
            toast.success('Image uploaded successfully!', { autoClose: 2000 });
        } catch (err) {
            console.error(err);
            uploadErrors.value[key] = err.response?.data?.error || err.message;
            toast.error(`Failed to upload image: ${uploadErrors.value[key]}`, { autoClose: 4000 });
        } finally {
            uploading.value[key] = false;
        }
    };

    return {
        stockData,
        loading,
        error,
        uploading,
        uploadErrors,
        imageFiles,
        lastRefresh,
        isRefreshing,
        loadStockData,
        updateStockData,
        uploadImage
    };
}
