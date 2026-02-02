
<template>
  <div class="min-h-screen w-full bg-slate-50 font-sans text-slate-800 pb-20">
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
      :hide-negative-stocks="hideNegativeStocks"
      :cloud-name="cloudName"
      @toggleSidebar="toggleSidebar"
      @toggleCart="toggleCart"
      @updateStockData="updateStockData"
      @toggleLedgerView="toggleLedgerView"
      @promptAdminLogin="promptAdminLogin"
      @update:searchQuery="searchQuery = $event"
      @update:showImagesOnly="showImagesOnly = $event"
      @update:hideNegativeStocks="hideNegativeStocks = $event"
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

      <!-- Cart Sidebar -->
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
         class="flex-1 w-full px-4 sm:px-6 lg:px-8 mt-[64px] md:mt-[76px] space-y-8 min-w-0 transition-all duration-300"
      >
        <!-- Ledger Placeholder -->
        <div v-if="showLedgerView" class="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
             <i class="fa-solid fa-book-open text-slate-400 text-2xl"></i>
          </div>
          <div class="text-xl font-bold text-slate-700">Ledger View Under Construction</div>
          <p class="text-slate-400 mt-2">Check back soon for accounting features.</p>
        </div>

        <!-- Welcome Splash -->
        <WelcomeSplash v-else-if="showWelcome" />

        <div v-else class="space-y-8">
          <!-- Error Banner -->
          <div v-if="error" class="bg-red-50 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 border border-red-100">
            <i class="fa-solid fa-circle-exclamation"></i>
            <span class="font-medium text-sm">{{ error }}</span>
          </div>

          <!-- GROUP LIST -->
          <div class="space-y-12 pb-10">
            <div
              v-for="(group, index) in filteredStockData"
              :key="group.groupName"
              :id="'group-grid-' + normalizeId(group.groupName)"
              class="relative scroll-mt-28"
            >
              <!-- Group Header (Sticky Glass) -->
              <div
                @click="toggleGroup(group.groupName)"
                class="flex items-center justify-between cursor-pointer select-none py-3 sticky top-[65px] md:top-[75px] z-30 transition-all duration-300 group/header"
                :class="expandedGroups[group.groupName] ? 'mb-4' : ''"
              >
                <!-- Backdrop for sticky readability -->
                 <div class="absolute inset-x-[-16px] inset-y-0 bg-slate-50/90 backdrop-blur-md -z-10 border-b border-slate-200/50 shadow-sm transition-all rounded-b-2xl" 
                      :class="expandedGroups[group.groupName] ? 'opacity-100' : 'opacity-0 delay-200'"></div>

                 <div class="flex items-center gap-4 z-10 pl-2">
                   <!-- Special "New Arrivals" Style -->
                   <div v-if="group.isSpecial" class="flex items-center gap-3">
                      <h2 class="text-3xl font-bold tracking-tighter holographic-text">
                         ✨ {{ group.groupName }}
                      </h2>
                   </div>

                   <!-- Regular Group Style -->
                   <div v-else class="flex items-center gap-3">
                      <h2 class="text-2xl font-semibold text-slate-900 tracking-tight font-heading group-hover/header:text-blue-600 transition-colors">
                        {{ group.groupName }}
                      </h2>
                      <span class="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600 text-xs font-bold">
                        {{ group.products.length }}
                      </span>
                   </div>
                 </div>

                 <!-- Actions -->
                 <div class="flex items-center gap-2 z-10 pr-2">
                    <button 
                         @click.stop="shareBrand(group.groupName)"
                         class="w-8 h-8 flex items-center justify-center rounded-full bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm border border-slate-100"
                         title="Share"
                      >
                         <i class="fa-solid fa-share-nodes text-xs"></i>
                    </button>
                    <div class="w-8 h-8 flex items-center justify-center rounded-full bg-white text-slate-400 shadow-sm border border-slate-100 transition-transform duration-300"
                         :class="expandedGroups[group.groupName] ? 'rotate-180 bg-slate-100' : ''">
                       <i class="fa-solid fa-chevron-down text-xs"></i>
                    </div>
                 </div>
              </div>

              <!-- Product Grid -->
              <transition
                enter-active-class="transition-all duration-500 ease-out"
                enter-from-class="opacity-0 translate-y-4"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition-all duration-200 ease-in"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0"
              >
                <div v-show="expandedGroups[group.groupName]">
                  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-4 gap-y-8">
                    <div
                      v-for="(product, pIndex) in group.products"
                      :key="product.productName"
                      class="group relative flex flex-col bg-white rounded-3xl shadow-card hover:shadow-float transition-all duration-300 border border-transparent mx-auto w-full max-w-[280px]"
                    >
                      <!-- Image Area -->
                      <div class="relative w-full aspect-[4/5] bg-slate-100 rounded-t-3xl overflow-hidden cursor-pointer" @click="openImagePopup(product, index)">
                        <!-- Badge: New -->
                        <div v-if="isNewArrival(product)" class="absolute top-3 left-3 z-20 px-2 py-1 bg-black/80 backdrop-blur-md rounded-lg text-[10px] font-bold text-white uppercase tracking-widest shadow-lg border border-white/10">
                            New
                        </div>
                        
                        <!-- Badge: Stock Low -->
                        <div v-if="product.quantity > 0 && product.quantity <= 5" class="absolute top-3 right-3 z-20 px-2 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-lg shadow-sm">
                            Low Stock
                        </div>
                         <!-- Badge: Out of Stock -->
                        <div v-if="product.quantity <= 0" class="absolute inset-0 z-10 bg-slate-50/80 backdrop-blur-[2px] flex items-center justify-center">
                            <span class="px-3 py-1 bg-slate-200 text-slate-500 text-xs font-bold rounded-full border border-slate-300">Out of Stock</span>
                        </div>


                        <img
                          v-if="product.imageUrl"
                          :src="getOptimizedImageUrl(product.imageUrl)"
                          alt="Product"
                          loading="lazy"
                          class="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                        />
                        <div
                           v-else
                           class="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50"
                        >
                           <i class="fa-solid fa-image text-4xl opacity-20"></i>
                        </div>
                        
                        <!-- Floating Cart Controls (On Image) -->
                        <div v-if="getCartQty(product) > 0" class="absolute bottom-3 right-3 z-20 flex items-center gap-1 p-1 bg-white/95 backdrop-blur rounded-full shadow-lg border border-blue-100 animate-fade-in-up" @click.stop>
                            <button @click.stop="updateCart(product, -1)" class="w-8 h-8 flex items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 transition-colors">
                                <i class="fa-solid fa-minus text-xs"></i>
                            </button>
                            <span class="w-6 text-center text-sm font-bold text-slate-800">{{ getCartQty(product) }}</span>
                            <button @click.stop="updateCart(product, 1)" class="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm">
                                <i class="fa-solid fa-plus text-xs"></i>
                            </button>
                        </div>
                        
                        <!-- Floating Add Button (Initial) -->
                        <button 
                             v-else-if="product.quantity > 0"
                             @click.stop="addToCart(product)"
                             class="absolute bottom-3 right-3 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white text-slate-800 shadow-lg hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110 border border-slate-100 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-300 lg:opacity-100 lg:translate-y-0"
                             title="Add to Cart"
                        >
                              <i class="fa-solid fa-plus"></i>
                        </button>
                        
                        <!-- Image Upload Overlay (Admin) -->
                         <div
                          v-if="isAdmin || isSuperAdmin"
                          class="absolute top-2 left-2 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                           <label class="w-8 h-8 flex items-center justify-center bg-white/90 rounded-full cursor-pointer shadow-md hover:scale-110 transition-transform text-slate-600">
                              <i class="fa-solid fa-camera text-xs"></i>
                              <input type="file" accept="image/*" @change="handleFileChange($event, product.productName)" class="hidden" :disabled="uploading[product.productName]" />
                           </label>
                           
                           <button v-if="imageFiles[product.productName]" @click.stop="uploadImage(product.productName)" class="px-2 py-1 bg-blue-600 text-white text-[10px] font-bold rounded shadow-md">
                             Save
                           </button>

                           <button v-if="product.imageUrl" @click.stop="deleteImage(product.productName)" class="w-8 h-8 flex items-center justify-center bg-red-500/90 text-white rounded-full shadow-md hover:bg-red-600">
                             <i class="fa-solid fa-trash text-[10px]"></i>
                           </button>
                        </div>
                      </div>

                      <!-- Content -->
                      <div class="p-4 flex flex-col flex-1 pb-5">
                          <!-- Title -->
                          <div class="mb-2">
                             <h3 class="text-sm font-bold text-slate-800 leading-snug line-clamp-2 min-h-[2.5em] group-hover:text-blue-600 transition-colors" :title="product.productName">
                                {{ getCleanProductName(product.productName) }}
                             </h3>
                          </div>
                          
                          <!-- Details Row -->
                          <div class="flex items-center justify-between mb-4">
                              <div class="flex items-center gap-1.5 overflow-hidden">
                                 <!-- Color Dot -->
                                 <span v-if="getProductColor(product.productName)" 
                                       class="w-3 h-3 rounded-full shadow-sm ring-1 ring-slate-100" 
                                       :style="{ backgroundColor: getProductColor(product.productName).hex }"
                                       :title="getProductColor(product.productName).text"
                                 ></span>
                                 <span v-if="getProductColor(product.productName)" class="text-[11px] font-medium text-slate-500 capitalize truncate max-w-[60px]">
                                    {{ getProductColor(product.productName).text }}
                                 </span>
                              </div>
                              
                              <span v-if="getProductSize(product.productName)" class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold border border-slate-200">
                                 {{ getProductSize(product.productName) }}
                              </span>
                          </div>

                          <!-- Footer -->
                          <div class="mt-auto flex items-end justify-between border-t border-dashed border-slate-100 pt-3">
                              <div class="flex flex-col">
                                 <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{{ getPriceInfo(product.productName).label }}</span>
                                 <div class="text-lg font-black text-slate-900 leading-none">
                                    <span class="text-xs align-top font-medium mr-0.5">₹</span>{{ getPriceInfo(product.productName).price }}
                                 </div>
                              </div>
                              <div class="text-right flex flex-col items-end">
                                 <span class="text-[10px] font-medium" :class="product.quantity < 5 ? 'text-amber-500' : 'text-slate-400'">
                                    {{ product.quantity }} Pairs
                                 </span>
                              </div>
                          </div>
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
        class="fixed bottom-24 md:bottom-6 right-6 w-12 h-12 flex items-center justify-center bg-slate-900 text-white rounded-full shadow-lg hover:shadow-xl hover:bg-black transition-all hover:-translate-y-1 active:scale-90 z-40"
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

    <!-- Admin Data Loading Overlay -->
     <transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="loading && !showWelcome" class="fixed inset-0 z-[100] bg-white/50 backdrop-blur-sm flex items-center justify-center pointer-events-none">
         <div class="bg-white px-6 py-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3">
             <div class="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
             <span class="text-sm font-bold text-slate-700">Updating...</span>
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
import { formatProductName, normalizeId, getOptimizedImageUrl, isNewArrival } from '../utils/formatters';
// Composables
import { useCart } from '../composables/useCart';
import { useProductFilter } from '../composables/useProductFilter';
import { useBrandGroups } from '../composables/useBrandGroups';
import { useWhatsAppOrder } from '../composables/useWhatsAppOrder';
import { useStockData } from '../composables/useStockData';
import { useAdmin } from '../composables/useAdmin';
import { extractColor } from '../utils/colors'; 
// Components
import DesktopToolbar from './StockTable/DesktopToolbar.vue';
import BrandsSidebar from './StockTable/BrandsSidebar.vue';
import CartSidebar from './StockTable/CartSidebar.vue';
import WelcomeSplash from './WelcomeSplash.vue'; 
import { defineAsyncComponent } from 'vue';

const ImageModal = defineAsyncComponent(() => import('./StockTable/ImageModal.vue'));
const OrderModal = defineAsyncComponent(() => import('./StockTable/OrderModal.vue'));

// Init Core State
const isLocal = ref(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const showGoToTop = ref(false);
const showSidePanel = ref(false);
const showCart = ref(false);
const showLedgerView = ref(false);
const showWelcome = ref(true); // Welcome Splash State
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
  searchQuery, selectedGroup, showImagesOnly, hideNegativeStocks,
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
    // Hide Welcome Splash after 1.5 seconds
    setTimeout(() => {
        showWelcome.value = false;
    }, 1500);

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
    clean = clean.replace(/[\/\-]+\s*$/g, '') 
                 .replace(/^\s*[\/\-]+/g, '') 
                 .replace(/\s*[\/\-]+\s*/g, ' '); 
    
    const cleanedString = clean.replace(/\s+/g, ' ').trim();
    return formatProductName(cleanedString);
};

// Scroll Logic Re-implementation
const scrollToGroup = (groupName, behavior = 'instant') => {
    expandedGroups.value[groupName] = true;

    const currentList = filteredStockData.value.map(g => g.groupName);
    if (!currentList.includes(groupName)) {
        selectedGroup.value = 'All'; 
    }

    nextTick(() => {
        const id = 'group-grid-' + normalizeId(groupName);
        const element = document.getElementById(id);
        if (element) {
             const y = element.getBoundingClientRect().top + window.scrollY - 180; // Adjusted offset for sticky header
             window.scrollTo({ top: y, behavior });
             activeScrollGroup.value = groupName;
             
             const url = new URL(window.location);
             url.searchParams.set('brand', groupName);
             window.history.replaceState(null, '', url);
             
             if (window.innerWidth < 1024 && showSidePanel.value) {
                 showSidePanel.value = false;
             }
        }
    });
};

const handleSidebarClick = (group) => {
    scrollToGroup(group.groupName, 'smooth');
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

    const chunkSize = 5;
    for (let i = 0; i < total; i += chunkSize) {
        const chunk = imagesToCache.slice(i, i + chunkSize);
        await Promise.all(chunk.map(url => fetchImage(url)));
    }
    
    toast.update(toastId, { render: "All images cached successfully!", type: "success", isLoading: false, autoClose: 3000 });
};
</script>
