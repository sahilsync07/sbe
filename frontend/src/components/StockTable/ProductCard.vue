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
          v-if="product.imageUrl"
          :src="getOptimizedImageUrl(product.imageUrl)"
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
          :class="product.imageUrl ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'"
        >
           <!-- Case 1: No Image - Centered Upload Button -->
           <div v-if="!product.imageUrl" class="pointer-events-auto w-full transform transition-all hover:scale-105">
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
             <button @click.stop="deleteImage(product.productName)" class="w-8 h-8 flex items-center justify-center bg-red-500/90 text-white rounded-full shadow-md hover:bg-red-600 hover:scale-110 transition-all backdrop-blur-sm" title="Remove Image">
               <i class="fa-solid fa-trash text-xs"></i>
             </button>
           </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="p-3 flex flex-col flex-1 pb-3 relative">
        <!-- Title -->
        <div class="mb-1.5 pr-8">
           <h3 class="text-xs sm:text-sm font-bold text-slate-800 leading-snug line-clamp-2 min-h-[2.5em] group-hover:text-blue-600 transition-colors" :title="product.productName">
              {{ getCleanProductName(product.productName) }}
           </h3>
        </div>
        
        <!-- Details Row -->
        <div class="flex items-center justify-between mb-1">
            <div class="flex items-center gap-1.5 overflow-hidden">
               <!-- Color Dot -->
               <span v-if="getProductColor(product.productName)" 
                     class="w-3 h-3 rounded-full shadow-sm ring-1 ring-slate-100" 
                     :style="{ backgroundColor: getProductColor(product.productName).hex }"
                     :title="getProductColor(product.productName).text"
               ></span>
               <span v-if="getProductColor(product.productName)" class="text-[10px] sm:text-[11px] font-medium text-slate-500 capitalize truncate max-w-[60px]">
                  {{ getProductColor(product.productName).text }}
               </span>
            </div>
            
            <span v-if="getProductSize(product.productName)" class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] sm:text-[11px] font-bold border border-slate-200">
               {{ getProductSize(product.productName) }}
            </span>
        </div>

        <!-- Footer -->
        <div class="mt-auto flex items-end justify-between">
            <div class="flex flex-col">
               <span class="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{{ getPriceInfo(product.productName).label }}</span>
               <div class="text-base sm:text-lg font-black text-slate-900 leading-none">
                  <span class="text-[10px] sm:text-xs align-top font-medium mr-0.5">₹</span>{{ getPriceInfo(product.productName).price }}
               </div>
            </div>
            <div class="text-right flex flex-col items-end">
               <span class="text-xs sm:text-sm font-bold" :class="product.quantity < 5 ? 'text-amber-500' : 'text-slate-400'">
                  {{ product.quantity }} {{ product.quantity === 1 ? 'Pair' : 'Pairs' }}
               </span>
            </div>
        </div>

        <button 
             v-if="product.quantity > 0"
             @click.stop="addToCart(product)"
             class="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-600 shadow-sm border border-slate-200 hover:bg-blue-600 hover:text-white transition-all hover:scale-110 active:scale-95"
             title="Add to Cart"
        >
              <i class="fa-solid fa-plus text-xs"></i>
        </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { getOptimizedImageUrl, getCleanProductName, isNewArrival } from '../../utils/formatters';
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
