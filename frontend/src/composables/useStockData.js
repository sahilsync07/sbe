import { ref } from 'vue';
import axios from 'axios';
import { toast } from 'vue3-toastify';
import { Capacitor } from '@capacitor/core';
import { useAppStore } from '../stores/appStore';
import { storeToRefs } from 'pinia';
import { extractColor } from '../utils/colors.js';

const SYNC_KEY = 'sbe_last_sync_timestamp';
const REMOTE_DATA_URL = 'https://raw.githubusercontent.com/sahilsync07/sbe/refs/heads/main/frontend/public/assets/stock-data.json';

/**
 * Fast stream reader that extracts lastSync from the _META_DATA_ header of stock-data.json
 * without downloading the entire 3.8MB catalog.
 */
export async function fetchStockMetadataLastSync() {
    const appStore = useAppStore();

    const applySync = (isoString) => {
        if (!isoString) return null;
        const date = new Date(isoString);
        if (!isNaN(date.getTime())) {
            appStore.setSyncTime(date);
            try {
                localStorage.setItem(SYNC_KEY, isoString);
            } catch (e) {}
            return date;
        }
        return null;
    };

    // 1. Try remote GitHub raw (fast stream of first ~8KB)
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const remoteUrl = `${REMOTE_DATA_URL}?t=${Date.now()}`;
        const res = await fetch(remoteUrl, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
            if (res.body && res.body.getReader) {
                const reader = res.body.getReader();
                let text = '';
                while (true) {
                    const { done, value } = await reader.read();
                    if (value) {
                        text += new TextDecoder().decode(value);
                        const match = text.match(/"lastSync"\s*:\s*"([^"]+)"/);
                        if (match) {
                            await reader.cancel();
                            const date = applySync(match[1]);
                            if (date) return date;
                        }
                    }
                    if (done || text.length > 25000) break;
                }
            } else {
                const headText = await res.text();
                const match = headText.slice(0, 5000).match(/"lastSync"\s*:\s*"([^"]+)"/);
                if (match) {
                    const date = applySync(match[1]);
                    if (date) return date;
                }
            }
        }
    } catch (e) {
        // Fall through to local bundle
    }

    // 2. Try local bundle assets/stock-data.json
    try {
        const baseUrl = import.meta.env.BASE_URL.endsWith('/')
            ? import.meta.env.BASE_URL
            : `${import.meta.env.BASE_URL}/`;
        const localUrl = `${baseUrl}assets/stock-data.json?t=${Date.now()}`;
        const res = await fetch(localUrl);
        if (res.ok) {
            if (res.body && res.body.getReader) {
                const reader = res.body.getReader();
                let text = '';
                while (true) {
                    const { done, value } = await reader.read();
                    if (value) {
                        text += new TextDecoder().decode(value);
                        const match = text.match(/"lastSync"\s*:\s*"([^"]+)"/);
                        if (match) {
                            await reader.cancel();
                            const date = applySync(match[1]);
                            if (date) return date;
                        }
                    }
                    if (done || text.length > 25000) break;
                }
            } else {
                const headText = await res.text();
                const match = headText.slice(0, 5000).match(/"lastSync"\s*:\s*"([^"]+)"/);
                if (match) {
                    const date = applySync(match[1]);
                    if (date) return date;
                }
            }
        }
    } catch (e) {
        // Fall through to localStorage
    }

    // 3. Fallback to localStorage
    try {
        const saved = localStorage.getItem(SYNC_KEY);
        if (saved) {
            const date = applySync(saved);
            if (date) return date;
        }
    } catch (e) {}

    return null;
}

/**
 * Generate clean, standardized Cloudinary public_id from product name
 * Example: 'PARAGON VERTEX BLK/RED 7*10 @399' -> 'PARAGON_VERTEX_BLK_RED'
 */
export function generateProductPublicId(productName) {
    if (!productName) return `PRODUCT_${Date.now()}`;
    const colorInfo = extractColor(productName);
    let colorSlug = '';
    if (colorInfo && colorInfo.originalTokens && colorInfo.originalTokens.length > 0) {
        colorSlug = colorInfo.originalTokens.join('_').toUpperCase();
    } else if (colorInfo && colorInfo.text) {
        colorSlug = colorInfo.text.replace(/[^A-Za-z0-9]/g, '_').toUpperCase();
    }

    let clean = productName;
    if (colorInfo && colorInfo.originalTokens) {
        colorInfo.originalTokens.forEach(t => { 
            clean = clean.replace(new RegExp('(?:\\b|[\\/\\-_])' + t + '(?:\\b|[\\/\\-_])', 'gi'), ' '); 
        });
    }
    clean = clean.replace(/((?:RS|MRP|@))[\.\s]*(\d+(\.\d+)?)/gi, '');
    clean = clean.replace(/(?:^|[\s\(])(\d{1,2})\s*[xX*]\s*(\d{1,2})(?:[\s\)]|$)/g, ' ');
    clean = clean.replace(/\(\s*\)/g, '');
    clean = clean.replace(/[\/\-\_\.\,\:\&]+/g, ' ');

    const articleSlug = clean.trim().replace(/\s+/g, '_').replace(/[^A-Za-z0-9_]/g, '').toUpperCase();
    const parts = [articleSlug];
    if (colorSlug) parts.push(colorSlug.replace(/[^A-Za-z0-9_]/g, ''));
    const slug = parts.filter(Boolean).join('_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    return slug || `PRODUCT_${Date.now()}`;
}

/**
 * Robust UTF-8 to Base64 encoder that handles arbitrary size without call stack overflow
 */
function utf8ToBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    const len = bytes.byteLength;
    const chunkSize = 8192;
    for (let i = 0; i < len; i += chunkSize) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunkSize, len)));
    }
    return btoa(binary);
}

/**
 * Sequential async queue ensuring GitHub file commits never stomp each other with SHA race conditions
 */
let syncQueuePromise = Promise.resolve();
function enqueueSync(taskFn) {
    const next = syncQueuePromise.then(taskFn, taskFn);
    syncQueuePromise = next.catch(() => {});
    return next;
}

const getGitHubToken = () => {
    return import.meta.env.VITE_GITHUB_TOKEN || 
           localStorage.getItem('sbe_github_token') || 
           '';
};

/**
 * Direct commit to GitHub repository via GitHub REST API with auto-retry on 409 SHA conflict
 */
async function commitFileToGitHub(filePath, updatedContentString, commitMessage) {
    const token = getGitHubToken();
    const owner = import.meta.env.VITE_GITHUB_OWNER || 'sahilsync07';
    const repo = import.meta.env.VITE_GITHUB_REPO || 'sbe';
    const branch = import.meta.env.VITE_GITHUB_BRANCH || 'main';

    if (!token) {
        console.warn('[GitHub Sync] No GitHub token configured; skipping direct GitHub commit');
        return null;
    }

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
    };

    let retries = 3;
    while (retries > 0) {
        // 1. Fetch current file SHA
        const metaRes = await fetch(`${apiUrl}?ref=${branch}&_t=${Date.now()}`, { headers });
        if (!metaRes.ok) {
            throw new Error(`Failed to fetch file SHA for ${filePath} (${metaRes.status})`);
        }
        const metaData = await metaRes.json();
        const currentSha = metaData.sha;

        // 2. Commit update
        const b64Content = utf8ToBase64(updatedContentString);
        const putRes = await fetch(apiUrl, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                message: commitMessage,
                content: b64Content,
                sha: currentSha,
                branch
            })
        });

        if (putRes.status === 409) {
            console.warn(`[GitHub Sync] SHA conflict on ${filePath}, retrying with fresh SHA...`);
            retries--;
            await new Promise(r => setTimeout(r, 800));
            continue;
        }

        if (!putRes.ok) {
            const errBody = await putRes.json().catch(() => ({}));
            throw new Error(errBody.message || `GitHub commit failed (${putRes.status})`);
        }

        const putData = await putRes.json();
        console.log(`[GitHub Sync] Successfully committed ${filePath}: ${putData.commit?.sha?.slice(0, 7)}`);
        return putData;
    }
    throw new Error(`Failed to commit ${filePath} to GitHub after retry attempts due to SHA conflict`);
}

export function useStockData(isLocal) {
    const appStore = useAppStore();
    const { stockData, isRefreshing, lastSyncTime: lastRefresh } = storeToRefs(appStore);
    
    const loading = ref(false);
    const error = ref(null);
    const uploading = ref({});
    const uploadErrors = ref({});
    const imageFiles = ref({});
    const CACHE_KEY = 'sbe_stock_data_cache';

    // Check if truly on a local node dev server (native mobile devices should always fetch live remote)
    const isLocalMachine = () => {
        if (Capacitor.isNativePlatform()) return false;
        if (isLocal && isLocal.value !== undefined) return isLocal.value;
        return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    };

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

        try {
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
                if (isLocalMachine()) {
                    console.log("Skipping Live Fetch on local machine.");
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
                }
            } catch (liveErr) {
                console.warn("Background live fetch failed or timed out:", liveErr);
                if (!hasData) {
                    error.value = "Failed to load stock data. Please check connection.";
                }
            }

            // Final Metadata Clean-up for views
            if (stockData.value && Array.isArray(stockData.value) && stockData.value.length > 0) {
                extractAndApplyMetadata(stockData.value);
                const data = stockData.value;
                const metaIndex = data.findIndex((g) => g.groupName === "_META_DATA_");
                if (metaIndex !== -1) {
                    data.splice(metaIndex, 1);
                }
                error.value = null;
            }
        } finally {
            loading.value = false;
        }
    };

    // Update Data (Admin)
    const updateStockData = async () => {
        loading.value = true;
        error.value = null;
        const toastId = toast.loading("Syncing stock & ledger data from Tally... Please wait.", { autoClose: false, closeButton: false });
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/updateStockData`,
                {},
                { timeout: 180000 } // 3 minutes timeout to give Tally ample time to compute stock & voucher summaries
            );
            
            const resData = response.data;
            let data = resData.data;

            toast.remove(toastId);

            if (resData.tallyError || resData.message?.includes('existing data') || resData.message?.includes('Tally unavailable')) {
                toast.warning('Tally is offline — showing cached data', { autoClose: 4000 });
                return;
            }

            if (!data || !Array.isArray(data)) {
                toast.error('Unexpected response: ' + (resData.message || 'No data returned'), { autoClose: 4000 });
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

            toast.success(`✓ Stock synced (${data.length} brands updated)!`, { autoClose: 3000 });
        } catch (err) {
            console.error(err);
            toast.remove(toastId);

            let userMsg = '';
            if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error') || err.code === 'ECONNREFUSED') {
                userMsg = 'Sync server is offline or unreachable (Make sure local sync server is running).';
            } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
                userMsg = 'Sync request timed out after waiting. Please verify Tally connection and ensure Tally is responsive.';
            } else {
                userMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to update stock';
            }

            error.value = userMsg;
            toast.error(userMsg, { autoClose: 4500 });
        } finally {
            loading.value = false;
        }
    };

    const handleFileChange = (event, productName) => {
        const file = event?.target?.files?.[0];
        if (file) {
            imageFiles.value[productName] = file;
            uploadErrors.value[productName] = null;
        }
    };

    const syncImageChange = async (productName, newImageUrl) => {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
        let backendSuccess = false;

        // A. Attempt local backend first (with 2500ms timeout)
        try {
            const endpoint = newImageUrl ? `${backendUrl}/api/updateImage` : `${backendUrl}/api/removeImage`;
            const payload = newImageUrl ? { productName, imageUrl: newImageUrl } : { productName };
            const res = await axios.post(endpoint, payload, { timeout: 2500 });
            if (res.status === 200) {
                backendSuccess = true;
                console.log(`[Sync] Updated via local backend for ${productName}`);
            }
        } catch (backendErr) {
            console.log(`[Sync] Local backend unavailable (${backendErr.message}), falling back to direct GitHub sync`);
        }

        // B. If local backend unavailable (Phone, 4G, remote, or server offline): direct GitHub API commit!
        if (!backendSuccess) {
            await enqueueSync(async () => {
                let fullCatalog = stockData.value;
                if (!fullCatalog || !Array.isArray(fullCatalog) || fullCatalog.length === 0) {
                    try {
                        const res = await fetch(`${REMOTE_DATA_URL}?_t=${Date.now()}`);
                        if (res.ok) {
                            fullCatalog = await res.json();
                        }
                    } catch (e) {
                        console.warn('[Sync] Could not fetch remote catalog:', e.message);
                    }
                }

                if (!fullCatalog || !Array.isArray(fullCatalog)) {
                    throw new Error('Catalog data not available for GitHub sync');
                }

                // Update catalog image reference
                fullCatalog.forEach(group => {
                    if (!group.products || !Array.isArray(group.products)) return;
                    group.products.forEach(p => {
                        if (p.productName === productName) {
                            p.imageUrl = newImageUrl || null;
                            if (newImageUrl) {
                                p.imageUploadedAt = new Date().toISOString();
                            } else {
                                delete p.imageUploadedAt;
                            }
                        }
                    });
                });

                const jsonString = JSON.stringify(fullCatalog, null, 2);
                const commitMessage = newImageUrl ? `Update image for ${productName}` : `Remove image for ${productName}`;

                // Commit to frontend
                await commitFileToGitHub('frontend/public/assets/stock-data.json', jsonString, commitMessage);

                // Mirror commit to sbe-hub
                try {
                    await commitFileToGitHub('sbe-hub/public/assets/stock-data.json', jsonString, commitMessage);
                } catch (hubErr) {
                    console.warn('[Sync] SBE Hub mirror sync non-fatal warning:', hubErr.message);
                }
            });
        }
    };

    const uploadImage = async (productOrName, fileOverride = null) => {
        const productName = typeof productOrName === 'object' ? productOrName?.productName : productOrName;
        if (!productName) return null;

        const file = fileOverride || imageFiles.value[productName];
        if (!file) {
            toast.warning('Please select an image file first.', { autoClose: 2500 });
            return null;
        }

        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dg365ewal';
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'sbe-stock';

        uploading.value[productName] = true;
        uploadErrors.value[productName] = null;
        const toastId = toast.loading(`Uploading photo for ${productName}...`, { autoClose: false, closeButton: false });

        try {
            // 1. Direct upload to Cloudinary using unsigned preset + smart public ID
            const publicId = generateProductPublicId(productName);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', uploadPreset);
            formData.append('public_id', publicId);

            let uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                body: formData
            });

            // Resilient fallback: If preset disallows custom public_id, retry without public_id
            if (!uploadRes.ok) {
                const errData = await uploadRes.json().catch(() => ({}));
                if (errData.error?.message?.toLowerCase().includes('public_id')) {
                    console.warn('Cloudinary preset does not permit public_id override; retrying with default public_id...');
                    const fallbackFormData = new FormData();
                    fallbackFormData.append('file', file);
                    fallbackFormData.append('upload_preset', uploadPreset);
                    uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                        method: 'POST',
                        body: fallbackFormData
                    });
                }
            }

            if (!uploadRes.ok) {
                const errData = await uploadRes.json().catch(() => ({}));
                throw new Error(errData.error?.message || `Cloudinary upload failed (HTTP ${uploadRes.status})`);
            }

            const uploadData = await uploadRes.json();
            const newImageUrl = uploadData.secure_url;
            if (!newImageUrl) {
                throw new Error('No image URL returned from upload provider');
            }

            // 2. Instant Optimistic UI & localStorage update (Zero latency on screen)
            const nowIso = new Date().toISOString();
            if (stockData.value && Array.isArray(stockData.value)) {
                stockData.value.forEach(group => {
                    (group.products || []).forEach(p => {
                        if (p.productName === productName) {
                            p.imageUrl = newImageUrl;
                            p.imageUploadedAt = nowIso;
                        }
                    });
                });
                try {
                    localStorage.setItem(CACHE_KEY, JSON.stringify(stockData.value));
                } catch (e) {}
            }

            if (typeof productOrName === 'object' && productOrName) {
                productOrName.imageUrl = newImageUrl;
                productOrName.imageUploadedAt = nowIso;
            }

            delete imageFiles.value[productName];

            // 3. Persist change: Local backend if available, or direct GitHub API
            await syncImageChange(productName, newImageUrl);

            toast.remove(toastId);
            toast.success(`✓ Photo uploaded & catalog synced!`, { autoClose: 3000 });
            return newImageUrl;
        } catch (err) {
            console.error('Error uploading image:', err);
            toast.remove(toastId);
            uploadErrors.value[productName] = err.message;
            toast.error(`Upload failed: ${err.message}`, { autoClose: 4500 });
            return null;
        } finally {
            uploading.value[productName] = false;
        }
    };

    const deleteImage = async (productOrName) => {
        const productName = typeof productOrName === 'object' ? productOrName?.productName : productOrName;
        if (!productName) return false;

        if (!confirm(`Are you sure you want to remove the photo for "${productName}"?`)) {
            return false;
        }

        uploading.value[productName] = true;
        const toastId = toast.loading(`Removing photo for ${productName}...`, { autoClose: false, closeButton: false });

        try {
            // 1. Instant Optimistic UI & localStorage update
            if (stockData.value && Array.isArray(stockData.value)) {
                stockData.value.forEach(group => {
                    (group.products || []).forEach(p => {
                        if (p.productName === productName) {
                            p.imageUrl = null;
                            delete p.imageUploadedAt;
                        }
                    });
                });
                try {
                    localStorage.setItem(CACHE_KEY, JSON.stringify(stockData.value));
                } catch (e) {}
            }

            if (typeof productOrName === 'object' && productOrName) {
                productOrName.imageUrl = null;
                delete productOrName.imageUploadedAt;
            }

            delete imageFiles.value[productName];

            // 2. Persist change: Local backend if available, or direct GitHub API
            await syncImageChange(productName, null);

            toast.remove(toastId);
            toast.success(`✓ Photo removed & catalog synced!`, { autoClose: 2500 });
            return true;
        } catch (err) {
            console.error('Error removing image:', err);
            toast.remove(toastId);
            toast.error(`Failed to remove photo: ${err.message}`, { autoClose: 4000 });
            return false;
        } finally {
            uploading.value[productName] = false;
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
        handleFileChange,
        uploadImage,
        deleteImage,
        fetchStockMetadataLastSync
    };
}
