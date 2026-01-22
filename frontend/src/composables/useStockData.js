
import { ref } from 'vue';
import axios from 'axios';
import { toast } from 'vue3-toastify';

export function useStockData(isLocal) {
    const stockData = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const lastRefresh = ref(null);
    const uploading = ref({});
    const uploadErrors = ref({});
    const imageFiles = ref({});

    // Fetch Initial Data
    const loadStockData = async () => {
        let data = null;

        // 1. Try Live URL (for freshest data)
        try {
            // 5 second max wait time for live data. If slower, just use local.
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            // Using the production URL explicitly to ensure we get updates
            const liveUrl = "https://sahilsync07.github.io/sbe/assets/stock-data.json";
            const response = await fetch(`${liveUrl}?t=${new Date().getTime()}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId); // Clear timeout on success

            if (response.ok) {
                data = await response.json();
                console.log("Loaded stock data from Live URL");
            } else {
                throw new Error("Live fetch failed");
            }
        } catch (liveErr) {
            console.warn("Could not fetch live data (or timed out), falling back to local:", liveErr);
        }

        // 2. Fallback to Local (if live failed)
        if (!data) {
            try {
                const localUrl = `${import.meta.env.BASE_URL}assets/stock-data.json`;
                const response = await fetch(localUrl);
                if (response.ok) {
                    data = await response.json();
                    console.log("Loaded stock data from Local Bundle");
                }
            } catch (localErr) {
                console.error("Local fetch also failed:", localErr);
            }
        }

        if (data) {
            // Check for Metadata
            const metaIndex = data.findIndex((g) => g.groupName === "_META_DATA_");
            if (metaIndex !== -1) {
                const meta = data[metaIndex];
                if (meta.lastSync) {
                    lastRefresh.value = new Date(meta.lastSync);
                }
                data.splice(metaIndex, 1);
            } else {
                lastRefresh.value = null;
            }

            stockData.value = data;
            error.value = null;
        } else {
            error.value = isLocal.value
                ? "Failed to fetch stock data (Live & Local)"
                : "Failed to load stock-data.json";
            stockData.value = [];
            toast.error(error.value, { autoClose: 3000 });
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

            stockData.value = data;
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

            toast.success(`Image removed for ${productName}.`, { autoClose: 2500 });
        } catch (err) {
            toast.error("Failed to remove image", { autoClose: 3000 });
        }
    };

    return {
        stockData,
        loading,
        error,
        lastRefresh,
        uploading,
        uploadErrors,
        imageFiles,
        loadStockData,
        updateStockData,
        handleFileChange,
        uploadImage,
        deleteImage
    };
}
