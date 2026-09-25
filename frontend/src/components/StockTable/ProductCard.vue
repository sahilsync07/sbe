<template>
  <div class="group relative flex flex-col bg-white rounded-3xl shadow-card hover:shadow-float transition-all duration-300 border border-transparent mx-auto w-full max-w-[280px]">
    <!-- Image Area -->
    <div 
      class="relative w-full aspect-[4/5] bg-slate-100 rounded-t-3xl cursor-pointer" 
      :class="{ 'holographic-border': isNewArrival(product) }"
      @click="$emit('open-image-popup', product, index)"
    >
      <div class="absolute inset-0 rounded-t-3xl overflow-hidden">
        <!-- Badge: Out of Stock -->
        <div v-if="product.quantity <= 0" class="absolute inset-0 z-10 bg-slate-50/80 backdrop-blur-[2px] flex items-center justify-center">
            <span class="px-3 py-1 bg-slate-200 text-slate-500 text-xs font-bold rounded-full border border-slate-300">Out of Stock</span>
        </div>

        <CachedImage
          v-if="product.imageUrl || product.secondaryImageUrl"
          :src="getOptimizedImageUrl(product.imageUrl || product.secondaryImageUrl)"
          :fallback-src="product.secondaryImageUrl ? getOptimizedImageUrl(product.secondaryImageUrl) : null"
          alt="Product"
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

        <!-- Admin Controls -->
        <div
          v-if="isAdmin || isSuperAdmin"
          class="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none p-4 transition-opacity duration-200"
          :class="(product.imageUrl || product.secondaryImageUrl) ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'"
        >
           <!-- Case 1: No Image - Centered Upload Button -->
           <div v-if="!product.imageUrl && !product.secondaryImageUrl" class="pointer-events-auto w-full transform transition-all hover:scale-105">
               <!-- State A: No File Selected -->
               <label v-if="!imageFiles[product.productName]" 
                      class="flex w-full items-center justify-center gap-2 py-2.5 bg-white/95 backdrop-blur-sm rounded-xl cursor-pointer shadow-lg hover:shadow-xl hover:bg-white border border-slate-100 text-slate-700"
                      @click.stop
               >
                  <i class="fa-solid fa-camera text-sm"></i>
                  <span class="text-xs font-bold uppercase tracking-wide">Add Photo</span>
                  <input type="file" accept="image/*" @change="(e) => handleFileChange(e, product.productName)" class="hidden" :disabled="uploading[product.productName]" />
               </label>
               
               <!-- State B: File Selected -> Upload Action -->
               <button v-else 
                       @click.stop="uploadImage(product.productName)" 
                       class="w-full py-2.5 bg-blue-600 text-white rounded-xl shadow-lg hover:shadow-blue-500/30 hover:bg-blue-700 transition-all font-bold text-xs flex items-center justify-center gap-2 uppercase tracking-wide"
                       :disabled="uploading[product.productName]"
               >
                   <i v-if="uploading[product.productName]" class="fa-solid fa-spinner fa-spin"></i>
                   <span v-else>Confirm Upload</span>
               </button>
           </div>

           <!-- Case 2: Has Image - Remove Button -->
           <div v-else class="pointer-events-auto absolute top-2 right-2">
             <button @click.stop="deleteImage(product)" class="w-8 h-8 flex items-center justify-center bg-red-500/90 text-white rounded-full shadow-md hover:bg-red-600 hover:scale-110 transition-all backdrop-blur-sm" title="Remove Image">
               <i class="fa-solid fa-trash text-xs"></i>
             </button>
           </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <!-- Content (Catalog Format) -->
    <div class="p-3 flex flex-col flex-1 pb-3 relative justify-between bg-white">
        <!-- Article Header & Sole -->
        <div>
           <div class="flex items-start justify-between gap-1 mb-1 pr-7">
              <h3 class="text-xs sm:text-sm font-black font-['Clash_Display'] uppercase text-slate-900 leading-snug line-clamp-1 group-hover:text-amber-600 transition-colors" :title="product.productName">
                 {{ catalogSpecs.article || getCleanProductName(product.productName) }}
              </h3>
           </div>
           
           <!-- Sole & Color Badges -->
           <div class="flex items-center justify-between mb-2">
               <!-- Color Swatch & Label -->
               <div v-if="catalogSpecs.color" class="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 max-w-[110px]">
                  <span class="w-2.5 h-2.5 rounded-full shadow-xs ring-1 ring-slate-200 shrink-0" 
                        :style="{ background: catalogSpecs.color.gradient || catalogSpecs.color.hex }"
                  ></span>
                  <span class="text-[10px] font-black uppercase text-slate-700 truncate">
                     {{ catalogSpecs.color.text }}
                  </span>
               </div>
               <span v-else class="text-[10px] text-slate-400 font-medium">Standard</span>

               <!-- Sole Badge -->
               <span v-if="catalogSpecs.sole" class="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/60 shrink-0">
                  {{ catalogSpecs.sole }} SOLE
               </span>
           </div>
        </div>

        <!-- Catalog Specification Strip: SIZE | MRP | STOCK -->
        <div class="mt-auto pt-2 border-t border-slate-100 flex items-end justify-between">
            <div class="flex flex-col">
               <div class="flex items-baseline gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                  <span>SIZE:</span>
                  <span class="text-slate-700 font-black">{{ catalogSpecs.size || getProductSize(product.productName) || 'STD' }}</span>
               </div>
               <div class="text-base sm:text-lg font-black text-slate-950 leading-tight">
                  <span class="text-[10px] sm:text-xs font-bold text-slate-500 mr-0.5">MRP ₹</span>{{ catalogSpecs.mrp || getPriceInfo(product.productName).price }}
               </div>
            </div>

            <div class="text-right flex flex-col items-end">
               <span class="text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full border" 
                     :class="product.quantity > 0 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-600 bg-rose-50 border-rose-200'">
                  {{ product.quantity > 0 ? `${product.quantity} prs` : 'Out of Stock' }}
               </span>
            </div>
        </div>

        <button 
             v-if="product.quantity > 0"
             @click.stop="addToCart(product)"
             class="absolute top-2.5 right-2.5 z-20 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-slate-900 text-amber-400 hover:bg-black hover:scale-105 shadow-sm transition-all active:scale-90"
             title="Add to Cart"
        >
              <i class="fa-solid fa-plus text-xs"></i>
        </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { getOptimizedImageUrl, getCleanProductName, isNewArrival, parseCatalogSpecs } from '../../utils/formatters';
import { extractColor } from '../../utils/colors';
import CachedImage from './CachedImage.vue';

// Composables
import { useAdmin } from '../../composables/useAdmin';
import { useStockData } from '../../composables/useStockData';
import { useCart } from '../../composables/useCart';

const { isAdmin, isSuperAdmin } = useAdmin();
const { uploading, imageFiles, handleFileChange, uploadImage, deleteImage } = useStockData();
const { getCartQty, addToCart, updateCart } = useCart();

const props = defineProps({
  product: { type: Object, required: true },
  index: { type: Number, required: true }
});

const emit = defineEmits(['open-image-popup']);

const catalogSpecs = computed(() => parseCatalogSpecs(props.product.productName, props.product.groupName));

const getProductColor = (name) => extractColor(name);

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

const getPriceInfo = (name) => {
    if (!name) return { label: 'Net Rate', price: '?' };
    const match = name.match(/((?:RS|MRP|@))[.\s]*(\d+(\.\d+)?)/i);
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
</script>
