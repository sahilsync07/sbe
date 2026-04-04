<template>
  <div @click="$emit('click')" class="group cursor-pointer">
    <!-- Base card container -->
    <div
      class="relative overflow-hidden w-full bg-white shadow-sm border border-slate-100 transition-all duration-300 group-hover:shadow-md group-active:scale-[0.97]"
      :class="[aspectClass, roundedClass]"
    >
      <!-- Image Slider -->
      <Transition name="tile">
        <div
          v-if="slideChunks.length > 0"
          :key="currentIndex"
          class="absolute inset-0 w-full h-full bg-slate-50 flex items-stretch"
        >
          <!-- Loop through items inside the chunk -->
          <div v-for="slide in slideChunks[currentIndex]" :key="slide.id" class="flex-1 h-full relative overflow-hidden">
            <div class="w-full h-full flex items-center justify-center transition-transform duration-[800ms] group-hover:scale-110 ease-[cubic-bezier(0.25,1,0.5,1)]">
              
              <!-- Logo/Icon Slide -->
              <div v-if="slide.type === 'logo'" class="w-full h-full flex flex-col items-center justify-start pt-12 p-6 bg-slate-50">
                <!-- If it's a logo image -->
                <img v-if="slide.src" :src="slide.src" :class="slide.cover ? 'w-full h-full object-cover' : 'w-2/3 h-2/3 object-contain'" />
                
                <!-- If it's an icon -->
                <div v-else-if="slide.icon" class="w-20 h-20 rounded-[2rem] bg-white shadow-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-500">
                  <i :class="slide.icon" class="text-slate-500 text-3xl drop-shadow-sm"></i>
                </div>
                
                <!-- Center label if no image or if logo is small -->
                <div v-if="!slide.src" class="text-center">
                  <span class="font-black tracking-[0.3em] text-slate-800 text-sm sm:text-base uppercase drop-shadow-sm">{{ card.label }}</span>
                </div>
              </div>

              <!-- Product Image Slide -->
              <div v-else class="w-full h-full border-r border-slate-200/30 last:border-0 relative">
                <img :src="slide.src" class="w-full h-full object-cover" loading="lazy" />
              </div>
              
            </div>
          </div>
        </div>
      </Transition>

      <!-- Glassmorphic Floating Label REMOVED -->

      <!-- Live Badge (for New Arrivals Hero) -->
      <div v-if="isHero" class="absolute top-4 left-4 z-[10] flex items-center gap-2 px-3.5 py-1.5 bg-black/50 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-[0.2em] border border-white/10 shadow-2xl">
        <span class="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,1)] animate-pulse"></span>
        Live
      </div>

      <!-- Count badge REMOVED -->

      <!-- Subtle Vignette overlay -->
      <div class="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-60"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  card: { type: Object, required: true },
  images: { type: Array, default: () => [] },
  count: { type: Number, default: 0 },
  aspectClass: { type: String, default: 'aspect-[3/4]' },
  roundedClass: { type: String, default: 'rounded-xl' },
  isHero: { type: Boolean, default: false },
  hideTextOnImage: { type: Boolean, default: false },
  hideLogoText: { type: Boolean, default: false },
  visibleSlides: { type: Number, default: 1 }
});

defineEmits(['click']);

const slideHasCover = (slide) => {
  return slide?.cover === true;
};

const slides = computed(() => {
  const arr = [];
  // First slide: logo/icon
  if (props.card.logo || props.card.icon || props.card.forceLogoSlide) {
    arr.push({ 
      id: 'logo-0', 
      type: 'logo', 
      src: props.card.logo || null, 
      icon: props.card.icon || null,
      cover: props.card.cover || false
    });
  }
  
  // Subsequent slides: product images
  props.images.forEach((img, i) => {
    arr.push({ id: `img-${i + 1}`, type: 'image', src: img });
  });
  return arr;
});

const slideChunks = computed(() => {
  if (props.visibleSlides <= 1) return slides.value.map(s => [s]);
  const chunks = [];
  for (let i = 0; i < slides.value.length; i += props.visibleSlides) {
    chunks.push(slides.value.slice(i, i + props.visibleSlides));
  }
  return chunks;
});

const currentIndex = ref(0);
let timeout = null;
let interval = null;

onMounted(() => {
  if (slideChunks.value.length > 1) {
    timeout = setTimeout(() => {
      interval = setInterval(() => {
        if (slideChunks.value.length > 0) {
          currentIndex.value = (currentIndex.value + 1) % slideChunks.value.length;
        }
      }, 5000 + Math.random() * 2000);
    }, Math.random() * 1500);
  }
});

onUnmounted(() => {
  if (timeout) clearTimeout(timeout);
  if (interval) clearInterval(interval);
});
</script>

<style scoped>
.tile-enter-active,
.tile-leave-active {
  transition: opacity 1s cubic-bezier(0.4, 0, 0.2, 1);
}
.tile-enter-from,
.tile-leave-to {
  opacity: 0;
}
</style>
