<template>
  <div class="col-span-2 sm:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col sm:flex-row relative group/card h-full">
    <!-- LEFT: PHOTO CONTAINER (Preserves same photo size as standard product cards) -->
    <div 
      class="relative w-full sm:w-44 md:w-52 aspect-[4/3] sm:aspect-auto bg-slate-50 cursor-pointer overflow-hidden flex items-center justify-center p-2.5 shrink-0 border-b sm:border-b-0 sm:border-r border-slate-100"
      @click="$emit('open-image-popup', { productName: model.name, imageUrl: model.imageUrl })"
    >
      <!-- Category Badge Overlay -->
      <div class="absolute top-2 left-2 z-20 flex flex-col gap-1 items-start">
        <span 
          class="px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase shadow-xs backdrop-blur-md"
          :class="model.category.includes('Durolite') ? 'bg-emerald-600/90 text-white' : 'bg-red-600/90 text-white'"
        >
          {{ model.category }}
        </span>
      </div>

      <!-- Total Stock Badge -->
      <div class="absolute top-2 right-2 z-20">
        <span 
          class="px-2 py-0.5 rounded-full text-[10px] font-black shadow-xs backdrop-blur-md"
          :class="model.totalStock > 0 ? 'bg-slate-900/90 text-amber-400 border border-amber-400/30' : 'bg-slate-700/80 text-slate-200'"
        >
          {{ model.totalStock > 0 ? model.totalStock + ' prs' : '0 in stock' }}
        </span>
      </div>

      <!-- Model Photo or Icon Fallback -->
      <CachedImage
        v-if="model.imageUrl"
        :src="getOptimizedImageUrl(model.imageUrl)"
        :alt="model.name"
        class="w-full h-full object-contain transition-transform duration-500 group-hover/card:scale-105"
      />
      <div v-else class="w-full h-full flex flex-col items-center justify-center text-slate-300 p-2 text-center">
        <i class="fa-solid fa-graduation-cap text-3xl opacity-25 mb-1.5 text-slate-400"></i>
        <span class="text-[10px] font-bold text-slate-400">School Shoe</span>
      </div>

      <!-- Total Cart Indicator across all variants of this model -->
      <div 
        v-if="totalCartForModel > 0"
        class="absolute bottom-2 left-2 z-20 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] shadow-md flex items-center gap-1 pointer-events-none"
      >
        <i class="fa-solid fa-cart-shopping text-[9px]"></i>
        <span>{{ totalCartForModel }} in cart</span>
      </div>
    </div>

    <!-- RIGHT: EXPANDED TEXT & SIZES SPACE (Wide Card Layout) -->
    <div class="flex-1 p-3 sm:p-4 flex flex-col justify-between gap-3 min-w-0">
      <!-- Title & Sub-header -->
      <div class="border-b border-slate-100 pb-2">
        <div class="flex items-start justify-between gap-2">
          <div>
            <h4 class="text-sm sm:text-base font-black text-slate-900 leading-snug group-hover/card:text-amber-600 transition-colors">
              {{ model.name }}
            </h4>
            <div class="flex items-center gap-2 mt-1">
              <span 
                class="px-2 py-0.5 rounded-md text-[10px] font-bold"
                :class="model.color === 'White' ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-slate-900 text-white'"
              >
                {{ model.color }}
              </span>
              <span class="text-[11px] font-semibold text-slate-500">
                {{ model.variants.length }} sizes available
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Sizes & Rates breakdown: Small Group (Kids) vs Large Group (Senior/Gents) -->
      <div class="space-y-2.5 flex-1 overflow-y-auto max-h-[260px] sm:max-h-none pr-0.5">
        <!-- 1. Small Group (Kids / Junior) -->
        <div v-if="model.smallVariants && model.smallVariants.length > 0" class="space-y-1.5">
          <div class="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100/70 pb-0.5">
            <span class="flex items-center gap-1.5 text-amber-700">
              <i class="fa-solid fa-child-reaching text-[10px]"></i> Small Group (Kids)
            </span>
            <span>Rate & Stock</span>
          </div>

          <div 
            v-for="v in model.smallVariants" 
            :key="v.productName"
            class="flex items-center justify-between py-1 px-2.5 rounded-xl text-xs bg-slate-50/80 hover:bg-amber-50/50 transition-colors border border-slate-100 gap-2"
          >
            <div class="flex items-center gap-2 min-w-0">
              <span class="font-extrabold text-slate-800 shrink-0 text-xs sm:text-[13px]">{{ v.size }}</span>
              <span class="text-slate-300 text-[10px] shrink-0">•</span>
              <span class="font-black text-amber-700 shrink-0">{{ v.rateText }}</span>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <span 
                class="px-1.5 py-0.5 rounded-md text-[10px] font-bold shrink-0"
                :class="v.quantity > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-slate-100 text-slate-400'"
              >
                {{ v.quantity > 0 ? v.quantity + ' prs' : 'Out' }}
              </span>

              <!-- Cart Control -->
              <div v-if="v.quantity > 0" class="flex items-center">
                <div v-if="getCartQty(v.product) > 0" class="flex items-center bg-slate-900 rounded-lg p-0.5">
                  <button 
                    @click.stop="updateCart(v.product, -1)" 
                    class="w-5 h-5 flex items-center justify-center text-white hover:text-amber-400 text-[10px]"
                    title="Decrease quantity"
                  >
                    <i class="fa-solid fa-minus"></i>
                  </button>
                  <span class="px-1.5 text-white font-black text-xs">{{ getCartQty(v.product) }}</span>
                  <button 
                    @click.stop="updateCart(v.product, 1)" 
                    class="w-5 h-5 flex items-center justify-center text-white hover:text-amber-400 text-[10px]"
                    title="Increase quantity"
                  >
                    <i class="fa-solid fa-plus"></i>
                  </button>
                </div>
                <button 
                  v-else 
                  @click.stop="addToCart(v.product)"
                  class="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] rounded-lg transition-all active:scale-95 shadow-xs flex items-center gap-1 cursor-pointer"
                  title="Add to cart"
                >
                  <i class="fa-solid fa-plus text-[8px]"></i>
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Large Group (Senior / Gents) -->
        <div v-if="model.largeVariants && model.largeVariants.length > 0" class="space-y-1.5 pt-1">
          <div class="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100/70 pb-0.5">
            <span class="flex items-center gap-1.5 text-indigo-700">
              <i class="fa-solid fa-person text-[10px]"></i> Large Group (Senior / Gents)
            </span>
            <span>Rate & Stock</span>
          </div>

          <div 
            v-for="v in model.largeVariants" 
            :key="v.productName"
            class="flex items-center justify-between py-1 px-2.5 rounded-xl text-xs bg-slate-50/80 hover:bg-indigo-50/50 transition-colors border border-slate-100 gap-2"
          >
            <div class="flex items-center gap-2 min-w-0">
              <span class="font-extrabold text-slate-800 shrink-0 text-xs sm:text-[13px]">{{ v.size }}</span>
              <span class="text-slate-300 text-[10px] shrink-0">•</span>
              <span class="font-black text-indigo-700 shrink-0">{{ v.rateText }}</span>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <span 
                class="px-1.5 py-0.5 rounded-md text-[10px] font-bold shrink-0"
                :class="v.quantity > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-slate-100 text-slate-400'"
              >
                {{ v.quantity > 0 ? v.quantity + ' prs' : 'Out' }}
              </span>

              <!-- Cart Control -->
              <div v-if="v.quantity > 0" class="flex items-center">
                <div v-if="getCartQty(v.product) > 0" class="flex items-center bg-slate-900 rounded-lg p-0.5">
                  <button 
                    @click.stop="updateCart(v.product, -1)" 
                    class="w-5 h-5 flex items-center justify-center text-white hover:text-amber-400 text-[10px]"
                    title="Decrease quantity"
                  >
                    <i class="fa-solid fa-minus"></i>
                  </button>
                  <span class="px-1.5 text-white font-black text-xs">{{ getCartQty(v.product) }}</span>
                  <button 
                    @click.stop="updateCart(v.product, 1)" 
                    class="w-5 h-5 flex items-center justify-center text-white hover:text-amber-400 text-[10px]"
                    title="Increase quantity"
                  >
                    <i class="fa-solid fa-plus"></i>
                  </button>
                </div>
                <button 
                  v-else 
                  @click.stop="addToCart(v.product)"
                  class="px-2.5 py-1 bg-indigo-500 hover:bg-indigo-600 text-white font-black text-[10px] rounded-lg transition-all active:scale-95 shadow-xs flex items-center gap-1 cursor-pointer"
                  title="Add to cart"
                >
                  <i class="fa-solid fa-plus text-[8px]"></i>
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent } from 'vue';
import { getOptimizedImageUrl } from '../../utils/formatters';
import { useCart } from '../../composables/useCart';

const CachedImage = defineAsyncComponent(() => import('./CachedImage.vue'));

const props = defineProps({
  model: {
    type: Object,
    required: true,
  },
});

defineEmits(['open-image-popup']);

const { getCartQty, addToCart, updateCart } = useCart();

// Total cart quantity across all sizes of this model
const totalCartForModel = computed(() => {
  if (!props.model?.variants) return 0;
  let total = 0;
  for (const v of props.model.variants) {
    if (v.product) {
      total += getCartQty(v.product);
    }
  }
  return total;
});
</script>
