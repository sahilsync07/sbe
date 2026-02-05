
<template>
    <!-- Full Screen Product Page -->
    <transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0 translate-y-4" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-4">
      <div
        v-if="showImagePopup"
        class="fixed inset-0 z-[100] bg-slate-50 overflow-y-auto overflow-x-hidden flex flex-col"
      >
        <!-- Sticky Navbar -->
        <div class="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 pb-3 flex items-center justify-between shadow-sm" style="padding-top: calc(env(safe-area-inset-top, 20px) + 12px)">
           <button 
             @click="$emit('close', { isPop: false })" 
             class="w-10 h-10 flex items-center justify-center rounded-full bg-black text-white hover:bg-neutral-800 hover:scale-105 active:scale-95 transition-all shadow-md"
             title="Back to Home"
           >
              <i class="fa-solid fa-arrow-left"></i>
           </button>
           
           <!-- Dynamic Header -->
           <div class="absolute left-1/2 -translate-x-1/2">
                <!-- Special "New Arrivals" Style -->
                <h2 v-if="currentGroupName === 'New Arrivals'" class="text-base sm:text-l md:text-xl font-['Clash_Display'] font-bold tracking-wide holographic-text whitespace-nowrap">
                    ✨ {{ currentGroupName }}
                </h2>
                <!-- Regular Group Style -->
                <h2 v-else class="text-base sm:text-l md:text-xl font-semibold text-slate-900 tracking-tight font-heading whitespace-nowrap">
                   {{ formatGroupName(currentGroupName) }}
                </h2>
           </div>
           
           
           <div class="flex items-center gap-4">
             <!-- Desktop Nav -->
             <div class="hidden lg:flex items-center gap-2">
                 <button 
                   @click="$emit('navigate', -1)" 
                   class="w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 hover:bg-slate-100 hover:text-blue-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                   title="Previous Product"
                 >
                   <i class="fa-solid fa-chevron-left"></i>
                 </button>
                 <button 
                   @click="$emit('navigate', 1)" 
                   class="w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 hover:bg-slate-100 hover:text-blue-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                   title="Next Product"
                 >
                    <i class="fa-solid fa-chevron-right"></i>
                 </button>
             </div>
           </div>
        </div>

        <!-- Main Content (Flex Column for Mobile "Single View" fit) -->
        <div class="flex-1 w-full flex flex-col lg:flex-row lg:p-8 lg:gap-12 overflow-hidden">
            
            <!-- Image Section (Takes remaining height) with Swipe Support -->
            <div 
              class="flex-1 w-full bg-white relative overflow-hidden flex items-center justify-center p-4"
              @touchstart="handleTouchStart"
              @touchmove="handleTouchMove"
              @touchend="handleTouchEnd"
            >
               <CachedImage
                 v-if="currentProduct.imageUrl"
                 :src="getOptimizedUrl(currentProduct.imageUrl)"
                 :cache-key="getCacheKeyUrl(currentProduct.imageUrl)"
                 class="w-full h-full object-contain drop-shadow-xl transition-all duration-300 cursor-zoom-in"
                 :key="currentProduct.imageUrl" 
                 @click="toggleFullScreen"
               />
               <div v-else class="flex flex-col items-center gap-4 text-slate-300">
                  <i class="fa-solid fa-image text-6xl opacity-20"></i>
                  <span class="font-medium">No Image Available</span>
               </div>

                <!-- Floating Full Screen Hint -->
                <div v-if="currentProduct.imageUrl" class="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium pointer-events-none animate-fade-in z-20">
                    <i class="fa-solid fa-expand mr-1.5"></i> Tap to expand
                </div>
            </div>

            <!-- Full Screen Overlay -->
            <Transition
            enter-active-class="transition-opacity duration-300"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition-opacity duration-300"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
            >
            <div v-if="isFullScreen" 
                class="fixed inset-0 z-[150] bg-black overflow-y-auto overflow-x-hidden touch-pan-y"
                @click.self="toggleFullScreen"
                @touchstart="handleTouchStart" 
                @touchmove="handleTouchMove" 
                @touchend="handleTouchEnd"
            >
                <!-- Full Screen Toolbar (Fixed) -->
                <div class="fixed top-0 left-0 right-0 px-4 flex justify-between items-start z-[160] bg-gradient-to-b from-black/80 to-transparent pointer-events-none" style="padding-top: calc(env(safe-area-inset-top, 0px) + 16px)">
                    <button @click="toggleFullScreen" class="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white pointer-events-auto active:scale-95 transition-all shadow-lg border border-white/10">
                        <i class="fa-solid fa-xmark text-lg"></i>
                    </button>
                    <div class="text-white text-right pointer-events-auto drop-shadow-md">
                        <div class="text-lg font-bold font-heading">{{ getCleanProductName(currentProduct.productName) }}</div>
                        <div class="text-sm text-slate-300">{{ formatGroupName(currentGroupName) }}</div>
                    </div>
                </div>

                <!-- Scrollable Container for Image -->
                <div class="min-h-full flex items-center justify-center py-24 px-2">
                    <CachedImage
                        :src="getOptimizedUrl(currentProduct.imageUrl)"
                        :cache-key="getCacheKeyUrl(currentProduct.imageUrl)"
                        alt="Full Screen"
                        class="w-full h-auto max-w-4xl object-contain drop-shadow-2xl"
                    />
                </div>
                    
                <!-- Full Screen Nav Hints (Fixed) -->
                <button @click.stop="$emit('navigate', -1)" class="fixed left-4 top-1/2 -translate-y-1/2 z-[160] w-12 h-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white/20 active:scale-95 transition-all pointer-events-auto hidden lg:flex border border-white/10 shadow-lg">
                    <i class="fa-solid fa-chevron-left text-xl"></i>
                </button>
                <button @click.stop="$emit('navigate', 1)" class="fixed right-4 top-1/2 -translate-y-1/2 z-[160] w-12 h-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white/20 active:scale-95 transition-all pointer-events-auto hidden lg:flex border border-white/10 shadow-lg">
                    <i class="fa-solid fa-chevron-right text-xl"></i>
                </button>
            </div>
            </Transition>

            <!-- Details Section (Bottom Panel - Redesigned) -->
            <div class="w-full lg:w-[480px] bg-white lg:bg-transparent shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] lg:shadow-none z-10 rounded-t-[32px] lg:rounded-none relative -mt-6 pt-8 pb-8 px-6 lg:p-4 lg:mt-0">
               <!-- Pull Handle (Mobile) -->
               <div class="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200 rounded-full lg:hidden"></div>

               <div class="flex flex-col gap-6">
                    <!-- Header Info -->
                    <div>
                        <div class="flex items-start justify-between gap-4 mb-2">
                             <h2 class="text-xl sm:text-2xl font-black text-slate-900 leading-tight font-heading">{{ getCleanProductName(currentProduct.productName) }}</h2>
                             <!-- Price Pill -->
                             <div class="flex flex-col items-end shrink-0 bg-blue-50 px-3 py-1.5 rounded-2xl border border-blue-100">
                                 <span class="text-[10px] uppercase font-bold text-blue-400 tracking-wider">{{ getPriceInfo(currentProduct.productName).label }}</span>
                                 <div class="text-xl font-black text-slate-900 leading-none">
                                     <span class="text-xs font-semibold mr-0.5 align-top">₹</span>{{ getPriceInfo(currentProduct.productName).price }}
                                 </div>
                             </div>
                        </div>
                        
                        <!-- Tags -->
                        <div class="flex flex-wrap gap-2 mb-4">
                             <!-- Color Tag -->
                             <div v-if="getProductColor(currentProduct.productName)" class="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 bg-slate-50 border border-slate-100 rounded-full">
                                  <span class="w-2.5 h-2.5 rounded-full ring-1 ring-slate-200" :style="{ backgroundColor: getProductColor(currentProduct.productName).hex }"></span>
                                  <span class="text-xs font-bold text-slate-600 capitalize">{{ getProductColor(currentProduct.productName).text }}</span>
                             </div>
                             <!-- Size Tag -->
                             <div v-if="getProductSize(currentProduct.productName)" class="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-100 rounded-full">
                                  <i class="fa-solid fa-ruler-combined text-[10px] text-slate-400"></i>
                                  <span class="text-xs font-bold text-slate-600">{{ getProductSize(currentProduct.productName) }}</span>
                             </div>
                             <!-- Stock Tag -->
                             <div class="flex items-center gap-1.5 px-3 py-1 rounded-full border" 
                                  :class="currentProduct.quantity < 5 ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'">
                                  <i class="fa-solid fa-boxes-stacked text-[10px]"></i>
                                  <span class="text-xs font-bold">{{ currentProduct.quantity }} {{ currentProduct.quantity === 1 ? 'Pair' : 'Pairs' }} In Stock</span>
                             </div>
                        </div>
                    </div>

                   <!-- Action Buttons -->
                   <div class="grid grid-cols-[1fr,auto] gap-3">
                       <button
                          v-if="cartQty === 0"
                          @click="$emit('addToCart', currentProduct)"
                          class="bg-black text-white py-4 rounded-2xl font-bold text-base shadow-xl shadow-black/20 hover:bg-neutral-800 active:scale-95 transition-all flex items-center justify-center gap-2"
                       >
                          <i class="fa-solid fa-bag-shopping"></i>
                          <span>Add to Cart</span>
                       </button>

                       <!-- Quantity Controls (Only if in cart) -->
                       <div v-else class="flex items-center gap-3 bg-slate-100 rounded-2xl px-2 w-full">
                           <button @click="$emit('updateCart', currentProduct, -1)" class="w-12 h-full flex items-center justify-center rounded-xl bg-white text-slate-900 shadow-sm active:scale-95">
                               <i class="fa-solid fa-minus"></i>
                           </button>
                           <span class="text-xl font-bold flex-1 text-center">{{ cartQty }}</span>
                           <button @click="$emit('updateCart', currentProduct, 1)" class="w-12 h-full flex items-center justify-center rounded-xl bg-white text-slate-900 shadow-sm active:scale-95">
                               <i class="fa-solid fa-plus"></i>
                           </button>
                       </div>
                   </div>

                   <!-- Mobile Nav (Bottom) -->
                   <div class="lg:hidden grid grid-cols-2 gap-3 pt-2">
                       <button 
                         @click="$emit('navigate', -1)" 
                         class="py-3 px-4 bg-slate-50 border border-slate-200 text-slate-600 font-bold rounded-xl active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
                       >
                         <i class="fa-solid fa-arrow-left"></i> Previous
                       </button>
                       <button 
                         @click="$emit('navigate', 1)" 
                         class="py-3 px-4 bg-slate-50 border border-slate-200 text-slate-600 font-bold rounded-xl active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
                       >
                         Next <i class="fa-solid fa-arrow-right"></i>
                       </button>
                   </div>
               </div>
            </div>
        </div>
      </div>
    </transition>
</template>

<script setup>
import { computed, defineAsyncComponent, ref } from 'vue';
import { extractColor } from '../../utils/colors';

const CachedImage = defineAsyncComponent(() => import('./CachedImage.vue'));

const props = defineProps({
    showImagePopup: Boolean,
    currentProduct: Object,
    currentProductIndex: Number,
    isLastProduct: Boolean, 
    currentGroupName: String,
    cartQty: Number 
});

const emit = defineEmits(['close', 'navigate', 'addToCart', 'updateCart']);

// Touch swipe handling
const touchStartX = ref(0);
const touchEndX = ref(0);

const handleTouchStart = (e) => {
  touchStartX.value = e.changedTouches[0].screenX;
};

const handleTouchMove = (e) => {
  touchEndX.value = e.changedTouches[0].screenX;
};

const handleTouchEnd = () => {
  const swipeThreshold = 50; // Minimum swipe distance
  const diff = touchStartX.value - touchEndX.value;
  
  if (Math.abs(diff) > swipeThreshold) {
    if (diff > 0) {
      // Swiped left -> Next product
      emit('navigate', 1);
    } else {
      // Swiped right -> Previous product
      emit('navigate', -1);
    }
  }
  
  touchStartX.value = 0;
  touchEndX.value = 0;
};

const getOptimizedUrl = (imageUrl) => {
    if (!imageUrl) return null;
     try {
        const parts = imageUrl.split("/upload/");
        if (parts.length !== 2) return imageUrl;
        const transformation = "w_1000,q_70,f_auto";
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
        const transformation = "w_400,q_70,f_auto"; // Must match cached version
        return `${parts[0]}/upload/${transformation}/${parts[1]}`;
      } catch (e) {
        return imageUrl;
      }
};

const isNewArrival = (product) => {
    if (!product) return false;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 1);
    const minDate = new Date('2025-11-01');
    
    const imageDate = product.imageUploadedAt ? new Date(product.imageUploadedAt) : minDate;
    const itemDate = product.firstSeenAt ? new Date(product.firstSeenAt) : minDate;
    
    const latestDate = itemDate > imageDate ? itemDate : imageDate;
    return latestDate > cutoff;
};

const getPriceDisplay = (name) => {
    if (!name) return null;
    const match = name.match(/((?:RS|MRP|@))[\.\s]*(\d+(\.\d+)?)/i);
    if (match) {
        const prefix = match[1].toUpperCase();
        const price = match[2];
        return prefix === 'RS' ? `Net ₹${price}/-` : `MRP ₹${price}/-`;
    }
    return null;
};

const formatGroupName = (name) => {
  if (!name) return '';
  return name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

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
    // Remove extra parens
    clean = clean.replace(/\(\s*\)/g, '');
    // Remove residual price suffixes like "/-" or "/" and separators
    clean = clean.replace(/[\/\-]+\s*$/g, '')
                 .replace(/^\s*[\/\-]+/g, '') 
                 .replace(/\s*[\/\-]+\s*/g, ' '); 
    
    // Quick format since we don't import formatProductName here necessarily (or do we?)
    // ImageModal doesn't import formatProductName. Let's add basic capitalization.
    const cleanedString = clean.replace(/\s+/g, ' ').trim().toLowerCase();
    return cleanedString.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};
const isFullScreen = ref(false);

const toggleFullScreen = () => {
  if (props.currentProduct && props.currentProduct.imageUrl) {
    isFullScreen.value = !isFullScreen.value;
  }
};
</script>
