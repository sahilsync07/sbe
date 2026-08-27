<template>
  <div class="min-h-screen relative" style="background-color: #f8f6f1; background-image: radial-gradient(circle at 85% 15%, rgba(253, 230, 138, 0.4) 0%, rgba(251, 191, 36, 0.12) 35%, transparent 70%), radial-gradient(circle at 15% 85%, rgba(196, 181, 253, 0.3) 0%, rgba(139, 92, 246, 0.1) 35%, transparent 65%); background-repeat: no-repeat; background-attachment: fixed; background-size: cover;">
    <router-view></router-view>
    
    <AdminLoginModal 
       :show="showAdminModal"
       @close="showAdminModal = false"
       @login="handleAdminLogin"
    />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { AppUpdate } from '@capawesome/capacitor-app-update';
import { toast } from 'vue3-toastify';

import AdminLoginModal from '@/components/StockTable/AdminLoginModal.vue';

import { useAppStore } from '@/stores/appStore';
import { useAdmin } from '@/composables/useAdmin';
import { performDeltaSync } from '@/utils/nativeCache';
import { useStockData } from '@/composables/useStockData';

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();

// Extract metadata instantly on cache load
watch(() => appStore.stockData, (newData) => {
  if (newData && newData.length > 0) {
    const meta = newData.find(g => g.groupName === '_META_DATA_' || g.group === '_META_DATA_');
    if (meta && meta.lastSync) {
      appStore.setSyncTime(new Date(meta.lastSync));
    }
  }
}, { deep: true, immediate: true });

// Watch for login query param
watch(() => route.query, async (query) => {
  if (query.pwd) {
    const password = Array.isArray(query.pwd) ? query.pwd[0] : query.pwd;
    const success = await performLogin(password);
    if (success) {
      router.replace({ path: '/', query: { ...query, pwd: undefined } });
    } else {
      router.replace({ query: { ...query, pwd: undefined } });
    }
  } else if (query.login === 'admin') {
    showAdminModal.value = true;
    router.replace({ query: { ...query, login: undefined } });
  }
}, { immediate: true, deep: true });

const showAdminModal = ref(false);

// Load Config (Offline-First)
const loadConfig = async () => {
    const CACHE_KEY = 'sbe-config-cache';
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            appStore.$patch({ config: JSON.parse(cached) });
        }
    } catch (e) {}

    try {
        const configFile = import.meta.env.VITE_CONFIG_FILE || 'sbe.json';
        const response = await fetch(`${import.meta.env.BASE_URL}config/${configFile}?t=${new Date().getTime()}`);
        if (response.ok) {
            const conf = await response.json();
            appStore.$patch({ config: conf });
            try {
                localStorage.setItem(CACHE_KEY, JSON.stringify(conf));
            } catch (e) {}
        }
    } catch (err) {
        console.log('[SBE Hub] Using cached configuration (offline mode).');
    }
};

const { checkAdminState, isAdmin, isSuperAdmin, login: performLogin } = useAdmin();

const isLocal = ref(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const { loadStockData, updateStockData } = useStockData(isLocal);

const handleAdminLogin = async (payload) => {
  const pwd = typeof payload === 'object' ? payload.password : payload;
  const redirectHome = typeof payload === 'object' ? payload.redirectHome : false;
  
  showAdminModal.value = false;
  if (!pwd) return;
  
  const success = await performLogin(pwd);

  if (success && redirectHome) {
    router.push('/');
  }
};

let backListener = null;

onMounted(async () => {
  await loadConfig();
  await checkAdminState();
  await loadStockData();
  await performDeltaSync();
  
  // Android App Update Check
  if (Capacitor.isNativePlatform()) {
    try {
      const info = await AppUpdate.getAppUpdateInfo();
      if (info.updateAvailability === 2) {
        if (info.immediateUpdateAllowed) {
          await AppUpdate.performImmediateUpdate();
        } else if (info.flexibleUpdateAllowed) {
          await AppUpdate.performFlexibleUpdate();
        }
      }
    } catch (error) {
      console.warn('App Update Check Failed:', error);
    }
  }

  // Hardware Back Button Handling
  if (Capacitor.getPlatform() === 'android') {
      backListener = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
              router.back();
          } else {
              CapacitorApp.exitApp();
          }
      });
  }
});

onUnmounted(() => {
  if (backListener) {
    backListener.remove();
  }
});
</script>

<style>
/* ==========================================================
   MODERN TOAST OVERRIDES (CSS Variables Strategy)
   ========================================================== */
:root {
  --toastify-toast-width: auto !important;
  --toastify-toast-min-height: 48px !important;
  --toastify-toast-max-height: 800px !important;
  --toastify-toast-bd-radius: 99px !important; 
  --toastify-font-family: inherit !important;
  --toastify-z-index: 999999 !important;
  --toastify-text-color-light: #f8fafc !important;
  --toastify-text-color-dark: #f8fafc !important;
  --toastify-color-light: rgba(15, 23, 42, 0.95) !important;
  --toastify-color-dark: rgba(15, 23, 42, 0.95) !important;
  --toastify-color-info: rgba(15, 23, 42, 0.95) !important;
  --toastify-color-success: rgba(15, 23, 42, 0.95) !important;
  --toastify-color-warning: rgba(15, 23, 42, 0.95) !important;
  --toastify-color-error: rgba(15, 23, 42, 0.95) !important;
  --toastify-icon-color-success: #22c55e !important; 
}

.Toastify__toast-container {
  padding: 0 !important;
  pointer-events: none !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 12px !important;
  bottom: max(env(safe-area-inset-bottom, 32px), 32px) !important;
  left: 0 !important;
  right: 0 !important;
  width: 100% !important;
  align-items: center !important;
  top: auto !important;
  transform: none !important;
}

.Toastify__toast {
  margin: 0 auto !important;
  border-radius: 99px !important; 
  pointer-events: auto !important;
  padding: 10px 24px !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 
              0 0 0 1px rgba(255, 255, 255, 0.1) inset !important;
  backdrop-filter: blur(24px) saturate(200%) !important;
  -webkit-backdrop-filter: blur(24px) saturate(200%) !important;
  border: none !important;
  margin-bottom: 8px !important;
  display: inline-flex !important;
}

.Toastify__progress-bar,
.Toastify__close-button {
  display: none !important;
}
</style>
