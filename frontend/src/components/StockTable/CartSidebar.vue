
<template>
    <aside
      class="fixed inset-y-0 right-0 w-full sm:w-[500px] border-l border-slate-200 z-[90] transform transition-transform duration-300 ease-out flex flex-col bg-white shadow-2xl"
      :class="showCart ? 'translate-x-0' : 'translate-x-full'"
    >
      <!-- Header -->
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
         <div class="flex items-center gap-3">
             <div class="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/20">
                <i class="fa-solid fa-bag-shopping text-sm"></i>
             </div>
             <div>
                 <h2 class="text-xl font-bold text-slate-900 font-heading leading-none">Shopping Bag</h2>
                 <span v-if="cartTotalItems > 0" class="text-xs font-medium text-slate-500">{{ cartTotalItems }} items</span>
             </div>
         </div>
         
         <div class="flex items-center gap-3">
             <button 
               v-if="cartItemCount > 0"
               @click="$emit('clearCart')"
               class="w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
               title="Clear Cart"
             >
               <i class="fa-solid fa-trash-can text-sm"></i>
             </button>
             
             <button 
               @click="$emit('closeCart')"
               class="w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
             >
               <i class="fa-solid fa-xmark text-lg"></i>
             </button>
         </div>
      </div>
      
      <!-- Cart Items -->
      <div class="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 overscroll-contain">
         <!-- Empty State -->
         <div v-if="cartItemCount === 0" class="flex flex-col items-center justify-center h-full text-center p-8">
            <div class="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 animate-pulse-slow">
                <i class="fa-solid fa-basket-shopping text-4xl text-slate-300"></i>
            </div>
            <h3 class="text-lg font-bold text-slate-700 mb-2">Your bags are empty</h3>
            <p class="text-sm text-slate-400 max-w-[200px] mb-8">Looks like you haven't added anything to your cart yet.</p>
            <button 
                @click="$emit('closeCart')" 
                class="px-8 py-3 bg-slate-900 text-white rounded-full text-sm font-bold shadow-lg shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all"
            >
                Start Shopping
            </button>
         </div>
         
         <!-- Item List -->
         <transition-group name="list" tag="div" class="space-y-4" v-else>
            <div 
                v-for="(item, index) in filteredCart" 
                :key="item.product.productName" 
                class="flex gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
            >
               <!-- Mini Thumbnail -->
               <div class="w-20 h-24 bg-slate-50 rounded-xl border border-slate-100 shrink-0 overflow-hidden relative">
                  <img v-if="item.product.imageUrl" :src="getOptimizedUrl(item.product.imageUrl)" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full flex flex-col items-center justify-center text-slate-300">
                      <i class="fa-solid fa-image text-xl opacity-20"></i>
                  </div>
               </div>
               
                <div class="flex-1 min-w-0 flex flex-col justify-between py-1">
                  <div>
                      <div class="flex justify-between items-start gap-2 mb-1">
                          <h4 class="text-sm font-bold text-slate-800 line-clamp-2 leading-tight" :title="item.product.productName">
                              {{ item.product.productName }}
                          </h4>
                          <button 
                              @click="$emit('removeFromCart', index)" 
                              class="shrink-0 w-6 h-6 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors"
                          >
                             <i class="fa-solid fa-xmark"></i>
                          </button>
                      </div>
                      <p class="text-xs text-slate-400 font-medium truncate">
                          {{ item.product.groupName || 'Item' }}
                      </p>
                  </div>

                  <div class="flex items-center justify-between mt-2">
                      <div class="flex items-center bg-slate-50 rounded-full p-1 border border-slate-200/60">
                         <button 
                             @click="$emit('updateCartQuantity', index, -1)" 
                             class="w-7 h-7 flex items-center justify-center bg-white border border-slate-200 text-slate-600 rounded-full shadow-sm hover:bg-slate-50 active:scale-90 transition-all"
                         >
                             <i class="fa-solid fa-minus text-[10px]"></i>
                         </button>
                         <span class="text-sm font-bold text-slate-800 w-8 text-center">{{ item.quantity }}</span>
                         <button 
                             @click="$emit('updateCartQuantity', index, 1)" 
                             class="w-7 h-7 flex items-center justify-center bg-slate-900 text-white rounded-full shadow-md hover:bg-slate-800 active:scale-90 transition-all"
                         >
                             <i class="fa-solid fa-plus text-[10px]"></i>
                         </button>
                      </div>
                      <div class="text-right">
                          <span class="text-[10px] uppercase font-bold text-slate-400">Total</span>
                      </div>
                  </div>
               </div>
            </div>
         </transition-group>
      </div>
      
      <!-- Footer -->
      <div class="p-6 border-t border-slate-100 bg-white z-20 shadow-[0_-4px_24px_rgba(0,0,0,0.03)]">
          <!-- Summary Row -->
          <div class="flex justify-between items-end mb-6">
             <div class="flex flex-col">
                 <span class="text-slate-400 font-medium text-xs uppercase tracking-wider mb-1">Total Quantity</span>
                 <span class="text-3xl font-black text-slate-900 font-heading leading-none">
                    {{ cartTotalItems }}
                    <span class="text-lg font-bold text-slate-400 ml-1">Sets</span>
                 </span>
             </div>

          </div>

          <button 
            @click="$emit('sendOrderToWhatsapp')"
            :disabled="cartTotalItems === 0"
            class="w-full py-4 bg-[#25D366] hover:bg-[#22bf5b] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg rounded-2xl shadow-xl shadow-green-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group relative overflow-hidden"
          >
            <!-- Shin effect -->
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 transform skew-x-12"></div>
            
            <i class="fa-brands fa-whatsapp text-2xl group-hover:scale-110 transition-transform"></i>
            <span>Confirm Order</span>
          </button>
          
          <p class="text-center text-[10px] text-slate-400 mt-4 font-medium">
              Secure checkout via WhatsApp • <span class="hover:text-blue-500 cursor-pointer transition-colors">Terms & Conditions</span>
          </p>
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

<style scoped>
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-leave-active {
  position: absolute;
}
</style>
