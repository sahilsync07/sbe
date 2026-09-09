<template>
  <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group/card relative h-full">
    <!-- 1. IMAGE CONTAINER (Same aspect-[4/5] as all standard product cards) -->
    <div 
      class="relative w-full aspect-[4/5] bg-slate-50 overflow-hidden cursor-pointer flex items-center justify-center p-2.5 shrink-0"
      @click="$emit('open-image-popup', { productName: core.name, imageUrl: core.img })"
    >
      <!-- Badges Overlay -->
      <div class="absolute top-1.5 left-1.5 z-20 flex items-center gap-1">
        <span class="px-2 py-0.5 rounded-full bg-slate-950/85 backdrop-blur-md text-amber-400 text-[9px] font-black tracking-wider uppercase shadow-xs">
          CORE
        </span>
      </div>

      <!-- Total Stock Badge -->
      <div class="absolute top-1.5 right-1.5 z-20">
        <span 
          class="px-2 py-0.5 rounded-full text-[9px] font-black shadow-xs backdrop-blur-md"
          :class="core.totalStock > 0 ? 'bg-emerald-500/90 text-white' : 'bg-slate-700/80 text-slate-200'"
        >
          {{ core.totalStock > 0 ? core.totalStock + ' prs' : '0 in stock' }}
        </span>
      </div>

      <!-- Core Model Photo -->
      <CachedImage
        v-if="core.img"
        :src="getOptimizedImageUrl(core.img)"
        :alt="core.name"
        class="w-full h-full object-contain transition-transform duration-500 group-hover/card:scale-105"
      />
      <div v-else class="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50 p-2 text-center">
        <i class="fa-solid fa-image text-2xl opacity-20 mb-1"></i>
      </div>

      <!-- Total in Cart Indicator across all sizes of this model -->
      <div 
        v-if="totalCartForCore > 0"
        class="absolute bottom-2 left-2 z-20 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] shadow-md flex items-center gap-1 pointer-events-none"
      >
        <i class="fa-solid fa-cart-shopping text-[9px]"></i>
        <span>{{ totalCartForCore }} in cart</span>
      </div>
    </div>

    <!-- 2. DETAILS CONTAINER -->
    <div class="p-2.5 flex flex-col flex-1 justify-between gap-1.5">
      <!-- Title & Category -->
      <div>
        <h4 class="text-[11px] sm:text-xs font-bold text-slate-800 leading-snug line-clamp-1 group-hover/card:text-[#c59b27] transition-colors" :title="core.name">
          {{ core.name }}
        </h4>
        <p class="text-[10px] text-slate-400 font-medium truncate">
          {{ core.category }}
        </p>
      </div>

      <!-- Size Selector Chips -->
      <div v-if="availableSizes.length > 0" class="space-y-1">
        <div class="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
          <span>Size</span>
          <span class="text-slate-600 font-bold lowercase">{{ activeSizeLabel }}</span>
        </div>

        <!-- Horizontal scrollable size pills -->
        <div class="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 -mx-0.5 px-0.5" @click.stop>
          <button
            v-for="(s, idx) in availableSizes"
            :key="s.size"
            type="button"
            @click.stop="activeSizeIndex = idx"
            class="px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 transition-all border"
            :class="activeSizeIndex === idx
              ? 'bg-slate-900 border-slate-900 text-amber-400 shadow-xs scale-105'
              : (s.totalQty > 0 ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-50/50 border-slate-100 text-slate-300 opacity-60')"
            :title="`${s.size}: ${s.totalQty} pairs in stock`"
          >
            {{ s.size === 'Standard' ? 'Regular' : s.size }}
          </button>
        </div>
      </div>

      <!-- Price & Cart Controls for Selected Size -->
      <div class="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1 mt-auto">
        <!-- Price & Stock info -->
        <div class="flex flex-col min-w-0">
          <div class="text-xs sm:text-sm font-black text-slate-900 truncate">
            <span v-if="activePrice > 0">₹{{ activePrice }}</span>
            <span v-else class="text-slate-400 text-xs">₹--</span>
          </div>
          <div 
            class="text-[9px] font-bold truncate"
            :class="activeStock > 0 ? 'text-emerald-600' : 'text-slate-400'"
          >
            {{ activeStock > 0 ? `${activeStock} pairs` : 'Out of stock' }}
          </div>
        </div>

        <!-- Cart Stepper / Add Button -->
        <div class="shrink-0" @click.stop>
          <div 
            v-if="activeProduct && getCartQty(activeProduct) > 0" 
            class="flex items-center gap-0.5 p-0.5 bg-white rounded-full shadow-sm border border-amber-300"
          >
            <button 
              @click.stop="updateCart(activeProduct, -1)" 
              class="w-5 h-5 flex items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 active:scale-90 transition-all"
              title="Decrease"
            >
              <i class="fa-solid fa-minus text-[8px]"></i>
            </button>
            <span class="min-w-[14px] text-center text-[11px] font-black text-slate-900 px-0.5">
              {{ getCartQty(activeProduct) }}
            </span>
            <button 
              @click.stop="updateCart(activeProduct, 1)" 
              class="w-5 h-5 flex items-center justify-center rounded-full bg-[#18181b] text-amber-400 hover:bg-black active:scale-90 transition-all"
              title="Increase"
            >
              <i class="fa-solid fa-plus text-[8px]"></i>
            </button>
          </div>

          <button
            v-else-if="activeProduct && activeStock > 0"
            @click.stop="addToCart(activeProduct)"
            class="w-7 h-7 rounded-full bg-slate-900 hover:bg-black text-amber-400 shadow-xs flex items-center justify-center transition-all active:scale-90"
            title="Add selected size to cart"
          >
            <i class="fa-solid fa-plus text-[9px]"></i>
          </button>

          <span v-else class="text-[9px] font-bold text-slate-300">
            Out
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import CachedImage from './CachedImage.vue';
import { getOptimizedImageUrl } from '../../utils/formatters';
import { useCart } from '../../composables/useCart';

const props = defineProps({
  core: {
    type: Object,
    required: true
  }
});

defineEmits(['open-image-popup']);

const { getCartQty, addToCart, updateCart } = useCart();

const activeSizeIndex = ref(0);

const availableSizes = computed(() => {
  if (!props.core || !props.core.sizes) return [];
  return props.core.sizes;
});

// Auto-select first in-stock size when available
watch(() => props.core, (newCore) => {
  if (newCore && newCore.sizes && newCore.sizes.length > 0) {
    const inStockIdx = newCore.sizes.findIndex(s => s.totalQty > 0);
    activeSizeIndex.value = inStockIdx >= 0 ? inStockIdx : 0;
  }
}, { immediate: true });

const activeSize = computed(() => {
  if (availableSizes.value.length === 0) return null;
  return availableSizes.value[activeSizeIndex.value] || availableSizes.value[0];
});

const activeSizeLabel = computed(() => {
  if (!activeSize.value) return '';
  return activeSize.value.size === 'Standard' ? 'Regular' : activeSize.value.size;
});

const activeProduct = computed(() => {
  if (!activeSize.value) return null;
  return activeSize.value.primaryProduct || (activeSize.value.products && activeSize.value.products[0]) || null;
});

const activePrice = computed(() => {
  if (!activeSize.value) return 0;
  return activeSize.value.price || 0;
});

const activeStock = computed(() => {
  if (!activeSize.value) return 0;
  return activeSize.value.totalQty || 0;
});

// Total cart quantity across all sizes of this core model
const totalCartForCore = computed(() => {
  if (!props.core || !props.core.sizes) return 0;
  let total = 0;
  props.core.sizes.forEach(s => {
    (s.products || []).forEach(p => {
      total += getCartQty(p);
    });
  });
  return total;
});
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
