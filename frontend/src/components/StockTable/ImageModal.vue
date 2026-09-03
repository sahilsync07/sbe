<template>
  <!-- Full Screen Single-Viewport Product Modal (Zero Scrolling Required) -->
  <transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div
      v-if="showImagePopup"
      class="fixed inset-0 z-[100] bg-[#09090b] flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden select-none"
    >
      <!-- 1. TOP HEADER (Fixed Height, Safe Area Aware) -->
      <header
        class="shrink-0 z-10 bg-neutral-900/90 backdrop-blur-md border-b border-white/10 px-4 pb-2.5 flex items-center justify-between shadow-md"
        style="padding-top: max(env(safe-area-inset-top, 0.75rem), 0.75rem);"
      >
        <!-- Back / Close Button -->
        <button
          @click.stop.prevent="$emit('close', { isPop: false })"
          class="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:scale-90 text-white transition-all border border-white/10 shadow-sm"
          title="Back to Catalog"
        >
          <i class="fa-solid fa-arrow-left text-sm"></i>
        </button>

        <!-- Brand / Group Name -->
        <div class="flex-1 mx-3 text-center min-w-0">
          <h2
            v-if="currentGroupName === 'New Arrivals'"
            class="text-sm sm:text-base font-bold text-amber-400 truncate tracking-wide"
          >
            ✨ {{ currentGroupName }}
          </h2>
          <h2
            v-else
            class="text-sm sm:text-base font-bold text-white truncate tracking-wide"
          >
            {{ formatGroupName(currentGroupName) || 'Product Details' }}
          </h2>
        </div>

        <!-- Position Counter / Close -->
        <div class="flex items-center gap-2">
          <span
            v-if="totalProducts > 0"
            class="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 text-slate-300 border border-white/10"
          >
            {{ (currentProductIndex || 0) + 1 }} / {{ totalProducts }}
          </span>
          <button
            @click.stop.prevent="$emit('close', { isPop: false })"
            class="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:scale-90 text-white transition-all border border-white/10 shadow-sm"
            title="Close"
          >
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>
      </header>

      <!-- 2. MAIN IMAGE CANVAS (Takes all remaining vertical space, NEVER scrolls) -->
      <main
        class="flex-1 min-h-0 w-full relative flex items-center justify-center p-3 sm:p-6 overflow-hidden bg-neutral-950"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <!-- Product Image (Aspect ratio preserved, fit-to-canvas, non-squeezed) -->
        <div class="w-full h-full flex items-center justify-center relative">
          <CachedImage
            v-if="currentProduct && currentProduct.imageUrl"
            :src="getOptimizedUrl(currentProduct.imageUrl)"
            :cache-key="getCacheKeyUrl(currentProduct.imageUrl)"
            :alt="currentProduct.productName || 'Product Image'"
            class="max-h-full max-w-full w-auto h-auto object-contain rounded-2xl drop-shadow-2xl transition-all duration-200"
            :key="(currentProduct.productName || '') + '_' + (currentProduct.imageUrl || '')"
          />
          <div v-else class="flex flex-col items-center gap-3 text-slate-500">
            <i class="fa-solid fa-image text-5xl opacity-30"></i>
            <span class="text-xs font-medium tracking-wide">No Image Available</span>
          </div>
        </div>

        <!-- Side Navigation Arrows (Floating on image edges for easy thumb tap) -->
        <button
          @click.stop.prevent="handleNav(-1)"
          class="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white active:scale-90 transition-all border border-white/15 backdrop-blur-md shadow-xl"
          title="Previous Product"
        >
          <i class="fa-solid fa-chevron-left text-sm"></i>
        </button>

        <button
          @click.stop.prevent="handleNav(1)"
          class="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white active:scale-90 transition-all border border-white/15 backdrop-blur-md shadow-xl"
          title="Next Product"
        >
          <i class="fa-solid fa-chevron-right text-sm"></i>
        </button>
      </main>

      <!-- 3. BOTTOM ACTION BAR (Docked at the bottom, Zero Scrolling) -->
      <footer
        class="shrink-0 bg-neutral-900/95 backdrop-blur-md border-t border-white/10 px-4 pt-3 shadow-2xl"
        style="padding-bottom: max(env(safe-area-inset-bottom, 0.75rem), 0.75rem);"
      >
        <!-- Product Details Line -->
        <div class="flex items-center justify-between gap-3 mb-2.5">
          <div class="flex-1 min-w-0">
            <h3 class="text-base sm:text-lg font-bold text-white truncate leading-tight">
              {{ getCleanProductName(currentProduct?.productName) }}
            </h3>
            
            <!-- Badges: Color, Size, Stock -->
            <div class="flex items-center gap-2 mt-1 flex-wrap">
              <!-- Color Badge -->
              <span
                v-if="getProductColor(currentProduct?.productName)"
                class="flex items-center gap-1.5 px-2 py-0.5 bg-white/10 rounded-full text-[10px] sm:text-[11px] text-slate-300 capitalize font-medium"
              >
                <span
                  class="w-2 h-2 rounded-full ring-1 ring-white/30"
                  :style="{ backgroundColor: getProductColor(currentProduct?.productName).hex }"
                ></span>
                {{ getProductColor(currentProduct?.productName).text }}
              </span>

              <!-- Size Badge -->
              <span
                v-if="getProductSize(currentProduct?.productName)"
                class="px-2 py-0.5 bg-white/10 rounded-full text-[10px] sm:text-[11px] font-semibold text-slate-300"
              >
                {{ getProductSize(currentProduct?.productName) }}
              </span>

              <!-- Stock Status Badge -->
              <span
                class="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold"
                :class="(currentProduct?.quantity || 0) > 4 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : (currentProduct?.quantity || 0) > 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'"
              >
                {{ (currentProduct?.quantity || 0) > 0 ? `${currentProduct.quantity} Pairs in stock` : 'Out of Stock' }}
              </span>
            </div>
          </div>

          <!-- Price Pill -->
          <div class="shrink-0 text-right bg-[#c59b27]/15 border border-[#c59b27]/40 px-3 py-1 rounded-xl">
            <div class="text-[9px] uppercase font-bold text-amber-300/80 tracking-wider">
              {{ getPriceInfo(currentProduct?.productName).label }}
            </div>
            <div class="text-base sm:text-lg font-black text-amber-400 leading-none">
              ₹{{ getPriceInfo(currentProduct?.productName).price }}
            </div>
          </div>
        </div>

        <!-- Action Row: [ Prev ] [ Add to Cart / Qty ] [ Next ] -->
        <div class="flex items-center gap-2.5">
          <!-- Prev Button -->
          <button
            @click.stop.prevent="handleNav(-1)"
            class="h-12 px-3.5 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/15 text-white active:scale-95 transition-all border border-white/10 text-xs font-bold gap-1.5 shrink-0 shadow-sm"
            title="Previous Item"
          >
            <i class="fa-solid fa-arrow-left text-xs"></i>
            <span class="hidden sm:inline">Prev</span>
          </button>

          <!-- Add to Cart / Quantity Controller -->
          <button
            v-if="cartQty === 0"
            @click.stop.prevent="addToCart(currentProduct)"
            class="flex-1 h-12 bg-[#c59b27] hover:bg-amber-500 active:scale-[0.98] text-slate-950 font-bold text-sm sm:text-base rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <i class="fa-solid fa-plus text-xs"></i>
            <span>Add to Cart</span>
          </button>

          <div
            v-else
            class="flex-1 h-12 flex items-center bg-white/10 rounded-2xl border border-white/15 overflow-hidden"
          >
            <button
              @click.stop.prevent="updateCart(currentProduct, -1)"
              class="w-14 h-full flex items-center justify-center text-white text-lg font-bold active:bg-white/20 transition-all"
            >
              <i class="fa-solid fa-minus text-xs"></i>
            </button>
            <span class="flex-1 text-center text-base sm:text-lg font-black text-amber-400">
              {{ cartQty }}
            </span>
            <button
              @click.stop.prevent="updateCart(currentProduct, 1)"
              class="w-14 h-full flex items-center justify-center text-white text-lg font-bold active:bg-white/20 transition-all"
            >
              <i class="fa-solid fa-plus text-xs"></i>
            </button>
          </div>

          <!-- Next Button -->
          <button
            @click.stop.prevent="handleNav(1)"
            class="h-12 px-3.5 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/15 text-white active:scale-95 transition-all border border-white/10 text-xs font-bold gap-1.5 shrink-0 shadow-sm"
            title="Next Item"
          >
            <span class="hidden sm:inline">Next</span>
            <i class="fa-solid fa-arrow-right text-xs"></i>
          </button>
        </div>
      </footer>
    </div>
  </transition>
</template>

<script setup>
import { computed, defineAsyncComponent, ref } from 'vue';
import { extractColor } from '../../utils/colors';
import { useCart } from '../../composables/useCart';

const { getCartQty, addToCart, updateCart } = useCart();

const CachedImage = defineAsyncComponent(() => import('./CachedImage.vue'));

const props = defineProps({
  showImagePopup: Boolean,
  currentProduct: Object,
  currentProductIndex: Number,
  isLastProduct: Boolean,
  currentGroupName: String,
  totalProducts: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['close', 'navigate']);

const cartQty = computed(() => {
  if (!props.currentProduct) return 0;
  return getCartQty(props.currentProduct);
});

// Debounced navigation to prevent accidental double clicks / touch ghost clicks
let navLock = false;
const handleNav = (dir) => {
  if (navLock) return;
  navLock = true;
  setTimeout(() => { navLock = false; }, 250);
  emit('navigate', dir);
};

// Touch swipe handling for image canvas
const touchStartX = ref(0);
const touchStartY = ref(0);
const touchEndX = ref(0);
const touchEndY = ref(0);

const handleTouchStart = (e) => {
  if (!e.changedTouches || e.changedTouches.length === 0) return;
  touchStartX.value = e.changedTouches[0].clientX;
  touchStartY.value = e.changedTouches[0].clientY;
};

const handleTouchMove = (e) => {
  if (!e.changedTouches || e.changedTouches.length === 0) return;
  touchEndX.value = e.changedTouches[0].clientX;
  touchEndY.value = e.changedTouches[0].clientY;
};

const handleTouchEnd = () => {
  const swipeThreshold = 45;
  const diffX = touchStartX.value - touchEndX.value;
  const diffY = touchStartY.value - touchEndY.value;

  // Only consider horizontal swipe if X movement is significantly larger than Y movement
  if (Math.abs(diffX) > swipeThreshold && Math.abs(diffX) > Math.abs(diffY) * 1.3) {
    if (diffX > 0) {
      handleNav(1); // Swiped left -> Next product
    } else {
      handleNav(-1); // Swiped right -> Previous product
    }
  }

  touchStartX.value = 0;
  touchStartY.value = 0;
  touchEndX.value = 0;
  touchEndY.value = 0;
};

const getOptimizedUrl = (imageUrl) => {
  if (!imageUrl) return null;
  try {
    const parts = imageUrl.split("/upload/");
    if (parts.length !== 2) return imageUrl;
    const transformation = "w_1000,q_75,f_auto";
    return `${parts[0]}/upload/${transformation}/${parts[1]}`;
  } catch (e) {
    return imageUrl;
  }
};

const getCacheKeyUrl = (imageUrl) => {
  if (!imageUrl) return null;
  try {
    const parts = imageUrl.split("/upload/");
    if (parts.length !== 2) return imageUrl;
    const transformation = "w_400,q_70,f_auto";
    return `${parts[0]}/upload/${transformation}/${parts[1]}`;
  } catch (e) {
    return imageUrl;
  }
};

const formatGroupName = (name) => {
  if (!name) return '';
  return name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const getPriceInfo = (name) => {
  if (!name) return { label: 'Net Rate', price: '?' };
  const match = name.match(/((?:RS|MRP|@))[\.\s]*(\d+(\.\d+)?)/i);
  if (match) {
    const prefix = match[1].toUpperCase();
    return {
      label: prefix === 'MRP' ? 'MRP' : 'Net Rate',
      price: match[2]
    };
  }
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
    return `Size ${low}x${high}`;
  }
  return null;
};

const getProductColor = (name) => {
  return extractColor(name);
};

const getCleanProductName = (name) => {
  if (!name) return '';
  let clean = name;

  const colorData = extractColor(name);
  if (colorData && colorData.originalTokens) {
    colorData.originalTokens.forEach(token => {
      const regex = new RegExp(`\\b${token}\\b`, 'gi');
      clean = clean.replace(regex, '');
    });
  }

  clean = clean.replace(/((?:RS|MRP|@))[\.\s]*(\d+(\.\d+)?)/gi, '');
  clean = clean.replace(/(?:^|[\s\(])(\d{1,2})\s*[xX*]\s*(\d{1,2})(?:[\s\)]|$)/g, ' ');
  clean = clean.replace(/\(\s*\)/g, '');
  clean = clean.replace(/[\/\-]+\s*$/g, '')
               .replace(/^\s*[\/\-]+/g, '')
               .replace(/\s*[\/\-]+\s*/g, ' ');

  const cleanedString = clean.replace(/\s+/g, ' ').trim().toLowerCase();
  return cleanedString.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};
</script>
