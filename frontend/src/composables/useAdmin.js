import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppStore } from '../stores/appStore';
import { toast } from 'vue3-toastify';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const isNative = Capacitor.isNativePlatform();
let initialized = false;
const isLoginModalOpen = ref(false);

const STORAGE_KEY = 'sbe_admin_role';

const hashPassword = async (msg) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(msg);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Platform-aware persistence helpers.
 * - Android (native): Uses Capacitor Preferences (persistent across sessions — personal device).
 * - Web (GitHub Pages): Uses sessionStorage (expires when tab/browser closes — shared/public access).
 */
const getStoredRole = async () => {
    if (isNative) {
        const { value } = await Preferences.get({ key: STORAGE_KEY });
        return value;
    }
    return sessionStorage.getItem(STORAGE_KEY);
};

const setStoredRole = async (role) => {
    if (isNative) {
        await Preferences.set({ key: STORAGE_KEY, value: role });
    } else {
        sessionStorage.setItem(STORAGE_KEY, role);
    }
};

const removeStoredRole = async () => {
    if (isNative) {
        await Preferences.remove({ key: STORAGE_KEY });
    } else {
        sessionStorage.removeItem(STORAGE_KEY);
    }
};

export function useAdmin() {
    const appStore = useAppStore();
    const { isAdmin, isSuperAdmin } = storeToRefs(appStore);

    const checkAdminState = async () => {
        if (initialized) return;
        initialized = true;
        try {
            // One-time cleanup: Remove old Capacitor Preferences localStorage entries on web
            // that were causing permanent admin persistence
            if (!isNative) {
                const oldKey = '_cap_' + STORAGE_KEY;
                if (localStorage.getItem(oldKey)) {
                    localStorage.removeItem(oldKey);
                }
            }

            const value = await getStoredRole();
            if (value === 'admin') {
                appStore.setAdmin(true);
                appStore.setSuperAdmin(false);
            } else if (value === 'superadmin') {
                appStore.setAdmin(false);
                appStore.setSuperAdmin(true);
            }
        } catch (e) {
            console.error('Failed to load admin state', e);
        }
    };

    // Call immediately (it will only run once)
    checkAdminState();

    const openAdminLogin = () => {
        if (isAdmin.value || isSuperAdmin.value) return;
        isLoginModalOpen.value = true;
    };

    const login = async (password) => {
        if (!password) return false;

        const hash = await hashPassword(password);

        if (hash === "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9") {
            appStore.setAdmin(true);
            appStore.setSuperAdmin(false);
            await setStoredRole('admin');
            toast.success("Admin Mode Enabled", { autoClose: 2000 });
            isLoginModalOpen.value = false;
            return true;
        } else if (hash === "889a3a791b3875cfae413574b53da4bb8a90d53e7bfb616a1b24479e390c29ed") {
            appStore.setAdmin(false);
            appStore.setSuperAdmin(true);
            await setStoredRole('superadmin');
            toast.success("Super Admin Mode Enabled", { autoClose: 2000 });
            isLoginModalOpen.value = false;
            return true;
        } else {
            toast.error("Incorrect password", { autoClose: 3000 });
            return false;
        }
    };

    const logout = async () => {
        appStore.setAdmin(false);
        appStore.setSuperAdmin(false);
        await removeStoredRole();
        initialized = false; // Allow re-check if needed
        toast.success("Logged out", { autoClose: 2000 });
    };

    return {
        isAdmin,
        isSuperAdmin,
        isLoginModalOpen,
        openAdminLogin,
        login,
        logout,
        checkAdminState
    };
}
