<template>
  <div
    class="relative bg-card rounded-2xl overflow-hidden border transition-all duration-300"
    :class="[
      isNewArrival
        ? 'border-new-arrival/30 shadow-[0_4px_20px_rgba(200,150,50,0.12)]'
        : 'border-border/60 hover:border-border'
    ]"
    @click="handleClick"
  >
    <!-- Product Image Area -->
    <div class="relative aspect-square bg-secondary">
      <img
        v-if="product.image"
        :src="product.image"
        :alt="product.name"
        class="w-full h-full object-cover"
        loading="lazy"
      />
      <div v-else class="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-secondary/80">
        <ImageIcon class="w-10 h-10 mb-1.5 opacity-20" :stroke-width="1.25" />
        <span class="text-[10px] opacity-40 font-medium tracking-wide uppercase">No image</span>
      </div>

       <!-- Admin Upload Overlay -->
       <!-- Note: In Vue we might handle this differently, but keeping structure similar -->
        <button
            v-if="isAdmin"
            @click.stop="$emit('upload-photo', product)"
            class="absolute inset-0 bg-foreground/70 backdrop-blur-[2px] flex items-center justify-center transition-all duration-200 opacity-0 hover:opacity-100"
        >
            <div class="flex flex-col items-center text-white">
              <Camera class="w-7 h-7 mb-1.5" :stroke-width="1.5" />
              <span class="text-[10px] font-semibold tracking-wide uppercase">
                {{ product.image ? "Change" : "Add Photo" }}
              </span>
            </div>
        </button>

      <!-- New Arrival Badge -->
      <div
        v-if="isNewArrival"
        class="absolute top-2.5 right-2.5 px-2 py-1 bg-new-arrival/90 text-foreground text-[9px] font-bold rounded-lg tracking-widest shadow-md"
      >
        NEW
      </div>
    </div>

    <!-- Product Info -->
    <div class="p-3.5">
      <h3 class="font-semibold text-sm text-foreground line-clamp-1 mb-0.5 tracking-tight">
        {{ product.name }}
      </h3>
      <p class="text-[11px] text-muted-foreground/80 mb-3 font-medium">{{ product.brand }}</p>

        <div class="flex items-center justify-between">
        <div>
          <span class="text-xl font-black text-foreground tracking-tight">
            {{ product.stock }}
          </span>
          <span class="text-[10px] text-muted-foreground/60 ml-1 font-semibold uppercase tracking-wide">Pairs</span>
        </div>

        <div class="flex gap-2" @click.stop>
             <!-- Quantity Controls (if in cart) -->
             <div v-if="cartQuantity > 0" class="flex items-center bg-blue-50 rounded-xl overflow-hidden shadow-sm border border-blue-100 h-9">
                 <button 
                  @click="updateQuantity(-1)"
                  class="w-8 h-full flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors"
                 >
                    <span class="font-bold text-lg leading-none mb-0.5">-</span>
                 </button>
                 <span class="w-8 flex items-center justify-center font-bold text-sm text-blue-700">{{ cartQuantity }}</span>
                 <button 
                  @click="updateQuantity(1)"
                  class="w-8 h-full flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors"
                 >
                    <Plus class="w-3.5 h-3.5" :stroke-width="3" />
                 </button>
             </div>

             <!-- Add to Cart (Initial) -->
            <button
            v-else
            @click.stop="$emit('add-to-cart', product)"
            class="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all duration-200 active:scale-90 shadow-sm"
            :aria-label="`Add ${product.name} to cart`"
            >
            <Plus class="w-4 h-4" :stroke-width="2.5" />
            </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ImageIcon, Camera, Plus } from 'lucide-vue-next';

const props = defineProps({
  product: {
    type: Object,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isNewArrival: {
    type: Boolean,
    default: false
  },
  cartQuantity: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['add-to-cart', 'update-quantity', 'upload-photo', 'click']);

const handleClick = () => {
    emit('click', props.product);
};

const updateQuantity = (change) => {
    emit('update-quantity', props.product, change);
};
</script>
