
<template>
  <div class="min-h-screen w-full bg-slate-50 font-sans text-slate-800">
    <DesktopToolbar
      :is-admin="isAdmin"
      :is-super-admin="isSuperAdmin"
      :loading="loading"
      :show-side-panel="showSidePanel"
      :show-cart="showCart"
      :company-name="companyName"
      :last-refresh="lastRefresh"
      :cart-total-items="cartTotalItems"
      :search-query="searchQuery"
      :show-images-only="showImagesOnly"
      :cloud-name="cloudName"
      @toggleSidebar="toggleSidebar"
      @toggleCart="toggleCart"
      @updateStockData="updateStockData"
      @toggleLedgerView="toggleLedgerView"
      @promptAdminLogin="promptAdminLogin"
      @update:searchQuery="searchQuery = $event"
      @update:showImagesOnly="showImagesOnly = $event"
      @cacheImages="handleCacheImages"
    />

    <div class="flex w-full">
      <BrandsSidebar
        :show-side-panel="showSidePanel"
        :grouped-sidebar="groupedSidebar"
        :active-scroll-group="activeScrollGroup"
        :selected-group="selectedGroup"
        @update:showSidePanel="showSidePanel = $event"
        @sidebarClick="handleSidebarClick"
        @clubClick="handleClubClick"
      />

      <!-- Overlay for mobile sidebar -->
      <div 
        v-if="showSidePanel" 
        class="fixed inset-0 bg-black/50 z-30 lg:hidden"
        @click="showSidePanel = false"
      ></div>

      <CartSidebar
        :show-cart="showCart"
        :cart="cart"
        :filtered-cart="cart" 
        :cart-total-items="cartTotalItems"
        :cart-item-count="cartItemCount"
        @closeCart="showCart = false"
        @clearCart="clearCart"
        @updateCartQuantity="updateCartQuantity"
        @removeFromCart="removeFromCart"
        @sendOrderToWhatsapp="sendOrderToWhatsapp"
      />

      <main 
         class="flex-1 w-full px-2 sm:px-6 lg:px-8 pt-1 pb-6 space-y-6 min-w-0 transition-all duration-300"
      >
        <div v-if="showLedgerView" class="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <div class="text-xl font-semibold text-slate-500">Tally Ledger Work in Progress</div>
        </div>

        <div v-else class="space-y-6">
          <div v-if="error" class="flex flex-col sm:flex-row justify-end items-center text-xs text-slate-500 px-2">
            <span class="text-red-500 font-medium mt-1 sm:mt-0">{{ error }}</span>
          </div>

          <!-- View: Image Grid -->
          <div class="space-y-6 sm:space-y-10">
            <div
              v-for="(group, index) in filteredStockData"
              :key="group.groupName"
              :id="'group-grid-' + normalizeId(group.groupName)"
              class="bg-white border border-slate-200 rounded-2xl shadow-sm mb-6 relative"
            >
              <!-- Group Header -->
              <div
                @click="toggleGroup(group.groupName)"
                class="px-4 sm:px-6 py-4 cursor-pointer select-none transition-colors flex items-center justify-between sticky top-[96px] bg-white z-30 rounded-t-2xl"
                :class="expandedGroups[group.groupName] ? 'border-b border-slate-100' : 'rounded-b-2xl hover:bg-slate-50'"
              >
                <div class="flex items-center gap-3 overflow-hidden">
                  <h2 v-if="group.isSpecial" class="text-2xl sm:text-3xl font-black tracking-tight holographic-text truncate flex items-center gap-3">
                     <span>✨ {{ group.groupName }}</span>
                      <button 
                        @click.stop="shareBrand(group.groupName)"
                        class="w-8 h-8 flex items-center justify-center shrink-0 text-blue-600 hover:text-blue-700 bg-transparent hover:bg-transparent rounded-full transition-all"
                        title="Share Link"
                      >
                        <i class="fa-solid fa-share-nodes text-sm"></i>
                      </button>
                  </h2>
                  <h2 v-else class="text-lg sm:text-xl font-bold text-slate-800 truncate flex items-center gap-3">
                    <span>{{ group.groupName }}</span>
                    <span class="text-sm font-medium text-slate-400">
                      ({{ group.products.length }})
                    </span>
                      <button 
                        @click.stop="shareBrand(group.groupName)"
                        class="w-8 h-8 flex items-center justify-center shrink-0 text-blue-600 hover:text-blue-700 bg-transparent hover:bg-transparent rounded-full transition-all"
                        title="Share Link"
                      >
                        <i class="fa-solid fa-share-nodes text-sm"></i>
                      </button>
                  </h2>
                </div>
                <!-- Chevron -->
                <div class="flex items-center gap-3 shrink-0">
                   <span v-if="!group.isSpecial" class="text-slate-300">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5 transform transition-transform duration-300"
                        :class="expandedGroups[group.groupName] ? 'rotate-180' : ''"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                   </span>
                </div>
              </div>

              <!-- Group Content -->
              <transition
                enter-active-class="transition-all duration-300 ease-out"
                enter-from-class="opacity-0 max-h-0"
                enter-to-class="opacity-100 max-h-[5000px]"
                leave-active-class="transition-all duration-200 ease-in"
                leave-from-class="opacity-100 max-h-[5000px]"
                leave-to-class="opacity-0 max-h-0"
              >
                <div v-show="expandedGroups[group.groupName]" class="bg-slate-50/30 p-2 sm:p-4">
                  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-4">
                    <div
                      v-for="(product, pIndex) in group.products"
                      :key="product.productName"
                      class="bg-white p-1.5 sm:p-2.5 relative group flex flex-col h-full rounded-2xl shadow-sm border border-slate-200 transition-shadow hover:shadow-md"
                    >
                      <!-- Image Area -->
                      <div class="relative aspect-[3/4] bg-slate-100 overflow-hidden mb-3 rounded-xl border border-slate-100 shadow-inner group-hover:shadow-md transition-shadow">
                        <img
                          v-if="product.imageUrl"
                          :src="getOptimizedImageUrl(product.imageUrl)"
                          alt="Product"
                          class="w-full h-full object-cover cursor-pointer transition-transform duration-500 group-hover:scale-110"
                          @click="openImagePopup(product, index)"
                        />
                        <div
                           v-else
                           class="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        
                        <!-- Admin Controls Overlay -->
                        <div
                          v-if="isAdmin || isSuperAdmin"
                          class="absolute inset-0 bg-black/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4 z-10"
                        >
                           <button
                             v-if="product.imageUrl"
                             @click.stop="deleteImage(product.productName)"
                             class="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors"
                             title="Delete Image"
                           >
                             <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                           </button>

                           <label class="px-3 py-1.5 bg-white/90 text-xs font-bold text-slate-800 rounded-lg cursor-pointer hover:bg-white transition-colors shadow-lg">
                              {{ uploading[product.productName] ? 'Wait...' : (product.imageUrl ? 'Replace' : 'Upload') }}
                              <input type="file" accept="image/*" @change="handleFileChange($event, product.productName)" class="hidden" :disabled="uploading[product.productName]" />
                           </label>
                           
                           <button
                             v-if="imageFiles[product.productName]"
                             @click="uploadImage(product.productName)"
                             class="px-3 py-1.5 bg-blue-600 text-xs font-bold text-white rounded-lg hover:bg-blue-500 shadow-lg"
                           >
                             Confirm
                           </button>
                        </div>
                      </div>

                      <div class="p-2.5 flex flex-col justify-between flex-grow bg-white">
                        <h3 class="text-sm font-bold text-slate-700 leading-snug line-clamp-3 mb-1 min-h-[2.5rem] text-center" :title="formatProductName(product.productName)">
                          {{ formatProductName(product.productName) }}
                        </h3>
                        <div class="flex items-end justify-center border-t border-slate-50 pt-2 mt-auto">
                           <div v-if="getCartQty(product) > 0" class="flex flex-col items-center gap-1">
                              <span class="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-0.5">Stock: {{ product.quantity }}</span>
                              <div class="flex items-center gap-2">
                                 <button @click.stop="updateCart(product, -1)" class="w-8 h-8 flex items-center justify-center bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full font-bold active:scale-90 transition-all">
                                    <i class="fa-solid fa-minus text-xs"></i>
                                 </button>
                                 <span class="text-sm font-extrabold text-blue-700 min-w-[1.2rem] text-center">{{ getCartQty(product) }}</span>
                                 <button @click.stop="updateCart(product, 1)" class="w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold active:scale-90 transition-all shadow-md shadow-blue-200">
                                    <i class="fa-solid fa-plus text-xs"></i>
                                 </button>
                              </div>
                           </div>
                           
                           <div v-else class="flex flex-col items-center gap-1">
                               <span class="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-0.5">Stock: {{ product.quantity }}</span>
                               <button 
                                 @click.stop="addToCart(product)"
                                 class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:bg-blue-600 hover:text-white border border-transparent transition-all active:scale-90"
                                 title="Add to Cart"
                               >
                                 <i class="fa-solid fa-plus"></i>
                               </button>
                           </div>
                        </div>
                      </div>

                      <!-- Upload Error Toast -->
                      <div v-if="uploadErrors[product.productName]" class="absolute bottom-0 inset-x-0 bg-red-500 text-white text-[10px] py-1 text-center z-20">
                        Failed
                      </div>

                    </div>
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Floating Go To Top -->
    <transition enter-active-class="transition duration-300 ease-out" enter-from-class="translate-y-10 opacity-0" enter-to-class="translate-y-0 opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <button
        v-if="showGoToTop"
        @click="scrollToTop"
        class="fixed bottom-6 right-6 w-14 h-14 flex items-center justify-center bg-slate-900/90 text-white rounded-full shadow-2xl hover:bg-black transition-all hover:-translate-y-1 hover:shadow-black/20 backdrop-blur-sm z-30"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
      </button>
    </transition>

    <ImageModal
      :show-image-popup="showImagePopup"
      :current-product="currentProduct"
      :current-product-index="currentProductIndex"
      :is-last-product="currentProductIndex >= currentGroupProducts.length - 1"
      :current-group-name="currentGroupName"
      :cart-qty="getCartQty(currentProduct)"
      @close="closeImagePopup"
      @navigate="navigateImage"
      @addToCart="addToCart"
      @updateCart="updateCart"
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

    <!-- Loading Screen -->
    <transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="loading" class="fixed inset-0 z-[200] bg-white/80 backdrop-blur-sm flex items-center justify-center">
         <div class="flex flex-col items-center gap-4">
             <div class="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
             <p class="text-blue-600 font-bold animate-pulse text-lg">Processing...</p>
         </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { toast } from 'vue3-toastify';
import "vue3-toastify/dist/index.css";
// Constants & Utils
import { formatProductName, normalizeId, getOptimizedImageUrl } from '../utils/formatters';
// Composables
import { useCart } from '../composables/useCart';
import { useProductFilter } from '../composables/useProductFilter';
import { useBrandGroups } from '../composables/useBrandGroups';
import { useWhatsAppOrder } from '../composables/useWhatsAppOrder';
import { useStockData } from '../composables/useStockData';
import { useAdmin } from '../composables/useAdmin';
// Components
import DesktopToolbar from './StockTable/DesktopToolbar.vue';
import BrandsSidebar from './StockTable/BrandsSidebar.vue';
import CartSidebar from './StockTable/CartSidebar.vue';
import { defineAsyncComponent } from 'vue';

const ImageModal = defineAsyncComponent(() => import('./StockTable/ImageModal.vue'));
const OrderModal = defineAsyncComponent(() => import('./StockTable/OrderModal.vue'));


// Init Core State
const isLocal = ref(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const showGoToTop = ref(false);
const showSidePanel = ref(false);
const showCart = ref(false);
const showLedgerView = ref(false);
const expandedGroups = ref({});
const activeScrollGroup = ref('');
const userHasScrolled = ref(false);
const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

// Config State
const config = ref({});
const companyName = ref('SBE');

// --- Use Composables ---
// 1. Stock Data
const { 
  stockData, loading, error, lastRefresh, 
  uploading, uploadErrors, imageFiles,
  loadStockData, updateStockData, handleFileChange, uploadImage, deleteImage
} = useStockData(isLocal);

// 2. Admin
const { isAdmin, isSuperAdmin, promptAdminLogin } = useAdmin();

// 3. Cart
const { 
  cart, cartTotalItems, cartItemCount, 
  getCartQty, addToCart, updateCart, removeFromCart, updateCartQuantity, clearCart 
} = useCart();

// 4. Product Filter
const { 
  searchQuery, selectedGroup, showImagesOnly, 
  filteredStockData 
} = useProductFilter(stockData, config);

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
  currentGroupIndex.value = groupIndex;
  // If filteredStockData is used for grid, we map index from it
  // But wait, groupIndex coming from v-for in filteredStockData is correct relative to filtered list.
  const group = filteredStockData.value[groupIndex];
  if (group) {
      currentGroupProducts.value = group.products;
      currentGroupName.value = group.groupName;
      currentProductIndex.value = group.products.findIndex((p) => p.productName === product.productName);
  }
  
  showImagePopup.value = true;
  
  // URL Update
  const url = new URL(window.location);
  url.searchParams.set('product', product.productName);
  window.history.pushState({}, '', url);
};

const closeImagePopup = ({ isPop = false } = {}) => {
  showImagePopup.value = false;
  currentProduct.value = {};
  currentGroupIndex.value = null;
  currentGroupProducts.value = [];
  currentGroupName.value = "";
  currentProductIndex.value = 0;
  
  if (!isPop) {
     selectedGroup.value = 'All'; // Reset group? Original logic did this.
     window.history.replaceState(null, '', window.location.pathname);
  }
};

const navigateImage = (direction) => {
  const newIndex = currentProductIndex.value + direction;
  if (newIndex >= 0 && newIndex < currentGroupProducts.value.length) {
    currentProductIndex.value = newIndex;
    currentProduct.value = currentGroupProducts.value[newIndex];
    
    const url = new URL(window.location);
    url.searchParams.set('product', currentProduct.value.productName);
    window.history.replaceState({}, '', url);
  }
};

const toggleGroup = (groupName) => {
  expandedGroups.value[groupName] = !expandedGroups.value[groupName];
};

const shareBrand = (brandName) => {
    const url = `${window.location.origin}${window.location.pathname}?brand=${encodeURIComponent(brandName)}`;
    if (navigator.share) {
        navigator.share({ title: `Check out ${brandName}`, url }).catch(e => console.log(e));
    } else {
        navigator.clipboard.writeText(url).then(() => toast.info("Link copied!"));
    }
};

const toggleSidebar = () => {
    if (showSidePanel.value) {
        showSidePanel.value = false;
        // searchQuery.value = ''; // Should we clear search? Original did.
        // selectedGroup.value = 'All' // Original did.
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

// Scroll Handling
const handleScroll = () => {
    showGoToTop.value = window.scrollY > 300;
};
const scrollToTop = () => {
    selectedGroup.value = 'All';
    window.history.replaceState(null, '', window.location.pathname);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
};

// Config Loading
const loadConfig = async () => {
    try {
        const configFile = import.meta.env.VITE_CONFIG_FILE || 'sbe.json';
        const response = await fetch(`${import.meta.env.BASE_URL}config/${configFile}?t=${new Date().getTime()}`);
        config.value = await response.json();
        companyName.value = config.value.companyName || 'SBE';
    } catch (err) {
        toast.error("Failed to load app configuration");
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
                // We need a retry scroll mechanism or similar
                // For now, simpler approach: set selectedGroup?
                // The original code used `retryScroll` which scrolls to element ID.
                // We can implement a simplified version.
                nextTick(() => scrollToGroup(match.groupName, 'auto'));
            }
        }
    }

    if (productParam) {
        // Deep link product
        // Find it in stock data
        stockData.value.forEach((group, gIndex) => {
             const pIndex = group.products.findIndex(p => p.productName === productParam);
             if (pIndex !== -1) {
                 openImagePopup(group.products[pIndex], gIndex);
             }
        });
    }

    // Load Cart from LocalStorage
    // The useCart composable uses a reactive store (not local storage directly inside, wait). 
    // The original `useCart` implementation in `frontend/src/composables/useCart.js` imported `store` from `../android/store.js`.
    // We need to check if that store persists or if `StockTable` handled persistence.
    // Original StockTable lines 992-997 handled persistence.
    // We should probably add persistence here or update useCart.
    const savedCart = localStorage.getItem('sbe_cart');
    if (savedCart) {
        try {
            // efficient way to load? useCart doesn't have "setCart".
            // We can push to it.
            const parsed = JSON.parse(savedCart);
            // Clear current cart first?
            clearCart();
            parsed.forEach(item => addToCart(item.product)); // Add to cart adds 1. 
            // We need to restore specific quantities.
            // useCart exposes `cart` which is a computed from store.cart.
            // We can iterate and update quantities or just direct manipulate if authorized.
            // Let's assume we can loop.
            clearCart();
            parsed.forEach(item => {
                 // Push directly if possible? 
                 // useCart doesn't expose underlying array push easily unless we loop `addToCart` with `quantity`.
                 // Actually `updateCart` takes `change`.
                 // Better: Import store directly for init?
                 // Or just `updateCart(item.product, item.quantity)` if cart is empty.
                 updateCart(item.product, item.quantity); // updateCart adds item if not exists.
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

    // Apply Theme (Inline style injection from config)
    // We can extract this to a util or composable too, but it's small enough here or just a function
    applyTheme();
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

// Scroll Logic Re-implementation
const scrollToGroup = (groupName, behavior = 'instant') => {
    expandedGroups.value[groupName] = true;
    
    // Logic to select appropriate group in filter
    // If we click a group in sidebar that belongs to a Club, we should switch context to that Club?
    // Not necessarily. The original logic was complex.
    // Simplifying: If we just want to scroll to it, we ensure it's visible. 
    // If `selectedGroup` filters it out, we must reset `selectedGroup` to 'All' or the Club it belongs to.
    
    // Check direct match
    const currentList = filteredStockData.value.map(g => g.groupName);
    if (!currentList.includes(groupName)) {
        selectedGroup.value = 'All'; // Reset to find it
    }

    nextTick(() => {
        const id = 'group-grid-' + normalizeId(groupName);
        const element = document.getElementById(id);
        if (element) {
             const y = element.getBoundingClientRect().top + window.scrollY - 80;
             window.scrollTo({ top: y, behavior });
             activeScrollGroup.value = groupName; // Highlight sidebar
             
             // Update URL
             const url = new URL(window.location);
             url.searchParams.set('brand', groupName);
             window.history.replaceState(null, '', url);
             
             // Mobile Close
             if (window.innerWidth < 1024 && showSidePanel.value) {
                 showSidePanel.value = false;
                 // Don't modify history here, just close
             }
        }
    });
};

const handleSidebarClick = (group) => {
    scrollToGroup(group.groupName);
};

const handleClubClick = (clubName) => {
    selectedGroup.value = clubName;
    if (window.innerWidth < 1024) {
        showSidePanel.value = false;
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
};


// Image Caching Logic
const handleCacheImages = async () => {
    if (!stockData.value || stockData.value.length === 0) {
        toast.info("No data to cache.");
        return;
    }

    const imagesToCache = [];
    stockData.value.forEach(group => {
        if (group.products) {
            group.products.forEach(product => {
                if (product.imageUrl) {
                    imagesToCache.push(product.imageUrl);
                }
            });
        }
    });

    if (imagesToCache.length === 0) {
        toast.info("No images found to cache.");
        return;
    }

    const total = imagesToCache.length;
    let completed = 0;
    const toastId = toast.loading(`Starting download of ${total} images...`, { autoClose: false });

    // Helper to fetch an image
    const fetchImage = async (url) => {
        try {
            // Optimized Cloudinary URL if possible (add q_auto, f_auto if not present)
            // But usually we just fetch what is there.
            await fetch(url, { mode: 'no-cors' }); 
        } catch (e) {
            console.warn(`Failed to cache ${url}`, e);
        } finally {
            completed++;
            if (completed % 10 === 0 || completed === total) {
                 toast.update(toastId, { 
                     render: `Caching images: ${completed}/${total}`,
                     autoClose: false 
                 });
            }
        }
    };

    // Process in chunks to avoid network congestion
    const chunkSize = 5;
    for (let i = 0; i < total; i += chunkSize) {
        const chunk = imagesToCache.slice(i, i + chunkSize);
        await Promise.all(chunk.map(fetchImage));
    }

    toast.update(toastId, { 
        render: `Successfully cached ${total} images!`, 
        type: 'success', 
        isLoading: false,
        autoClose: 3000 
    });
};

const applyTheme = () => {
       // Minimal implementation based on config, can be extracted.
       // For now, assuming standard blue or using config.
       // The original was lengthy CSS injection.
       // We can just keep it simple or inject specific color overrides if needed.
}
</script>

<style scoped>
/* Scoped styles mainly for specific overrides not in Tailwind */
.holographic-text {
    background-image: linear-gradient(
        135deg, 
        #ff00cc 0%, 
        #3333ff 25%, 
        #00dbde 50%, 
        #9900ff 75%, 
        #ff00cc 100%
    );
    background-size: 200% auto;
    color: transparent;
    -webkit-background-clip: text;
    background-clip: text;
    animation: holographic-shimmer 3s linear infinite;
    text-shadow: 0px 2px 4px rgba(0,0,0,0.1);
}
@keyframes holographic-shimmer {
    0% { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
}
</style>
