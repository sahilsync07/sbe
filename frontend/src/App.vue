<template>
  <div class="min-h-screen relative">
    <!-- Global Persistent App Layout -->
    <DesktopToolbar
      :loading="stockLoading"
      :is-caching-images="isCaching"
      :show-side-panel="showSidePanel"
      :show-cart="showCart"
      :company-name="companyName"
      :cloud-name="cloudName"
      :hide-mobile-bottom-bar="hideMobileBottomBar"
      @toggleSidebar="toggleSidebar"
      @toggleCart="toggleCart"
      @updateStockData="updateStockData"
      @promptAdminLogin="showAdminModal = true"
      @cacheImages="handleCacheImages"
      @refreshData="refreshStockData"
    />

    <BrandsSidebar
      :show-side-panel="showSidePanel"
      :grouped-sidebar="groupedSidebar"
      :active-scroll-group="activeScrollGroup"
      @update:showSidePanel="showSidePanel = $event"
      @sidebarClick="handleSidebarClick"
      @clubClick="handleClubClick"
    />

    <CartSidebar
      :show-cart="showCart"
      @closeCart="showCart = false"
      @sendOrderToWhatsapp="sendOrderToWhatsapp"
    />

    <router-view></router-view>
    
    <AdminLoginModal 
       :show="showAdminModal"
       @close="showAdminModal = false"
       @login="handleAdminLogin"
    />

    <!-- Order Details Modal -->
    <OrderModal
       :show="showOrderDetailsModal"
       :customer-name="customerName"
       :customer-phone="customerPhone"
       @update:customerName="customerName = $event"
       @update:customerPhone="customerPhone = $event"
       @close="showOrderDetailsModal = false"
       @confirm="finalizeOrderAndSend"
    />
  </div>
</template>

<script setup>
import { onMounted, ref, computed, defineAsyncComponent } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Capacitor } from '@capacitor/core';
import { AppUpdate } from '@capawesome/capacitor-app-update';
import { toast } from 'vue3-toastify';
import { storeToRefs } from 'pinia';

import AdminLoginModal from './components/AdminLoginModal.vue';
import DesktopToolbar from './components/StockTable/DesktopToolbar.vue';
import BrandsSidebar from './components/StockTable/BrandsSidebar.vue';
import CartSidebar from './components/StockTable/CartSidebar.vue';

// Use same async import for OrderModal
const OrderModal = defineAsyncComponent(() => import('./components/StockTable/OrderModal.vue'));

import { useAppStore } from './stores/appStore';
import { useAdmin } from './composables/useAdmin';
import { performDeltaSync } from './utils/nativeCache';
import { setupDailySyncNotification } from './utils/notifications';
import { useStockData } from './composables/useStockData';
import { useCart } from './composables/useCart';
import { useBrandGroups } from './composables/useBrandGroups';
import { useImageCache } from './composables/useImageCache';
import { useWhatsAppOrder } from './composables/useWhatsAppOrder';

const route = useRoute();
const router = useRouter();

const appStore = useAppStore();
const { stockData, config, searchQuery } = storeToRefs(appStore);

const isLocal = ref(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dg365ewal';

// Hide mobile bottom bar inside Daybook & Ledger
const hideMobileBottomBar = computed(() => {
  return route.path === '/ledger' || route.path === '/daybook';
});

// UI State
const showSidePanel = ref(false);
const showCart = ref(false);
const showAdminModal = ref(false);
const activeScrollGroup = ref('');
const companyName = ref('SBE');

// Load Config
const loadConfig = async () => {
    try {
        const configFile = import.meta.env.VITE_CONFIG_FILE || 'sbe.json';
        const response = await fetch(`${import.meta.env.BASE_URL}config/${configFile}?t=${new Date().getTime()}`);
        const conf = await response.json();
        // Update store with loaded config
        appStore.$patch({ config: conf });
        companyName.value = conf.companyName || 'SBE';
    } catch (err) {
        toast.error("Failed to load app configuration");
    }
};

const { checkAdminState, isAdmin, isSuperAdmin } = useAdmin();

const { 
  loading: stockLoading, isRefreshing, error,
  loadStockData, updateStockData, refreshStockData
} = useStockData(isLocal);

const { groupedSidebar } = useBrandGroups(stockData, config, searchQuery);

const { cart } = useCart();
const { 
  showOrderDetailsModal, customerName, customerPhone, 
  sendOrderToWhatsapp, finalizeOrderAndSend 
} = useWhatsAppOrder(cart, config);

const { isCaching, checkInternetSpeed, cacheAllImages } = useImageCache();

const toggleSidebar = () => {
    showSidePanel.value = !showSidePanel.value;
    if (showSidePanel.value) {
        searchQuery.value = '';
        window.history.pushState({ pane: 'side' }, '');
    }
};

const toggleCart = () => {
    showCart.value = !showCart.value;
    if (showCart.value) {
        searchQuery.value = '';
        window.history.pushState({ pane: 'cart' }, '');
    }
};

const handleAdminLogin = (password) => {
  showAdminModal.value = false;
  if (!password) return;
  if (password === 'admin123') {
    isAdmin.value = true;
    isSuperAdmin.value = false;
    toast.success('Admin Mode Enabled', { autoClose: 2000 });
  } else if (password === 'superadmin') {
    isAdmin.value = false;
    isSuperAdmin.value = true;
    toast.success('Super Admin Mode Enabled', { autoClose: 2000 });
  } else {
    toast.error('Incorrect password', { autoClose: 3000 });
  }
};

const handleSidebarClick = (group) => {
    router.push({ path: '/', query: { brand: group.groupName } });
};

const handleClubClick = (clubName) => {
    router.push({ path: '/', query: { club: clubName } });
};

const handleCacheImages = async () => {
    if (isCaching.value) return;
    toast.info('Checking network speed...', { autoClose: 2000 });
    const speed = await checkInternetSpeed();
    if (speed === 'offline') {
      toast.error('No internet connection. Please connect to download images.', { autoClose: 4000 });
      return;
    }
    if (speed === 'slow') {
      toast.warning('Slow connection detected. Download may take longer.', { autoClose: 3000 });
    }
    
    const allProducts = stockData.value?.flatMap(group => group.products) || [];
    const productsWithImages = allProducts.filter(p => p.imageUrl);
    const extraUrls = [ 'https://res.cloudinary.com/dg365ewal/image/upload/v1749667072/paragonLogo_rqk3hu.webp' ];
    
    if (groupedSidebar.value?.topBrands) {
        groupedSidebar.value.topBrands.forEach(item => {
            if (item.logo) extraUrls.push(item.logo);
        });
    }

    if (productsWithImages.length === 0 && extraUrls.length === 0) {
      toast.info('No images to cache.', { autoClose: 2000 });
      return;
    }
    
    const totalCount = productsWithImages.length + extraUrls.length;
    const toastId = toast.loading(`Starting download for ${totalCount} assets...`, { autoClose: false, closeButton: false });
    
    const result = await cacheAllImages(allProducts, extraUrls, (current, total) => {
      const percent = Math.round((current / total) * 100);
      toast.update(toastId, { render: `Downloading assets ${current}/${total} (${percent}%)...`, type: 'info', isLoading: true, autoClose: false });
    });
    
    if (result.success > 0) {
      toast.update(toastId, { render: `✓ ${result.success} assets cached!`, type: 'success', isLoading: false, autoClose: 4000 });
    }
    if (result.failed > 0) {
      toast.warning(`${result.failed} assets failed.`, { autoClose: 3000 });
    }
};

onMounted(async () => {
  await loadConfig();
  await checkAdminState();
  
  // Actually load Initial StockData (instead of inside StockTable.vue)
  await loadStockData();

  await setupDailySyncNotification();
  await performDeltaSync();
  
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

  // Handle back button for modals
  window.addEventListener("popstate", (e) => {
    if (showSidePanel.value) showSidePanel.value = false;
    if (showCart.value) showCart.value = false;
  });
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

.Vue3Toastify__toast-container {
  padding: 0 !important;
  pointer-events: none !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 12px !important;
}

@media (max-width: 640px) {
  .Vue3Toastify__toast-container {
    bottom: max(env(safe-area-inset-bottom, 32px), 32px) !important;
    left: 0 !important;
    right: 0 !important;
    width: 100% !important;
    align-items: center !important;
    transform: none !important;
  }
  .Vue3Toastify__toast {
    margin: 0 auto !important;
    border-radius: 99px !important; 
  }
}

@media (min-width: 641px) {
  .Vue3Toastify__toast-container--bottom-right {
    bottom: 32px !important;
    right: 32px !important;
    width: 320px !important;
  }
  .Vue3Toastify__toast {
    border-radius: 16px !important; 
    width: 100% !important;
  }
}

.Vue3Toastify__toast {
  pointer-events: auto !important;
  padding: 10px 24px !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 
              0 0 0 1px rgba(255, 255, 255, 0.1) inset !important;
  backdrop-filter: blur(24px) saturate(200%) !important;
  -webkit-backdrop-filter: blur(24px) saturate(200%) !important;
  border: none !important;
  margin-bottom: 8px !important;
  display: inline-flex !important;
  animation: toast-spring-up 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards !important;
}

.Vue3Toastify__progress-bar,
.Vue3Toastify__close-button {
  display: none !important;
}

@keyframes toast-spring-up {
  0% { transform: translateY(100px) scale(0.85); opacity: 0; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}
</style>
