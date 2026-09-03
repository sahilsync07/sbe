
<template>
  <div class="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 font-sans text-slate-800 pb-20">
    



    <div class="flex w-full">
      

      
      

      <main 
         class="flex-1 w-full min-w-0 transition-all duration-300 px-0"
      >
        <!-- Ledger Placeholder -->
        <div v-if="showLedgerView" class="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
             <i class="fa-solid fa-book-open text-slate-400 text-2xl"></i>
          </div>
          <div class="text-xl font-bold text-slate-700">Ledger View Under Construction</div>
          <p class="text-slate-400 mt-2">Check back soon for accounting features.</p>
        </div>

        <!-- Brand Landing Page (Persistent Storefront Component) -->
        <BrandLanding
          v-else
          @select-category="handleCategorySelect"
          @open-image-popup="openImagePopup"
          @open-catalog-gen="showCatalogGen = true"
        />
      </main>
    </div>

    <!-- Floating Go To Top -->
    <transition enter-active-class="transition duration-300 ease-out" enter-from-class="translate-y-10 opacity-0" enter-to-class="translate-y-0 opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <button
        v-if="showGoToTop"
        @click="scrollToTop"
        class="fixed bottom-24 lg:bottom-6 right-6 w-12 h-12 flex items-center justify-center bg-slate-900 text-white rounded-full shadow-lg hover:shadow-xl hover:bg-black transition-all hover:-translate-y-1 active:scale-90 z-40"
      >
        <i class="fa-solid fa-arrow-up"></i>
      </button>
    </transition>

    <ImageModal
      :show-image-popup="showImagePopup"
      :current-product="currentProduct"
      :current-product-index="currentProductIndex"
      :is-last-product="currentProductIndex >= currentGroupProducts.length - 1"
      :current-group-name="currentGroupName"
      :total-products="currentGroupProducts.length"
      @close="closeImagePopup"
      @navigate="navigateImage"
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

    <!-- Admin Login Modal -->
    <AdminLoginModal
       :show="showAdminModal"
       @close="showAdminModal = false"
       @login="handleAdminLogin"
    />

    <!-- Admin Catalog Generator Overlay -->
    <transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0 translate-y-4" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-4">
      <div v-if="showCatalogGen" class="fixed inset-0 z-[90]">
        <LatestStock
          :stock-data-prop="stockData"
          @close="showCatalogGen = false"
        />
      </div>
    </transition>


  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Capacitor } from '@capacitor/core';
import { toast } from 'vue3-toastify';
// Constants & Utils
import { FILTER_DELAY_MS } from '../utils/constants';
import { formatProductName, normalizeId, getOptimizedImageUrl, isNewArrival } from '../utils/formatters';
// Composables
import { useCart } from '../composables/useCart';
import { useProductFilter } from '../composables/useProductFilter';
import { useBrandGroups } from '../composables/useBrandGroups';
import { useWhatsAppOrder } from '../composables/useWhatsAppOrder';
import { useStockData } from '../composables/useStockData';
import { useAdmin } from '../composables/useAdmin';
import { useImageCache } from '../composables/useImageCache';
import { extractColor } from '../utils/colors'; 
// Components
import ProductCard from './StockTable/ProductCard.vue';
import { defineAsyncComponent } from 'vue';

const ImageModal = defineAsyncComponent(() => import('./StockTable/ImageModal.vue'));
const OrderModal = defineAsyncComponent(() => import('./StockTable/OrderModal.vue'));
const FunLoader = defineAsyncComponent(() => import('./StockTable/FunLoader.vue'));
const AdminLoginModal = defineAsyncComponent(() => import('./StockTable/AdminLoginModal.vue'));
const CachedImage = defineAsyncComponent(() => import('./StockTable/CachedImage.vue'));
const BrandLanding = defineAsyncComponent(() => import('./StockTable/BrandLanding.vue'));
const LatestStock = defineAsyncComponent(() => import('../android/components/LatestStock.vue'));

import { useAppStore } from '../stores/appStore';
import { storeToRefs } from 'pinia';

const appStore = useAppStore();
const { showLanding, showCart, showSidePanel } = storeToRefs(appStore);

const route = useRoute();
const router = useRouter();

// Init Core State
const isLocal = ref(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const isAndroid = ref(Capacitor.getPlatform() === 'android');
const showGoToTop = ref(false);
const showCatalogGen = ref(false);
const showLedgerView = ref(false);
const expandedGroups = ref({});
const activeScrollGroup = ref('');
const userHasScrolled = ref(false);
const isFiltering = ref(false); // New loader state
const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

// Config State
const config = ref({});
const companyName = ref('SBE');

// --- Use Composables ---
// 1. Stock Data
const { 
  stockData, loading, isRefreshing, error, lastRefresh, 
  uploading, uploadErrors, imageFiles,
  loadStockData, updateStockData, refreshStockData, handleFileChange, uploadImage, deleteImage
} = useStockData(isLocal);

// 2. Admin
const { isAdmin, isSuperAdmin, login: performLogin } = useAdmin();
const showAdminModal = ref(false);

// 7. Image Cache (Offline Support)
const { 
  isCaching, cacheProgress, progressPercent,
  checkInternetSpeed, cacheAllImages, getCacheStatus 
} = useImageCache();

// Handle Cache Images button click
const handleCacheImages = async () => {
    if (isCaching.value) return;
    
    // Check internet speed first
    toast.info('Checking network speed...', { autoClose: 2000 });
    const speed = await checkInternetSpeed();
    
    if (speed === 'offline') {
      toast.error('No internet connection. Please connect to download images.', { autoClose: 4000 });
      return;
    }
    
    if (speed === 'slow') {
      toast.warning('Slow connection detected. Download may take longer.', { autoClose: 3000 });
    }
    
    // Get all products with images
    const allProducts = stockData.value?.flatMap(group => group.products) || [];
    const productsWithImages = allProducts.filter(p => p.imageUrl);
    
    // Collect Extra Assets (Logos)
    const extraUrls = [
       // Hardcoded Logos
       'https://res.cloudinary.com/dg365ewal/image/upload/v1749667072/paragonLogo_rqk3hu.webp',
       // Add other static assets if needed
    ];

    // Dynamic Logos from Top Brands
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

    // Create persistent progress toast
    const toastId = toast.loading(`Starting download for ${totalCount} assets...`, { 
      autoClose: false,
      closeButton: false
    });
    
    // Start caching with progress updates
    // Pass extraUrls as second argument
    const result = await cacheAllImages(allProducts, extraUrls, (current, total) => {
      // Update toast with live progress
      const percent = Math.round((current / total) * 100);
      toast.update(toastId, {
        render: `Downloading assets ${current}/${total} (${percent}%)...`,
        type: 'info',
        isLoading: true,
        autoClose: false
      });
    });
    
    // Final success/failure toast
    toast.remove(toastId);
    if (result.success > 0) {
      toast.success(`✓ ${result.success} assets cached for offline use!`, { autoClose: 3500 });
    }
    if (result.failed > 0) {
      toast.warning(`${result.failed} assets failed to download.`, { autoClose: 3500 });
    }
  };

const promptAdminLogin = () => {
  showAdminModal.value = true;
};

const handleAdminLogin = async (payload) => {
  showAdminModal.value = false;
  const pwd = typeof payload === 'object' ? payload?.password : payload;
  const redirectHome = typeof payload === 'object' ? payload?.redirectHome : false;
  if (!pwd) return;
  
  const success = await performLogin(pwd);
  if (success && redirectHome) {
    router.push('/home');
  }
};

// 3. Cart
const { 
  cart, cartTotalItems, cartItemCount, 
  getCartQty, addToCart, updateCart, removeFromCart, updateCartQuantity, clearCart 
} = useCart();

// 4. Product Filter
const { 
  searchQuery, selectedGroup, cleanView, hideOldArticles,
  filteredStockData, sortedStockDataForDropdown 
} = useProductFilter(stockData, config);

// Lifecycle: Handle Query Navigation
onMounted(() => {
    const brand = route.query.brand;
    const club = route.query.club;
    
    if (brand) {
        showLanding.value = false;
        // Wait for data to load and components to mount
        setTimeout(() => {
            scrollToGroup(brand, 'instant');
        }, 800);
    } else if (club) {
        showLanding.value = false;
        selectedGroup.value = club;
        window.scrollTo({ top: 0, behavior: 'instant' });
    }
});

// 5. Sidebar Groups
// Note: Sidebar uses a subset of logic but needs connection to stockData & search.
const { groupedSidebar, lists } = useBrandGroups(stockData, config, searchQuery);

// 6. WhatsApp Order
const { 
  showOrderDetailsModal, customerName, customerPhone, 
  sendOrderToWhatsapp, finalizeOrderAndSend 
} = useWhatsAppOrder(cart, config);


// --- UI Methods & Logic ---

// Image Popups
const showImagePopup = ref(false);
const currentProduct = ref({});
const currentGroupIndex = ref(null);
const currentGroupProducts = ref([]);
const currentGroupName = ref("");
const currentProductIndex = ref(0);

const openImagePopup = (product, groupIndex) => {
  currentProduct.value = product;
  
  const dataList = (filteredStockData.value && filteredStockData.value.length > 0)
    ? filteredStockData.value
    : (stockData.value || []);

  let foundGroupIndex = groupIndex;
  let foundGroup = null;

  if (typeof foundGroupIndex === 'number' && dataList[foundGroupIndex]) {
    foundGroup = dataList[foundGroupIndex];
  } else {
    // Search across dataList to find the group containing this product
    for (let i = 0; i < dataList.length; i++) {
      const g = dataList[i];
      if (g.products && g.products.some(p => p.productName === product.productName)) {
        foundGroupIndex = i;
        foundGroup = g;
        break;
      }
    }
  }

  if (foundGroup && Array.isArray(foundGroup.products) && foundGroup.products.length > 0) {
    currentGroupIndex.value = foundGroupIndex;
    currentGroupProducts.value = foundGroup.products;
    currentGroupName.value = foundGroup.groupName;
    const pIdx = foundGroup.products.findIndex(p => p.productName === product.productName);
    currentProductIndex.value = pIdx >= 0 ? pIdx : 0;
    currentProduct.value = foundGroup.products[currentProductIndex.value];
  } else {
    // Fallback: search all products across all groups
    const allProducts = [];
    dataList.forEach(g => {
      if (g.products) allProducts.push(...g.products);
    });
    const pIdx = allProducts.findIndex(p => p.productName === product.productName);
    currentGroupIndex.value = 0;
    currentGroupProducts.value = allProducts.length > 0 ? allProducts : [product];
    currentGroupName.value = foundGroup?.groupName || "Catalog";
    currentProductIndex.value = pIdx >= 0 ? pIdx : 0;
  }
  
  showImagePopup.value = true;
  
  // URL Update
  try {
    const url = new URL(window.location);
    url.searchParams.set('product', product.productName);
    window.history.pushState({}, '', url);
  } catch (e) {}
};

const closeImagePopup = ({ isPop = false } = {}) => {
  showImagePopup.value = false;
  currentProduct.value = {};
  currentGroupIndex.value = null;
  currentGroupProducts.value = [];
  currentGroupName.value = "";
  currentProductIndex.value = 0;
  
  if (!isPop) {
     selectedGroup.value = 'All';
     try {
       window.history.replaceState(null, '', window.location.pathname);
     } catch (e) {}
  }
};

let isNavigating = false;

const showToastOnce = (msg, id = 'nav-toast') => {
  try {
    toast.remove(id);
    toast.info(msg, {
      toastId: id,
      autoClose: 1800,
      closeOnClick: true,
      pauseOnHover: false
    });
  } catch (e) {}
};

const navigateImage = (direction) => {
  if (isNavigating) return;
  isNavigating = true;
  setTimeout(() => { isNavigating = false; }, 250);

  if (!currentGroupProducts.value || currentGroupProducts.value.length === 0) {
    showToastOnce("No products in current list", "nav-toast");
    return;
  }

  let newIndex = currentProductIndex.value + direction;
  
  // 1. Within current group
  if (newIndex >= 0 && newIndex < currentGroupProducts.value.length) {
    currentProductIndex.value = newIndex;
    currentProduct.value = currentGroupProducts.value[newIndex];
  } 
  // 2. Next Group
  else if (newIndex >= currentGroupProducts.value.length) {
    const dataList = (filteredStockData.value && filteredStockData.value.length > 0)
      ? filteredStockData.value
      : (stockData.value || []);
      
    const nextGroupIndex = (typeof currentGroupIndex.value === 'number' ? currentGroupIndex.value : 0) + 1;
    if (nextGroupIndex < dataList.length) {
      currentGroupIndex.value = nextGroupIndex;
      const nextGroup = dataList[nextGroupIndex];
      currentGroupProducts.value = nextGroup.products || [];
      currentGroupName.value = nextGroup.groupName || "";
      currentProductIndex.value = 0;
      if (nextGroup.products && nextGroup.products[0]) {
        currentProduct.value = nextGroup.products[0];
      }
    } else {
      showToastOnce("You've reached the end of the catalog!", "nav-toast");
      return;
    }
  }
  // 3. Previous Group
  else if (newIndex < 0) {
    const dataList = (filteredStockData.value && filteredStockData.value.length > 0)
      ? filteredStockData.value
      : (stockData.value || []);
      
    const prevGroupIndex = (typeof currentGroupIndex.value === 'number' ? currentGroupIndex.value : 0) - 1;
    if (prevGroupIndex >= 0) {
      currentGroupIndex.value = prevGroupIndex;
      const prevGroup = dataList[prevGroupIndex];
      currentGroupProducts.value = prevGroup.products || [];
      currentGroupName.value = prevGroup.groupName || "";
      const lastIdx = (prevGroup.products && prevGroup.products.length > 0) ? prevGroup.products.length - 1 : 0;
      currentProductIndex.value = lastIdx;
      if (prevGroup.products && prevGroup.products[lastIdx]) {
        currentProduct.value = prevGroup.products[lastIdx];
      }
    } else {
      showToastOnce("This is the first product in the catalog!", "nav-toast");
      return;
    }
  }

  // Update URL
  if (currentProduct.value && currentProduct.value.productName) {
    try {
      const url = new URL(window.location);
      url.searchParams.set('product', currentProduct.value.productName);
      window.history.replaceState({}, '', url);
    } catch (e) {}
  }
};

const toggleGroup = (groupName) => {
  expandedGroups.value[groupName] = !expandedGroups.value[groupName];
};

const shareBrand = async (brandName) => {
    const url = `${window.location.origin}${window.location.pathname}?brand=${encodeURIComponent(brandName)}`;
    const shareData = { title: `Check out ${brandName}`, text: `Look at this brand: ${brandName}`, url };

    // 1. Try Native Share (Mobile)
    try {
        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            await navigator.share(shareData);
            return;
        }
    } catch (err) {
        if (err.name === 'AbortError') return; // User cancelled
        // Continue to fallback
    }

    // 2. Fallback: Copy to Clipboard
    try {
        // Modern Clipboard API (Secure Context only)
        if (navigator.clipboard && navigator.clipboard.writeText) {
             await navigator.clipboard.writeText(url);
             toast.success("Link copied!");
        } else {
             // 3. Ultra-Fallback: Legacy execCommand (Insecure Context / Older Browsers)
             const textArea = document.createElement("textarea");
             textArea.value = url;
             
             // Ensure it's not visible but part of DOM
             textArea.style.position = "fixed";
             textArea.style.left = "-9999px";
             textArea.style.top = "0";
             document.body.appendChild(textArea);
             
             textArea.focus();
             textArea.select();
             
             const successful = document.execCommand('copy');
             document.body.removeChild(textArea);
             
             if (successful) toast.success("Link copied!");
             else throw new Error("Copy failed");
        }
    } catch (clipErr) {
        console.error("Share failed", clipErr);
        toast.error("Could not copy link");
    }
};

const toggleSidebar = () => {
    if (showSidePanel.value) {
        showSidePanel.value = false;
    } else {
        showSidePanel.value = true;
        searchQuery.value = ''; // Reset search on open
        window.history.pushState({ pane: 'side' }, '');
    }
};

const toggleCart = () => {
    if (showCart.value) {
        showCart.value = false;
    } else {
        showCart.value = true;
        searchQuery.value = '';
        window.history.pushState({ pane: 'cart' }, '');
    }
};

const toggleLedgerView = () => {
    showLedgerView.value = !showLedgerView.value;
};

// Brand Landing Page
const handleCategorySelect = (categoryId) => {
    showLanding.value = false;
    if (categoryId === 'All') {
        selectedGroup.value = 'All';
    } else {
        selectedGroup.value = categoryId;
    }
    // Push a history entry so browser back returns to landing
    window.history.pushState({ view: 'category', categoryId }, '', '');
    window.scrollTo({ top: 0, behavior: 'instant' });
};

const backToLanding = () => {
    showLanding.value = true;
    selectedGroup.value = 'All';
    searchQuery.value = '';
    window.scrollTo({ top: 0, behavior: 'instant' });
};

// Scroll Handling
const handleScroll = () => {
    showGoToTop.value = window.scrollY > 300;
};
const scrollToTop = () => {
    selectedGroup.value = 'All';
    window.history.replaceState(null, '', window.location.pathname);
    window.scrollTo({ top: 0, behavior: "instant" });
};
const handleUserScroll = () => {
   userHasScrolled.value = true;
};

// Routing & Deep Linking logic
const handlePopState = () => {
    if (showImagePopup.value) {
        closeImagePopup({ isPop: true });
        return;
    }
    if (showSidePanel.value) {
        showSidePanel.value = false;
        return;
    }
    if (showCart.value) {
        showCart.value = false;
        return;
    }
    // If not on landing page, go back to it
    if (!showLanding.value) {
        backToLanding();
        return;
    }
};

// Config Loading with robust Offline Caching & Fallback
const loadConfig = async () => {
    try {
        const configFile = import.meta.env.VITE_CONFIG_FILE || 'sbe.json';
        const response = await fetch(`${import.meta.env.BASE_URL}config/${configFile}?t=${Date.now()}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        config.value = await response.json();
        companyName.value = config.value.companyName || 'SBE';
        try {
            localStorage.setItem('sbe_config_cache', JSON.stringify(config.value));
        } catch (e) {}
    } catch (err) {
        // Offline Fallback 1: LocalStorage Cache
        try {
            const cached = localStorage.getItem('sbe_config_cache');
            if (cached) {
                config.value = JSON.parse(cached);
                companyName.value = config.value.companyName || 'SBE';
                return;
            }
        } catch (e) {}
        
        // Offline Fallback 2: Built-in default config
        config.value = { companyName: 'SBE Rayagada', theme: 'blue' };
        companyName.value = config.value.companyName;
    }
};

onMounted(async () => {
    // Inject FontAwesome
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    document.head.appendChild(link);

    await loadConfig();
    await loadStockData();
    
    // Auto-expand groups
    if (stockData.value) {
        expandedGroups.value = stockData.value.reduce(
          (acc, group) => ({ ...acc, [group.groupName]: true }),
          { "New Arrivals": true }
        );
    }

    // Sidebar/Search Logic
    // If brand param exists
    const params = new URLSearchParams(window.location.search);
    const brandParam = params.get('brand');
    const productParam = params.get('product');

    if (brandParam) {
        if (brandParam.toLowerCase() === 'new arrivals') {
            nextTick(() => scrollToGroup('New Arrivals', 'auto'));
        } else {
            const match = stockData.value.find(g => g.groupName.toLowerCase() === brandParam.toLowerCase());
            if (match) {
                nextTick(() => scrollToGroup(match.groupName, 'auto'));
            }
        }
    }

    if (productParam) {
        // Deep link product
        stockData.value.forEach((group, gIndex) => {
             const pIndex = group.products.findIndex(p => p.productName === productParam);
             if (pIndex !== -1) {
                 openImagePopup(group.products[pIndex], gIndex);
             }
        });
    }

    // Load Cart
    const savedCart = localStorage.getItem('sbe_cart');
    if (savedCart) {
        try {
            const parsed = JSON.parse(savedCart);
            clearCart();
            parsed.forEach(item => {
                 updateCart(item.product, item.quantity); 
            });
        } catch (e) {
            console.error(e);
        }
    }

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener('wheel', handleUserScroll, { passive: true });
    window.addEventListener('touchmove', handleUserScroll, { passive: true });
    window.addEventListener('keydown', handleUserScroll, { passive: true });
});

onBeforeUnmount(() => {
    window.removeEventListener("scroll", handleScroll);
    window.removeEventListener("popstate", handlePopState);
    window.removeEventListener('wheel', handleUserScroll);
    window.removeEventListener('touchmove', handleUserScroll);
    window.removeEventListener('keydown', handleUserScroll);
});

// Watchers
watch(cart, (val) => {
    localStorage.setItem('sbe_cart', JSON.stringify(val));
}, { deep: true });

// React to brand query param changes (e.g. sidebar clicks from App.vue)
watch(() => route.query.brand, (newBrand) => {
    if (newBrand) {
        showLanding.value = false;
        // Use setTimeout to allow the product list DOM to fully render
        // after the landing page is hidden (v-else transition needs time)
        setTimeout(() => {
            scrollToGroup(newBrand, 'instant');
        }, 400);
    }
});

// React to club query param changes
watch(() => route.query.club, (newClub) => {
    if (newClub) {
        showLanding.value = false;
        selectedGroup.value = newClub;
        window.scrollTo({ top: 0, behavior: 'instant' });
    }
});

watch(selectedGroup, (newVal) => {
    const url = new URL(window.location);
    if (newVal && newVal !== 'All') {
        url.searchParams.set('brand', newVal);
    } else {
        url.searchParams.delete('brand');
    }
    window.history.replaceState(null, '', url);
});

// Helpers
const normalizeIdHelper = (name) => normalizeId(name);

// Helper to extract clean price number
const getPriceInfo = (name) => {
    if (!name) return { label: 'Net Rate', price: '?' };
    // Try to find specific price patterns first: MRP 123, RS 123, @ 123
    const match = name.match(/((?:RS|MRP|@))[\.\s]*(\d+(\.\d+)?)/i);
    if (match) {
        const prefix = match[1].toUpperCase();
        return {
            label: prefix === 'MRP' ? 'MRP' : 'Net Rate',
            price: match[2]
        };
    }
    // Fallback: just find the last number
    const fallback = name.match(/(\d+(\.\d+)?)(?!.*\d)/);
    return {
        label: 'Net Rate', 
        price: fallback ? fallback[0] : '?' 
    };
};

const getProductSize = (name) => {
    if (!name) return null;
    const match = name.match(/(?:^|[\s\(])(\d{1,2})\s*[xX*]\s*(\d{1,2})(?:[\s\)]|$)/);
    if (match) {
        const n1 = parseInt(match[1]);
        const n2 = parseInt(match[2]);
        const low = Math.min(n1, n2);
        const high = Math.max(n1, n2);
        return `${low}x${high}`;
    }
    return null;
};

const getProductColor = (name) => {
    return extractColor(name);
};

const getCleanProductName = (name) => {
    if (!name) return '';
    let clean = name;
    
    // Remove Colors
    const colorData = extractColor(name);
    if (colorData && colorData.originalTokens) {
        colorData.originalTokens.forEach(token => {
            const regex = new RegExp(`\\b${token}\\b`, 'gi');
            clean = clean.replace(regex, '');
        });
    }

    // Remove Price pattern
    clean = clean.replace(/((?:RS|MRP|@))[\.\s]*(\d+(\.\d+)?)/gi, '');
    // Remove Size pattern
    clean = clean.replace(/(?:^|[\s\(])(\d{1,2})\s*[xX*]\s*(\d{1,2})(?:[\s\)]|$)/g, ' ');
    
    clean = clean.replace(/\(\s*\)/g, '');
    clean = clean.replace(/[\/\-\.]+\s*$/g, '') 
                 .replace(/^\s*[\/\-\.]+/g, '') 
                 .replace(/\s*[\/\-\.]+\s*/g, ' '); 
    
    const cleanedString = clean.replace(/\s+/g, ' ').trim();
    return formatProductName(cleanedString);
};

// Scroll Logic Re-implementation
const scrollToGroup = (groupName, behavior = 'instant') => {
    expandedGroups.value[groupName] = true;

    // Always show all products so the page redirects to the brand within the all products list
    selectedGroup.value = 'All'; 

    setTimeout(() => {
        const id = 'group-grid-' + normalizeId(groupName);
        const element = document.getElementById(id);
        if (element) {
             const y = element.getBoundingClientRect().top + window.scrollY - 85; // Adjusted offset for sticky header
             window.scrollTo({ top: y, behavior });
             activeScrollGroup.value = groupName;
             
             const url = new URL(window.location);
             url.searchParams.set('brand', groupName);
             window.history.replaceState(null, '', url);
             
             if (window.innerWidth < 1024 && showSidePanel.value) {
                 showSidePanel.value = false;
             }
        }
    }, 150); // Small timeout allows Vue to finish rendering the massive all-products list
};

const handleSidebarClick = (group) => {
    showLanding.value = false;
    scrollToGroup(group.groupName, 'instant');
};

const handleClubClick = (clubName) => {
    showLanding.value = false;
    selectedGroup.value = clubName;
    if (window.innerWidth < 1024) {
        showSidePanel.value = false;
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
};


const handleCleanViewToggle = (newValue) => {
  if (cleanView.value === newValue) return;
  
  isFiltering.value = true;
  
  // Use setTimeout to allow the loader to render before the heavy filter operation
  setTimeout(() => {
    cleanView.value = newValue;
    
    // Ensure loader stays for at least a fun duration
    setTimeout(() => {
      isFiltering.value = false;
    }, FILTER_DELAY_MS); 
  }, 10); // Reduced initial delay
};

const formatGroupName = (name) => {
  if (!name) return '';
  return name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

</script>
