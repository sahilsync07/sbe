import { ref } from 'vue';
import { toast } from 'vue3-toastify';
import { Preferences } from '@capacitor/preferences';

// Shared state so multiple components calling useAdmin() get the same ref
const isAdmin = ref(false);
const isSuperAdmin = ref(false);
let initialized = false;

export function useAdmin() {
    // Restore persisted admin state asynchronously once
    const checkAdminState = async () => {
        if (initialized) return;
        initialized = true;
        try {
            const { value } = await Preferences.get({ key: 'sbe_admin_role' });
            if (value === 'admin') {
                isAdmin.value = true;
                isSuperAdmin.value = false;
            } else if (value === 'superadmin') {
                isAdmin.value = false;
                isSuperAdmin.value = true;
            }
        } catch (e) {
            console.error('Failed to load admin state', e);
        }
    };

    // Call immediately (it will only run once)
    checkAdminState();

    const promptAdminLogin = async () => {
        // If already admin, skip
        if (isAdmin.value || isSuperAdmin.value) return;

        const password = prompt("Enter admin password:");
        if (!password) return;

        if (password === "admin123") {
            isAdmin.value = true;
            isSuperAdmin.value = false;
            await Preferences.set({ key: 'sbe_admin_role', value: 'admin' });
            toast.success("Admin Mode Enabled", { autoClose: 2000 });
        } else if (password === "superadmin") {
            isAdmin.value = false;
            isSuperAdmin.value = true;
            await Preferences.set({ key: 'sbe_admin_role', value: 'superadmin' });
            toast.success("Super Admin Mode Enabled", { autoClose: 2000 });
        } else {
            toast.error("Incorrect password", { autoClose: 3000 });
        }
    };

    return {
        isAdmin,
        isSuperAdmin,
        promptAdminLogin,
        checkAdminState
    };
}
