
import { ref } from 'vue';
import { toast } from 'vue3-toastify';

export function useAdmin() {
    // Restore persisted admin state
    const savedRole = localStorage.getItem('sbe_admin_role');
    const isAdmin = ref(savedRole === 'admin');
    const isSuperAdmin = ref(savedRole === 'superadmin');

    const promptAdminLogin = () => {
        // If already admin, skip
        if (isAdmin.value || isSuperAdmin.value) return;

        const password = prompt("Enter admin password:");
        if (!password) return;

        if (password === "admin123") {
            isAdmin.value = true;
            isSuperAdmin.value = false;
            localStorage.setItem('sbe_admin_role', 'admin');
            toast.success("Admin Mode Enabled", { autoClose: 2000 });
        } else if (password === "superadmin") {
            isAdmin.value = false;
            isSuperAdmin.value = true;
            localStorage.setItem('sbe_admin_role', 'superadmin');
            toast.success("Super Admin Mode Enabled", { autoClose: 2000 });
        } else {
            toast.error("Incorrect password", { autoClose: 3000 });
        }
    };

    return {
        isAdmin,
        isSuperAdmin,
        promptAdminLogin
    };
}
