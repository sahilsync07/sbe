import { ref } from 'vue';
import axios from 'axios';
import { toast } from 'vue3-toastify';
import { Capacitor } from '@capacitor/core';
import { useAppStore } from '../stores/appStore';
import { storeToRefs } from 'pinia';
import { extractColor } from '../utils/colors.js';
import { useGitHubTokenModal, DEFAULT_GITHUB_TOKEN } from './useGitHubTokenModal';
import { isPrimaryCloudDown, markCloudFailed } from '../utils/cloudStatus.js';

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
    return localStorage.getItem('sbe_github_token') || 
           import.meta.env.VITE_GITHUB_TOKEN || 
           DEFAULT_GITHUB_TOKEN || 
           '';
};

/**
 * Direct commit to GitHub repository via GitHub REST API with auto-retry on 409 SHA conflict
 */
async function commitFileToGitHub(filePath, updatedContentString, commitMessage, tokenOverride = null) {
    const token = tokenOverride || getGitHubToken();
    const owner = import.meta.env.VITE_GITHUB_OWNER || 'sahilsync07';
    const repo = import.meta.env.VITE_GITHUB_REPO || 'sbe';
    const branch = import.meta.env.VITE_GITHUB_BRANCH || 'main';

    if (!token) {
        console.warn('[GitHub Sync] No GitHub token configured; skipping direct GitHub commit');
        const err = new Error('No GitHub token configured');
        err.status = 401;
        throw err;
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
        if (metaRes.status === 401 || metaRes.status === 403) {
            const err = new Error(`GitHub authentication failed (${metaRes.status}): Bad credentials or token expired`);
            err.status = metaRes.status;
            throw err;
        }
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

        if (putRes.status === 401 || putRes.status === 403) {
            const err = new Error(`GitHub commit authentication failed (${putRes.status}): Bad credentials or token expired`);
            err.status = putRes.status;
            throw err;
        }

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
    const { promptForToken } = useGitHubTokenModal();
    
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

        // Step 1: Attempt local backend first (PC with server running, 2500ms timeout)
        try {
            const endpoint = newImageUrl ? `${backendUrl}/api/updateImage` : `${backendUrl}/api/removeImage`;
            const payload = newImageUrl ? { productName, imageUrl: newImageUrl } : { productName };
            const res = await axios.post(endpoint, payload, { 
                timeout: 2500,
                validateStatus: (status) => status < 500 // Don't throw Axios error on 404 or non-200 responses
            });
            if (res.status === 200 && res.data?.success !== false) {
                backendSuccess = true;
                console.log(`[Sync] Step 1 passed: Updated via local backend for ${productName}`);
                return { success: true, via: 'backend' };
            }
        } catch (backendErr) {
            console.log(`[Sync] Step 1: Local backend offline or bypassed (${backendErr.message}), falling back to direct GitHub sync`);
        }

        // Step 2 & 3: GitHub direct sync
        return await enqueueSync(async () => {
            // Step 2: Check if GitHub token is already present
            let token = getGitHubToken();

            // Step 3: If token not present, prompt user with modal
            if (!token) {
                console.log('[Sync] Step 3: GitHub token missing, prompting user via modal...');
                token = await promptForToken('missing');
                if (!token) {
                    console.warn('[Sync] User canceled GitHub token modal');
                    return { success: false, reason: 'canceled' };
                }
            }

            // Always fetch the freshest remote stock-data to prevent overwriting parallel updates
            let fullCatalog = null;
            try {
                const res = await fetch(`${REMOTE_DATA_URL}?_t=${Date.now()}`);
                if (res.ok) {
                    fullCatalog = await res.json();
                }
            } catch (e) {
                console.warn('[Sync] Could not fetch remote catalog, falling back to local memory:', e.message);
            }
            if (!fullCatalog || !Array.isArray(fullCatalog) || fullCatalog.length === 0) {
                fullCatalog = stockData.value;
            }

            if (!fullCatalog || !Array.isArray(fullCatalog)) {
                throw new Error('Catalog data not available for GitHub sync');
            }

            // Update catalog image reference with case-insensitive & trimmed matching
            const targetNorm = (productName || '').trim().toLowerCase();
            fullCatalog.forEach(group => {
                if (!group.products || !Array.isArray(group.products)) return;
                group.products.forEach(p => {
                    const prodNorm = (p.productName || '').trim().toLowerCase();
                    if (p.productName === productName || (prodNorm && prodNorm === targetNorm)) {
                        p.imageUrl = newImageUrl || null;
                        if (newImageUrl) {
                            p.secondaryImageUrl = newImageUrl;
                            p.imageUploadedAt = new Date().toISOString();
                        } else {
                            p.secondaryImageUrl = null;
                            delete p.imageUploadedAt;
                        }
                    }
                });
            });

            const jsonString = JSON.stringify(fullCatalog, null, 2);
            const commitMessage = newImageUrl ? `Update image for ${productName}` : `Remove image for ${productName}`;

            // Helper to execute commits with automatic expired-token handling (Step 3 popup if 401)
            const executeCommit = async (currentToken) => {
                try {
                    const resFrontend = await commitFileToGitHub('frontend/public/assets/stock-data.json', jsonString, commitMessage, currentToken);
                    if (!resFrontend) {
                        return { success: false, reason: 'commit_failed' };
                    }

                    // Mirror commit to sbe-hub
                    try {
                        await commitFileToGitHub('sbe-hub/public/assets/stock-data.json', jsonString, commitMessage, currentToken);
                    } catch (hubErr) {
                        console.warn('[Sync] SBE Hub mirror sync non-fatal warning:', hubErr.message);
                    }

                    return { success: true, via: 'github' };
                } catch (commitErr) {
                    if (commitErr.status === 401 || commitErr.status === 403 || commitErr.message?.includes('401') || commitErr.message?.includes('Bad credentials')) {
                        console.warn('[Sync] GitHub token expired or unauthorized (401), prompting user...');
                        const freshToken = await promptForToken('expired');
                        if (freshToken) {
                            const resRetry = await commitFileToGitHub('frontend/public/assets/stock-data.json', jsonString, commitMessage, freshToken);
                            try {
                                await commitFileToGitHub('sbe-hub/public/assets/stock-data.json', jsonString, commitMessage, freshToken);
                            } catch (hubErr) {}
                            return { success: true, via: 'github' };
                        }
                        return { success: false, reason: 'expired' };
                    }
                    throw commitErr;
                }
            };

            return await executeCommit(token);
        });
    };

    /**
     * Compress image before upload using native Canvas API (reduces 4-8MB camera photo to ~120KB)
     */
    const compressImageFile = async (file, maxWidth = 1200, maxHeight = 1200, quality = 0.82) => {
        if (!file || !file.type || !file.type.startsWith('image/')) return file;
        return new Promise((resolve) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(url);
                let { width, height } = img;
                if (width > maxWidth || height > maxHeight) {
                    if (width > height) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(
                    (blob) => {
                        if (blob && blob.size < file.size) {
                            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
                        } else {
                            resolve(file);
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = () => resolve(file);
            img.src = url;
        });
    };

    /**
     * Upload image directly to permanent free GitHub Photos CDN repository (sahilsync07/sbe-photos)
     * Images served via fast global jsDelivr CDN: https://cdn.jsdelivr.net/gh/sahilsync07/sbe-photos@main/photos/{publicId}.jpg
     */
    const uploadToGitHubPhotosRepo = async (file, publicId, token) => {
        if (!token) throw new Error('No GitHub token available for CDN upload');

        // Convert file to Base64
        const base64Data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const res = String(reader.result || '');
                const base64String = res.split(',')[1];
                resolve(base64String);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        const fileName = `${publicId}.jpg`;
        const path = `photos/${fileName}`;
        const url = `https://api.github.com/repos/sahilsync07/sbe-photos/contents/${path}`;

        // Check if file already exists to get SHA for in-place update
        let sha = null;
        try {
            const checkRes = await fetch(`${url}?ref=main`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            if (checkRes.ok) {
                const checkData = await checkRes.json();
                sha = checkData.sha;
            }
        } catch (e) {}

        const body = {
            message: `Upload photo for ${publicId}`,
            content: base64Data,
            branch: 'main'
        };
        if (sha) body.sha = sha;

        const res = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || `GitHub CDN upload failed: HTTP ${res.status}`);
        }

        // Return high-speed global jsDelivr CDN URL
        return `https://cdn.jsdelivr.net/gh/sahilsync07/sbe-photos@main/${path}`;
    };

    /**
     * Upload helper for a single Cloudinary instance with resilience against preset restrictions
     */
    const uploadToCloudinaryInstance = async (file, cloudConfig, publicId) => {
        const { cloudName, uploadPreset, folder } = cloudConfig;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);
        if (publicId) formData.append('public_id', publicId);
        if (folder) formData.append('folder', folder);

        let res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData
        });

        // Resilient fallback: If preset disallows custom public_id, retry without public_id
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            if (errData.error?.message?.toLowerCase().includes('public_id')) {
                console.warn(`[Cloudinary ${cloudName}] Preset does not permit public_id override; retrying without public_id...`);
                const fallbackFormData = new FormData();
                fallbackFormData.append('file', file);
                fallbackFormData.append('upload_preset', uploadPreset);
                if (folder) fallbackFormData.append('folder', folder);
                res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                    method: 'POST',
                    body: fallbackFormData
                });
            }
        }

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error?.message || `HTTP ${res.status}`);
        }

        const data = await res.json();
        if (!data.secure_url) {
            throw new Error('No secure_url returned from Cloudinary');
        }
        return data.secure_url;
    };

    const uploadImage = async (productOrName, fileOverride = null) => {
        const productName = typeof productOrName === 'object' ? productOrName?.productName : productOrName;
        if (!productName) return null;

        const file = fileOverride || imageFiles.value[productName];
        if (!file) {
            toast.warning('Please select an image file first.', { autoClose: 2500 });
            return null;
        }

        // Dual-Cloud Configuration: Primary and Secondary with automatic failover
        const clouds = [
            {
                name: 'Primary',
                cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dg365ewal',
                uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'sbe-stock',
                folder: import.meta.env.VITE_CLOUDINARY_FOLDER || ''
            },
            {
                name: 'Secondary',
                cloudName: import.meta.env.VITE_CLOUDINARY_SECONDARY_CLOUD_NAME || 'dieqsg5tr',
                uploadPreset: import.meta.env.VITE_CLOUDINARY_SECONDARY_UPLOAD_PRESET || 'e-sbe-pics',
                folder: import.meta.env.VITE_CLOUDINARY_SECONDARY_FOLDER || 'e-sbe'
            }
        ];

        uploading.value[productName] = true;
        uploadErrors.value[productName] = null;
        const toastId = toast.loading(`Uploading photo for ${productName}...`, { autoClose: false, closeButton: false });

        try {
            const publicId = generateProductPublicId(productName);
            let newImageUrl = null;
            let lastError = null;
            let usedProvider = null;

            // 1. Compress image client-side to ~120KB for fast, lightweight upload
            let uploadFile = file;
            try {
                uploadFile = await compressImageFile(file);
                console.log(`[Upload] Image compressed: ${(file.size / 1024).toFixed(0)}KB -> ${(uploadFile.size / 1024).toFixed(0)}KB`);
            } catch (compErr) {
                console.warn('[Upload] Image compression skipped:', compErr.message);
            }

            // 2. Priority 1: Free GitHub Photos CDN (sahilsync07/sbe-photos via jsDelivr) - 100% Free, zero billing, zero card
            let token = getGitHubToken();
            if (!token) {
                console.log('[Upload] GitHub token missing for CDN upload, prompting user...');
                token = await promptForToken('missing');
            }
            if (token) {
                try {
                    console.log(`[Multi-Cloud] Attempting upload via Free GitHub CDN (sahilsync07/sbe-photos)...`);
                    newImageUrl = await uploadToGitHubPhotosRepo(uploadFile, publicId, token);
                    usedProvider = 'GitHub-CDN';
                    console.log(`[Multi-Cloud] ✓ Upload succeeded via Free GitHub CDN: ${newImageUrl}`);
                } catch (ghErr) {
                    console.warn(`[Multi-Cloud] ⚠️ GitHub CDN upload failed: ${ghErr.message}. Failing over to Cloudinary...`);
                    lastError = ghErr;
                }
            }

            // 3. Priority 2: Failover to Cloudinary Secondary if GitHub CDN was not used or failed
            if (!newImageUrl) {
                for (const cloud of clouds) {
                    if (!cloud.cloudName || !cloud.uploadPreset) continue;
                    if (cloud.name === 'Primary' && isPrimaryCloudDown.value) continue;
                    try {
                        console.log(`[Multi-Cloud] Attempting upload via ${cloud.name} Cloud (${cloud.cloudName})...`);
                        newImageUrl = await uploadToCloudinaryInstance(uploadFile, cloud, publicId);
                        usedProvider = cloud.name;
                        console.log(`[Multi-Cloud] ✓ Upload succeeded via ${cloud.name} Cloud (${cloud.cloudName})`);
                        break;
                    } catch (cloudErr) {
                        console.warn(`[Multi-Cloud] ⚠️ ${cloud.name} Cloud (${cloud.cloudName}) failed: ${cloudErr.message}`);
                        markCloudFailed(cloud.cloudName);
                        lastError = cloudErr;
                    }
                }
            }

            if (!newImageUrl) {
                throw new Error(`Upload failed on all image providers. Last error: ${lastError?.message || 'Unknown error'}`);
            }

            // 4. Instant Optimistic UI & localStorage update (Zero latency on screen)
            const nowIso = new Date().toISOString();
            const targetNorm = (productName || '').trim().toLowerCase();
            if (stockData.value && Array.isArray(stockData.value)) {
                stockData.value.forEach(group => {
                    (group.products || []).forEach(p => {
                        const prodNorm = (p.productName || '').trim().toLowerCase();
                        if (p.productName === productName || (prodNorm && prodNorm === targetNorm)) {
                            p.imageUrl = newImageUrl;
                            p.secondaryImageUrl = newImageUrl;
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
                productOrName.secondaryImageUrl = newImageUrl;
                productOrName.imageUploadedAt = nowIso;
            }

            delete imageFiles.value[productName];

            // 5. Persist change: Local backend if available, or direct GitHub API
            const syncResult = await syncImageChange(productName, newImageUrl);

            toast.remove(toastId);
            const provMsg = usedProvider === 'GitHub-CDN' ? ' (GitHub CDN)' : '';
            if (syncResult && syncResult.success) {
                if (syncResult.via === 'github') {
                    toast.success(`✓ Photo uploaded${provMsg} & committed to GitHub!`, { autoClose: 3500 });
                } else {
                    toast.success(`✓ Photo uploaded${provMsg} & synced to server!`, { autoClose: 3000 });
                }
            } else if (syncResult && syncResult.reason === 'canceled') {
                toast.warning(`Photo uploaded${provMsg}, but GitHub commit canceled (no token entered).`, { autoClose: 5000 });
            } else if (syncResult && syncResult.reason === 'expired') {
                toast.warning(`Photo uploaded${provMsg}, but GitHub token expired.`, { autoClose: 5000 });
            } else if (syncResult && syncResult.reason === 'no_token') {
                toast.warning(`Photo uploaded${provMsg}, but GitHub commit skipped (no GitHub token).`, { autoClose: 5000 });
            } else {
                toast.info(`Photo uploaded${provMsg}.`, { autoClose: 3000 });
            }
            return newImageUrl;
        } catch (err) {
            console.error('Error uploading image:', err);
            toast.remove(toastId);
            uploadErrors.value[productName] = err.message;
            toast.error(`Upload failed: ${err.message}`, { autoClose: 4500 });
            return null;
        } finally {
            toast.remove(toastId);
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
            // 1. Instant Optimistic UI & localStorage update (clears both imageUrl and secondaryImageUrl)
            const targetNorm = (productName || '').trim().toLowerCase();
            if (stockData.value && Array.isArray(stockData.value)) {
                stockData.value.forEach(group => {
                    (group.products || []).forEach(p => {
                        const prodNorm = (p.productName || '').trim().toLowerCase();
                        if (p.productName === productName || (prodNorm && prodNorm === targetNorm)) {
                            p.imageUrl = null;
                            p.secondaryImageUrl = null;
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
                productOrName.secondaryImageUrl = null;
                delete productOrName.imageUploadedAt;
            }

            delete imageFiles.value[productName];

            // 2. Persist change: Local backend if available, or direct GitHub API
            const syncResult = await syncImageChange(productName, null);

            toast.remove(toastId);
            if (syncResult && syncResult.success) {
                if (syncResult.via === 'github') {
                    toast.success(`✓ Photo removed & committed to GitHub!`, { autoClose: 3000 });
                } else {
                    toast.success(`✓ Photo removed & synced to server!`, { autoClose: 2500 });
                }
            } else if (syncResult && (syncResult.reason === 'no_token' || syncResult.reason === 'canceled')) {
                toast.warning(`Photo removed locally, but GitHub commit canceled (no token).`, { autoClose: 4000 });
            } else if (syncResult && syncResult.reason === 'expired') {
                toast.warning(`Photo removed locally, but GitHub token expired.`, { autoClose: 4000 });
            } else {
                toast.success(`✓ Photo removed for ${productName}`, { autoClose: 2500 });
            }
            return true;
        } catch (err) {
            console.error('Error removing image:', err);
            toast.remove(toastId);
            toast.error(`Failed to remove photo: ${err.message}`, { autoClose: 4000 });
            return false;
        } finally {
            toast.remove(toastId);
            uploading.value[productName] = false;
        }
    };

    /**
     * Push all local image additions/updates to GitHub repository in one batch
     */
    const pushPendingPhotosToGitHub = async () => {
        let token = getGitHubToken();
        if (!token) {
            token = await promptForToken('missing');
            if (!token) {
                toast.warning('GitHub Sync Token required to commit pending photos.', { autoClose: 4000 });
                return { success: false, reason: 'no_token' };
            }
        }

        const toastId = toast.loading('Checking local photos against GitHub...', { autoClose: false, closeButton: false });

        try {
            // 1. Fetch live remote catalog
            const res = await fetch(`${REMOTE_DATA_URL}?_t=${Date.now()}`);
            if (!res.ok) throw new Error(`Could not fetch remote catalog (HTTP ${res.status})`);
            const remoteCatalog = await res.json();

            // Map remote products by productName
            const remoteMap = new Map();
            remoteCatalog.forEach(g => {
                (g.products || []).forEach(p => {
                    remoteMap.set(p.productName, p);
                });
            });

            // 2. Scan local catalog for new / updated imageUrls
            const localCatalog = stockData.value || [];
            const pendingUpdates = [];

            localCatalog.forEach(g => {
                (g.products || []).forEach(p => {
                    if (p.imageUrl) {
                        const remoteP = remoteMap.get(p.productName);
                        if (!remoteP || remoteP.imageUrl !== p.imageUrl) {
                            pendingUpdates.push({
                                productName: p.productName,
                                imageUrl: p.imageUrl,
                                imageUploadedAt: p.imageUploadedAt || new Date().toISOString()
                            });
                        }
                    }
                });
            });

            if (pendingUpdates.length === 0) {
                toast.remove(toastId);
                toast.info('Catalog is already up to date with GitHub! (0 pending photos)', { autoClose: 3000 });
                return { success: true, count: 0 };
            }

            toast.remove(toastId);
            const commitToastId = toast.loading(`Committing ${pendingUpdates.length} photos to GitHub...`, { autoClose: false, closeButton: false });

            // 3. Apply updates to remote catalog
            pendingUpdates.forEach(u => {
                const remoteP = remoteMap.get(u.productName);
                if (remoteP) {
                    remoteP.imageUrl = u.imageUrl;
                    remoteP.imageUploadedAt = u.imageUploadedAt;
                }
            });

            const jsonString = JSON.stringify(remoteCatalog, null, 2);
            const commitMessage = `feat(catalog): sync ${pendingUpdates.length} photos from mobile`;

            // Helper to execute commit with expired-token retry
            const doCommit = async (currentToken) => {
                try {
                    await commitFileToGitHub('frontend/public/assets/stock-data.json', jsonString, commitMessage, currentToken);
                    try {
                        await commitFileToGitHub('sbe-hub/public/assets/stock-data.json', jsonString, commitMessage, currentToken);
                    } catch (hubErr) {
                        console.warn('[Sync] SBE Hub mirror warning:', hubErr.message);
                    }
                } catch (commitErr) {
                    if (commitErr.status === 401 || commitErr.status === 403 || commitErr.message?.includes('401') || commitErr.message?.includes('Bad credentials')) {
                        const freshToken = await promptForToken('expired');
                        if (freshToken) {
                            await commitFileToGitHub('frontend/public/assets/stock-data.json', jsonString, commitMessage, freshToken);
                            try {
                                await commitFileToGitHub('sbe-hub/public/assets/stock-data.json', jsonString, commitMessage, freshToken);
                            } catch (e) {}
                            return;
                        }
                    }
                    throw commitErr;
                }
            };

            await doCommit(token);

            toast.remove(commitToastId);
            toast.success(`✓ Successfully committed ${pendingUpdates.length} photos to GitHub!`, { autoClose: 4000 });
            return { success: true, count: pendingUpdates.length };
        } catch (err) {
            toast.remove(toastId);
            console.error('Failed to push pending changes to GitHub:', err);
            toast.error(`Push failed: ${err.message}`, { autoClose: 5000 });
            return { success: false, error: err.message };
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
        fetchStockMetadataLastSync,
        pushPendingPhotosToGitHub
    };
}
