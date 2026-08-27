
<template>
  <div>
    <!-- Desktop Toolbar (Hidden on Mobile) -->
    <header 
      class="hidden lg:block fixed inset-x-0 top-0 z-[60] bg-[#121214]/95 backdrop-blur-md border-b border-amber-500/20 shadow-lg transition-all duration-300 safe-area-top-fixed rounded-b-3xl"
    >
      <!-- Inner content wrapper with fixed height -->
      <div class="h-[72px] flex items-center justify-between px-6">
        <!-- Left Section: Sidebar, Sync, Search -->
        <div class="flex items-center gap-3.5 flex-1 min-w-0 mr-4">
          <button
            @click="$emit('toggleSidebar')"
            class="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-slate-300 hover:bg-[#c59b27] hover:text-white transition-all active:scale-95 shrink-0 border border-white/10"
            :class="{ 'opacity-0 pointer-events-none': showCart }"
            title="All Brands Menu"
          >
             <i v-if="showSidePanel" class="fa-solid fa-xmark text-sm"></i>
             <i v-else class="fa-solid fa-bars text-sm"></i>
          </button>

          <!-- Sync/Ledger (Admin) -->
          <div class="flex items-center gap-2 shrink-0">
            <button
               v-if="isAdmin && !isSuperAdmin"
               @click="$emit('updateStockData')"
               class="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 hover:text-amber-400 transition-all border border-white/10"
               title="Sync Data"
            >
              <i class="fa-solid fa-rotate" :class="{ 'animate-spin text-amber-400': loading }"></i>
            </button>
            <button
              v-if="isSuperAdmin"
              @click="$router.push('/ledger')"
              class="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 hover:text-amber-400 transition-colors border border-white/10"
              title="Ledger View"
            >
               <i class="fa-solid fa-book-open"></i>
            </button>
          </div>

          <!-- Search Bar (Flexible) -->
          <div v-if="$route.path === '/'" class="relative flex-1 max-w-sm group" ref="desktopSearchRef">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-400 transition-colors">
                 <i class="fa-solid fa-magnifying-glass text-sm"></i>
              </span>
              <input
                :value="localQuery"
                @input="handleSearchInput"
                @keydown.enter="executeSearch(localQuery)"
                @focus="showDesktopDropdown = true"
                type="text"
                placeholder='Search products...'
                class="w-full pl-10 pr-4 py-2 rounded-full bg-white/5 border border-white/15 focus:bg-black focus:border-[#c59b27] focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all text-sm font-medium text-white placeholder-slate-400"
              />
              
              <!-- Desktop Smart Dropdown -->
              <transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="translate-y-2 opacity-0"
                enter-to-class="translate-y-0 opacity-100"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="translate-y-0 opacity-100"
                leave-to-class="translate-y-2 opacity-0"
              >
                <div v-if="showDesktopDropdown && localQuery.trim().length > 0" 
                     class="fixed top-[84px] left-4 right-4 lg:left-1/2 lg:-translate-x-1/2 lg:w-[800px] max-w-full bg-[#18181b] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden z-[70] max-h-[60vh] flex flex-col">
                  <div class="overflow-y-auto overscroll-contain flex-1 p-2 space-y-1 no-scrollbar">
                    <button 
                      @click="executeSearch(localQuery)"
                      class="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 transition-colors flex items-center gap-3 border border-transparent"
                    >
                       <div class="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                          <i class="fa-solid fa-magnifying-glass text-amber-400 text-sm"></i>
                       </div>
                       <div class="flex-1 overflow-hidden">
                          <div class="text-white font-medium truncate text-sm">Search for "{{ localQuery.trim() }}"</div>
                          <div class="text-slate-400 text-xs mt-0.5">Press Enter to see all results</div>
                       </div>
                    </button>
                    
                    <div v-if="searchSuggestions.length > 0" class="h-px bg-white/10 my-2 mx-4"></div>
                    
                    <button
                      v-for="product in searchSuggestions"
                      :key="product.productName"
                      @click="executeSearch(product)"
                      class="w-full text-left px-5 py-3.5 rounded-xl hover:bg-white/5 transition-colors flex items-center gap-4 border border-transparent"
                    >
                       <div class="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 overflow-hidden shadow-inner">
                          <img v-if="product.imageUrl" :src="product.imageUrl" class="w-full h-full object-cover" />
                          <i v-else class="fa-solid fa-box text-slate-500 text-lg"></i>
                       </div>
                       <div class="flex-1 overflow-hidden">
                          <div class="text-white font-['Clash_Display'] font-bold tracking-wide truncate text-base">{{ formatProductNameToolbar(product.productName) }}</div>
                          <div class="text-slate-300 font-medium text-xs mt-1 truncate flex items-center gap-2.5">
                            <span v-if="getProductColor(product.productName)" class="flex items-center gap-1">
                              <span class="w-2.5 h-2.5 rounded-full ring-1 ring-white/20 shrink-0" :style="{ backgroundColor: getProductColor(product.productName).hex }"></span>
                              <span class="capitalize">{{ getProductColor(product.productName).text }}</span>
                              <span class="w-1 h-1 rounded-full bg-slate-600"></span>
                            </span>
                            <span v-if="getProductSize(product.productName)" class="flex items-center gap-1">
                              <span class="font-bold text-slate-300">Size {{ getProductSize(product.productName) }}</span>
                              <span class="w-1 h-1 rounded-full bg-slate-600"></span>
                            </span>
                            <span v-if="product.quantity > 0" class="text-emerald-400">{{ product.quantity }} pairs</span>
                            <span v-else class="text-rose-400">Out of Stock</span>
                            <span class="w-1 h-1 rounded-full bg-slate-600"></span>
                            <span>{{ getPriceInfo(product.productName).label }} ₹{{ getPriceInfo(product.productName).price }}</span>
                          </div>
                       </div>
                       <i class="fa-solid fa-arrow-right text-slate-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity"></i>
                    </button>
                    
                    <div v-if="searchSuggestions.length === 0" class="px-4 py-6 text-center text-slate-400 text-sm">
                       No specific products found matching "{{ localQuery.trim() }}"
                    </div>
                  </div>
                </div>
              </transition>
          </div>
        </div>

        <!-- Center Section: New e-SBE Logo -->
        <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 pointer-events-none">
          <div 
            class="select-none pointer-events-auto cursor-pointer flex items-center gap-2"
            @mousedown="logoStartPress"
            @mouseup="logoEndPress"
            @mouseleave="logoCancelPress"
            @touchstart.prevent="logoStartPress"
            @touchend.prevent="logoEndPress"
            @touchcancel="logoCancelPress"
            @contextmenu.prevent
            title="Tap: Home • Long Press: Admin"
          >
            <img src="/assets/e-sbe-logo.png" alt="e-SBE" class="h-8 w-auto object-contain invert brightness-200" />
          </div>
          <!-- Status Pill -->
          <div class="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full shadow-sm mt-0.5">
            <span class="w-1.5 h-1.5 rounded-full" :class="statusColor"></span>
            <span>{{ formattedLastRefresh || 'Live Catalog' }}</span>
          </div>
        </div>

        <!-- Right Section: PDF, Toggles, Cart -->
        <div class="flex items-center gap-3 flex-1 justify-end ml-4">
            <!-- PDF Gen -->
            <button
              @click="$router.push('/pdf-gen')"
              class="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 hover:text-red-400 transition-all border border-white/10 shrink-0"
              title="Generate PDF"
            >
              <i class="fa-solid fa-file-pdf"></i>
            </button>

            <!-- Toggles -->
            <button 
              @click="cleanView = !cleanView"
              class="w-10 h-10 flex items-center justify-center rounded-xl border transition-all duration-300"
              :class="cleanView ? 'bg-gradient-to-br from-amber-400 to-amber-600 border-amber-400 text-black shadow-md font-bold' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-amber-400'"
              title="Clean View (Images Only & In Stock)"
            >
              <i class="fa-solid fa-wand-magic-sparkles text-sm"></i>
            </button>

            <!-- Cart -->
            <button
              @click="$emit('toggleCart')"
              class="relative w-11 h-11 flex items-center justify-center rounded-full bg-[#c59b27] text-white hover:bg-amber-500 transition-all shadow-lg shadow-amber-500/20 active:scale-95 shrink-0"
              :class="{ 'opacity-0 pointer-events-none': showSidePanel }"
            >
              <i v-if="showCart" class="fa-solid fa-xmark text-lg"></i>
              <div v-else class="flex items-center justify-center w-full h-full">
                <div v-if="cartTotalItems > 0" class="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black h-5 w-5 flex items-center justify-center rounded-full shadow-sm z-10 ring-2 ring-black">{{ cartTotalItems }}</div>
                <i class="fa-solid fa-bag-shopping text-base"></i>
              </div>
            </button>
        </div>
      </div>
    </header>

    <!-- Mobile Top Bar (Visible on Mobile) -->
    <header 
      class="lg:hidden fixed inset-x-0 top-0 z-[60] bg-[#121214]/95 backdrop-blur-md border-b border-white/10 shadow-sm transition-all"
      style="padding-top: env(safe-area-inset-top, 0px)"
    >
      <div class="h-[54px] flex items-center justify-between px-4 relative">
         <!-- Left: Sidebar Toggle -->
         <div class="flex items-center gap-2">
            <button
               @click="$emit('toggleSidebar')"
               class="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-slate-300 active:bg-amber-500 active:text-white transition-all border border-white/10"
               title="Menu"
            >
               <i v-if="showSidePanel" class="fa-solid fa-xmark text-sm"></i>
               <i v-else class="fa-solid fa-bars text-sm"></i>
            </button>

            <button
               @click="goHome"
               class="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-slate-300 active:bg-amber-500 active:text-white transition-all border border-white/10 shadow-sm"
               title="Home"
            >
               <i class="fa-solid fa-house text-sm"></i>
            </button>
         </div>

         <!-- Center: e-SBE Logo Emblem -->
         <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center pointer-events-none">
            <img src="/assets/e-sbe-logo.png" alt="e-SBE" class="h-6 w-auto object-contain invert brightness-200 pointer-events-auto cursor-pointer" @click="goHome" />
         </div>

         <!-- Right: PDF & Cart -->
         <div class="flex items-center gap-2">
            <button
               @click="$router.push('/pdf-gen')"
               class="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-slate-300 border border-white/10"
               title="PDF"
            >
              <i class="fa-solid fa-file-pdf text-xs"></i>
            </button>

            <button
              @click="$emit('toggleCart')"
              class="relative w-9 h-9 flex items-center justify-center rounded-full bg-[#c59b27] text-white shadow-md active:scale-95"
              title="Cart"
            >
              <div v-if="cartTotalItems > 0" class="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full ring-2 ring-black">{{ cartTotalItems }}</div>
              <i class="fa-solid fa-bag-shopping text-xs"></i>
            </button>
         </div>
      </div>
    </header>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { extractColor } from '../../utils/colors';

// Pinia global stores
import { useAppStore } from '../../stores/appStore';
import { useCartStore } from '../../stores/cartStore';
import { storeToRefs } from 'pinia';

const appStore = useAppStore();
const cartStore = useCartStore();
const router = useRouter();

const { 
  isAdmin, 
  isSuperAdmin, 
  isRefreshing, 
  lastSyncTime: lastRefresh, 
  searchQuery, 
  cleanView, 
  stockData 
} = storeToRefs(appStore);

const { cartTotalItems } = storeToRefs(cartStore);

const props = defineProps({
  loading: Boolean,
  showSidePanel: Boolean,
  showCart: Boolean,
  companyName: {
    type: String,
    default: ''
  },
  cloudName: String,
  isCachingImages: {
    type: Boolean,
    default: false
  },
  hideMobileBottomBar: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  'toggleSidebar', 
  'toggleCart', 
  'updateStockData', 
  'toggleLedgerView', 
  'promptAdminLogin',
  'cacheImages',
  'refreshData'
]);

const formattedLastRefresh = computed(() => {
  if (!lastRefresh.value) return "";
  const date = new Date(lastRefresh.value);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);
  const diffInDays = Math.floor(diffInHours / 24);

  let timeString = "";
  if (diffInHours <= 7) timeString = "Recently";
  else if (diffInHours < 24) timeString = `${Math.floor(diffInHours)}h ago`;
  else if (diffInDays < 7) timeString = `${diffInDays}d ago`;
  else {
      timeString = date.toLocaleString("en-IN", { 
          day: 'numeric',
          month: 'short'
      });
  }
  return `Synced ${timeString}`;
});

const statusColor = computed(() => {
  if (!lastRefresh.value) return "bg-rose-500";
  const date = new Date(lastRefresh.value);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);
  const diffInDays = diffInHours / 24;

  if (diffInDays < 1) return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]";
  if (diffInDays <= 3) return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]";
  return "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]";
});

// --- Long Press Logic for Logo ---
let logoPressTimer = null;
let logoDidLongPress = false;

const goHome = () => {
    appStore.setShowLanding(true);
    searchQuery.value = '';
    router.push('/');
};

const logoStartPress = () => {
    logoDidLongPress = false;
    logoPressTimer = setTimeout(() => {
        logoDidLongPress = true;
        emit('promptAdminLogin');
        if (navigator.vibrate && navigator.userActivation && navigator.userActivation.hasBeenActive) navigator.vibrate(50);
    }, 600);
};

const logoEndPress = () => {
    clearTimeout(logoPressTimer);
    if (!logoDidLongPress) {
        goHome();
    }
};

const logoCancelPress = () => {
    clearTimeout(logoPressTimer);
};

// --- Smart Dropdown Search Logic ---
const localQuery = ref(searchQuery.value || '');
const showDesktopDropdown = ref(false);
const desktopSearchRef = ref(null);

const formatProductNameToolbar = (fullName) => {
    if (!fullName) return '';
    let clean = fullName;

    const colorData = extractColor(fullName);
    if (colorData && colorData.originalTokens) {
        colorData.originalTokens.forEach(token => {
            const regex = new RegExp(`\\b${token}\\b`, 'gi');
            clean = clean.replace(regex, '');
        });
    }

    clean = clean.replace(/((?:RS|MRP|@))[.\s]*(\d+(\.\d+)?)/gi, '');
    clean = clean.replace(/(?:^|[\s(])(\d{1,2})\s*[xX*]\s*(\d{1,2})(?:[\s)]|$)/g, ' ');
    clean = clean.replace(/\(\s*\)/g, '');
    clean = clean.replace(/[/\-.]+\s*$/g, '')
                 .replace(/^\s*[/\-.]+/g, '')
                 .replace(/\s*[/\-.]+\s*/g, ' ');

    return clean
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
};

const getProductColor = (name) => extractColor(name);

const getProductSize = (name) => {
    if (!name) return null;
    const match = name.match(/(?:^|[\s\(])(\d{1,2})\s*[xX*]\s*(\d{1,2})(?:[\s\)]|$)/);
    if (match) {
        const n1 = parseInt(match[1]);
        const n2 = parseInt(match[2]);
        return `${Math.min(n1, n2)}x${Math.max(n1, n2)}`;
    }
    return null;
};

const getPriceInfo = (name) => {
    if (!name) return { label: 'Net Rate', price: '?' };
    const match = name.match(/((?:RS|MRP|@))[.\s]*(\d+(\.\d+)?)/i);
    if (match) {
        return {
            label: match[1].toUpperCase() === 'MRP' ? 'MRP' : 'Net Rate',
            price: match[2]
        };
    }
    const fallback = name.match(/(\d+(\.\d+)?)(?!.*\d)/);
    return {
        label: 'Net Rate',
        price: fallback ? fallback[0] : '?'
    };
};

const searchSuggestions = computed(() => {
  const query = localQuery.value.trim().toLowerCase();
  if (!query) return [];
  
  const queryParts = query.split(/\s+/).filter(Boolean);
  const matches = [];
  const maxSuggestions = 8;
  
  if (stockData.value && Array.isArray(stockData.value)) {
    for (const group of stockData.value) {
      if (group.products && Array.isArray(group.products)) {
        for (const product of group.products) {
          if (product.productName) {
            const productName = product.productName.toLowerCase();
            if (queryParts.every(part => productName.includes(part))) {
              matches.push(product);
              if (matches.length >= maxSuggestions) {
                return matches;
              }
            }
          }
        }
      }
    }
  }
  return matches;
});

const executeSearch = (itemOrQuery) => {
  let query = '';
  
  if (typeof itemOrQuery === 'string') {
    query = itemOrQuery;
  } else if (itemOrQuery && itemOrQuery.productName) {
    query = itemOrQuery.productName;
    const isClean = !!itemOrQuery.imageUrl && Number(itemOrQuery.quantity) >= 4;
    cleanView.value = isClean;
  }
  
  searchQuery.value = query;
  localQuery.value = '';
  showDesktopDropdown.value = false;
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
};

const handleSearchInput = (event) => {
  localQuery.value = event.target.value;
  showDesktopDropdown.value = true;
};

const handleClickOutside = (event) => {
  if (desktopSearchRef.value && !desktopSearchRef.value.contains(event.target)) {
    showDesktopDropdown.value = false;
  }
};

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
  document.addEventListener('touchstart', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside);
  document.removeEventListener('touchstart', handleClickOutside);
});

watch(() => searchQuery.value, (newVal) => {
  if (newVal === '') {
    localQuery.value = '';
  }
});
</script>

