
import { ref } from 'vue';
import { toast } from 'vue3-toastify';

export function useAdmin() {
    const isAdmin = ref(false);
    const isSuperAdmin = ref(false);

    const promptAdminLogin = () => {
        const password = prompt("Enter admin password:");
        if (!password) return;

        if (password === "admin123") {
            isAdmin.value = true;
            isSuperAdmin.value = false;
            toast.success("Admin Mode Enabled", { autoClose: 2000 });
        } else if (password === "superadmin") {
            isAdmin.value = false;
            isSuperAdmin.value = true;
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
