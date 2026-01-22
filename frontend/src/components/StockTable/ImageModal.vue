
<template>
    <!-- Full Screen Product Page -->
    <transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0 translate-y-4" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-4">
      <div
        v-if="showImagePopup"
        class="fixed inset-0 z-[100] bg-slate-50 overflow-y-auto overflow-x-hidden flex flex-col"
      >
        <!-- Sticky Navbar -->
        <div class="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
           <button @click="$emit('close', { isPop: false })" class="flex items-center gap-2 text-blue-600 font-bold transition-colors px-0 py-1 hover:opacity-80 bg-transparent hover:bg-transparent shadow-none border-none">
              <i class="fa-solid fa-arrow-left"></i>
              <span>Back to Home</span>
           </button>
           
           <div class="flex items-center gap-4">
             <!-- Desktop Nav -->
             <div class="hidden md:flex items-center gap-2">
                 <button 
                   @click="$emit('navigate', -1)" 
                   class="w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 hover:bg-slate-100 hover:text-blue-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                   :disabled="currentProductIndex <= 0"
                   title="Previous Product"
                 >
                   <i class="fa-solid fa-chevron-left"></i>
                 </button>
                 <button 
                   @click="$emit('navigate', 1)" 
                   class="w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 hover:bg-slate-100 hover:text-blue-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                   :disabled="isLastProduct"
                   title="Next Product"
                 >
                    <i class="fa-solid fa-chevron-right"></i>
                 </button>
             </div>
           </div>
        </div>

        <!-- Main Content -->
        <div class="max-w-7xl mx-auto w-full flex-1 flex flex-col md:flex-row p-4 md:p-8 gap-6 md:gap-12">
            
            <!-- Image Section (Left) -->
            <div class="flex-1 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center p-4 relative overflow-hidden h-[35vh] md:h-auto md:min-h-[60vh]">
               <img
                 v-if="currentProduct.imageUrl"
                 :src="getOptimizedUrl(currentProduct.imageUrl)"
                 class="w-full h-full object-contain drop-shadow-xl transition-all duration-300"
                 :key="currentProduct.imageUrl" 
               />
               <div v-else class="flex flex-col items-center gap-4 text-slate-300">
                  <i class="fa-solid fa-image text-6xl opacity-20"></i>
                  <span class="font-medium">No Image Available</span>
               </div>
            </div>

            <!-- Details Section (Right) -->
            <div class="w-full md:w-[400px] lg:w-[480px] flex flex-col gap-3 py-4">
               
               <div>
                  <div class="flex items-center gap-2 mb-3">
                     <span class="px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">{{ currentGroupName }}</span>
                     <span v-if="isNewArrival(currentProduct)" class="px-2.5 py-1 rounded-md bg-green-50 text-green-600 text-xs font-bold uppercase tracking-wider">New Arrival</span>
                  </div>
                  <h1 class="text-2xl md:text-4xl font-black text-slate-800 leading-tight mb-2">
                    {{ currentProduct.productName }}
                  </h1>
                  <div v-if="getPriceDisplay(currentProduct.productName)" class="text-2xl font-bold text-emerald-600 mb-4">
                     {{ getPriceDisplay(currentProduct.productName) }}
                  </div>
                  
                  <div class="text-blue-600 font-bold text-sm mb-2">
                     Stock: {{ currentProduct.quantity }} Sets
                  </div>
               </div>

               <hr class="border-slate-100" />

               <!-- Action Area -->
               <div class="space-y-4">
                  <div v-if="cartQty > 0" class="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between">
                      <span class="font-bold text-slate-700">In your cart</span>
                       <div class="flex items-center gap-3">
                          <button @click="$emit('updateCart', currentProduct, -1)" class="w-10 h-10 flex items-center justify-center bg-white border border-blue-200 text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-colors shadow-sm active:scale-95">
                            <i class="fa-solid fa-minus"></i>
                          </button>
                          <span class="text-xl font-black text-blue-700 min-w-[2rem] text-center">{{ cartQty }}</span>
                          <button @click="$emit('updateCart', currentProduct, 1)" class="w-10 h-10 flex items-center justify-center bg-white border border-blue-200 text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-colors shadow-sm active:scale-95">
                            <i class="fa-solid fa-plus"></i>
                          </button>
                       </div>
                  </div>

                  <button 
                    v-else
                    @click="$emit('addToCart', currentProduct)"
                    class="w-full py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-blue-600 shadow-xl shadow-slate-900/10 hover:shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-3 text-lg"
                  >
                    <i class="fa-solid fa-cart-shopping"></i>
                    Add to Cart
                  </button>
                  
                  <p class="text-xs text-center text-slate-400 mt-2">
                     Tap 'Add to Cart' to include this in your order list.
                  </p>
               </div>
               
               <!-- Mobile Only Nav -->
               <div class="md:hidden grid grid-cols-2 gap-4 mt-2 pt-0">
                   <button 
                     @click="$emit('navigate', -1)" 
                     class="py-2 px-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl active:scale-95 transition-all disabled:opacity-50"
                     :disabled="currentProductIndex <= 0"
                   >
                     Previous
                   </button>
                   <button 
                     @click="$emit('navigate', 1)" 
                     class="py-2 px-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl active:scale-95 transition-all disabled:opacity-50"
                     :disabled="isLastProduct"
                   >
                     Next
                   </button>
               </div>

            </div>
        </div>
      </div>
    </transition>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    showImagePopup: Boolean,
    currentProduct: Object,
    currentProductIndex: Number,
    isLastProduct: Boolean, 
    currentGroupName: String,
    cartQty: Number 
});

defineEmits(['close', 'navigate', 'addToCart', 'updateCart']);

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
        return prefix === 'RS' ? `Net ₹${price}` : `MRP ₹${price}`;
    }
    return null;
};
</script>
