
<template>
    <aside
      class="fixed inset-y-0 right-0 w-full sm:w-80 border-l border-slate-200 z-[50] transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col bg-white/95 backdrop-blur-sm sm:bg-white pt-[118px] lg:pt-40"
      :class="showCart ? 'translate-x-0' : 'translate-x-full'"
    >
      <div class="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
         <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
           <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
           Your Cart <span v-if="cartTotalItems > 0" class="text-sm font-normal text-slate-500">({{ cartTotalItems }})</span>
         </h2>
         <button 
           v-if="cartItemCount > 0"
           @click="$emit('clearCart')"
           class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-600 transition-colors"
           title="Clear Cart"
         >
           <i class="fa-solid fa-trash-can text-sm"></i>
         </button>
      </div>
      
      <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 overscroll-contain">
         <div v-if="cartItemCount === 0" class="flex flex-col items-center justify-center h-64 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            <p class="text-sm font-medium">Your cart is empty</p>
            <button @click="$emit('closeCart')" class="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors">Start Browsing</button>
         </div>
         
         <div v-else class="space-y-4">
            <div v-for="(item, index) in filteredCart" :key="item.product.productName + index" class="flex gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm relative group hover:border-blue-200 transition-colors">
               <!-- Mini Thumbnail -->
               <div class="w-16 h-16 bg-slate-50 rounded-lg border border-slate-100 shrink-0 overflow-hidden">
                  <img v-if="item.product.imageUrl" :src="getOptimizedUrl(item.product.imageUrl)" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full flex items-center justify-center text-[8px] text-slate-400 text-center p-1">No Image</div>
               </div>
               
                <div class="flex-1 min-w-0">
                  <h4 class="text-xs font-semibold text-slate-800 line-clamp-2 leading-tight mb-1">{{ item.product.productName }}</h4>
                  <div class="flex items-center justify-between mt-2">
                     <div class="flex items-center gap-2">
                        <button @click="$emit('updateCartQuantity', index, -1)" class="w-6 h-6 flex items-center justify-center text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-sm transition-all">-</button>
                        <span class="text-xs font-bold text-slate-800 min-w-[3rem] text-center">{{ item.quantity }} {{ item.quantity > 1 ? 'Sets' : 'Set' }}</span>
                        <button @click="$emit('updateCartQuantity', index, 1)" class="w-6 h-6 flex items-center justify-center text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-sm transition-all">+</button>
                     </div>
                      <button @click="$emit('removeFromCart', index)" class="shrink-0 w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white rounded-full transition-all shadow-sm">
                         <i class="fa-solid fa-trash"></i>
                      </button>
                  </div>
               </div>
            </div>
         </div>
      </div>
      
      <div class="p-4 border-t border-slate-100 bg-slate-50">
          <div class="flex justify-between items-center mb-4">
             <span class="text-slate-600 font-medium text-sm">Total Quantity</span>
             <span class="text-xl font-extrabold text-blue-600">{{ cartTotalItems }} Sets</span>
          </div>
          <button 
            @click="$emit('sendOrderToWhatsapp')"
            class="w-full py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-xl shadow-lg shadow-green-900/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
          >
            <i class="fa-brands fa-whatsapp text-lg group-hover:scale-110 transition-transform"></i>
            Send Order via WhatsApp
          </button>
      </div>
    </aside>
</template>

<script setup>
defineProps({
    showCart: Boolean,
    cart: Array,
    filteredCart: Array,
    cartTotalItems: Number,
    cartItemCount: Number
});

defineEmits([
    'closeCart', 'clearCart', 'updateCartQuantity', 'removeFromCart', 'sendOrderToWhatsapp'
]);

const getOptimizedUrl = (imageUrl) => {
    if (!imageUrl) return null;
    try {
        const parts = imageUrl.split("/upload/");
        if (parts.length !== 2) return imageUrl;
        const transformation = "w_200,q_70,f_auto"; // Thumbnails in cart
        return `${parts[0]}/upload/${transformation}/${parts[1]}`;
    } catch (e) {
        return imageUrl;
    }
};
</script>
