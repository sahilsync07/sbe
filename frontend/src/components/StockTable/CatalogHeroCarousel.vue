<template>
  <div 
    class="relative w-full overflow-hidden select-none group/carousel"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
  >
    <!-- Main Carousel Stage -->
    <div 
      class="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border border-slate-200/80 bg-gradient-to-br from-slate-950 via-[#18181b] to-slate-900 text-white cursor-pointer transition-all duration-300 hover:shadow-xl"
      @click="handleBannerClick"
    >
      <!-- Background Ambient Glow & Blur -->
      <div 
        class="absolute -inset-10 opacity-30 blur-3xl pointer-events-none transition-all duration-1000"
        :style="{ background: ambientGradient }"
      ></div>

      <!-- Slide Content Transition -->
      <Transition name="fade-slide" mode="out-in">
        <div 
          :key="currentSlide.id"
          class="relative z-10 w-full h-52 sm:h-64 md:h-80 flex items-stretch"
        >
          <!-- Left Content Info Column -->
          <div class="flex-1 p-4 sm:p-7 md:p-9 flex flex-col justify-between z-20 min-w-0">
            <!-- Header Badges -->
            <div class="flex items-center gap-2 flex-wrap">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] sm:text-[11px] font-black uppercase tracking-wider backdrop-blur-md">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                Official Catalog 2026
              </span>
              <span class="px-2.5 py-1 rounded-full bg-white/10 text-white/90 border border-white/15 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
                {{ currentSlide.brand }}
              </span>
            </div>

            <!-- Title & Subtitle -->
            <div class="my-auto py-2">
              <h2 class="text-lg sm:text-2xl md:text-3xl font-black font-['Clash_Display'] tracking-tight text-white leading-tight drop-shadow-md line-clamp-2">
                {{ currentSlide.title }}
              </h2>
              <p class="mt-1 sm:mt-1.5 text-xs sm:text-sm text-slate-300 font-medium line-clamp-2 drop-shadow">
                {{ currentSlide.subtitle }}
              </p>
            </div>

            <!-- Action CTA & Progress Indicator -->
            <div class="flex items-center justify-between gap-3 pt-2">
              <button 
                type="button"
                @click.stop="handleBannerClick"
                class="inline-flex items-center gap-2 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 group/btn"
              >
                <span>Shop {{ currentSlide.brand }}</span>
                <i class="fa-solid fa-arrow-right text-[10px] sm:text-xs transition-transform group-hover/btn:translate-x-1"></i>
              </button>

              <!-- Slide Count Tracker -->
              <div class="text-[10px] sm:text-xs font-mono font-bold text-slate-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full backdrop-blur-md">
                <span class="text-amber-400 font-black">{{ String(currentIndex + 1).padStart(2, '0') }}</span>
                <span class="opacity-40 mx-1">/</span>
                <span>{{ String(banners.length).padStart(2, '0') }}</span>
              </div>
            </div>
          </div>

          <!-- Right Cover Artwork Section -->
          <div class="w-[42%] sm:w-[38%] md:w-[32%] h-full p-2 sm:p-4 flex items-center justify-center relative shrink-0">
            <div class="relative h-full w-full flex items-center justify-center">
              <img 
                :src="currentSlideImage"
                :alt="currentSlide.title"
                class="h-full w-auto max-w-full object-contain rounded-xl sm:rounded-2xl shadow-2xl transition-transform duration-700 group-hover/carousel:scale-105"
                loading="eager"
              />
              <!-- Subtle gloss reflection overlay -->
              <div class="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"></div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Carousel Navigation Chevrons -->
      <button 
        type="button"
        @click.stop="prevSlide"
        class="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-7 sm:w-9 h-7 sm:h-9 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center transition-all opacity-0 group-hover/carousel:opacity-100 hover:scale-110 active:scale-95"
        title="Previous banner"
      >
        <i class="fa-solid fa-chevron-left text-xs"></i>
      </button>

      <button 
        type="button"
        @click.stop="nextSlide"
        class="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-7 sm:w-9 h-7 sm:h-9 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center transition-all opacity-0 group-hover/carousel:opacity-100 hover:scale-110 active:scale-95"
        title="Next banner"
      >
        <i class="fa-solid fa-chevron-right text-xs"></i>
      </button>

      <!-- Bottom Progress Bar & Dots -->
      <div class="absolute bottom-2 left-4 right-4 z-20 flex items-center justify-center gap-1.5 pointer-events-none">
        <span 
          v-for="(b, idx) in banners" 
          :key="b.id"
          class="h-1 rounded-full transition-all duration-300"
          :class="idx === currentIndex ? 'w-6 bg-amber-400 shadow-sm' : 'w-1.5 bg-white/20'"
        ></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  interval: {
    type: Number,
    default: 4500
  }
});

const emit = defineEmits(['select-tab', 'explore']);

const baseUrl = import.meta.env.BASE_URL || '/';

const banners = [
  {
    id: 'solea',
    title: 'Paragon Solea',
    subtitle: 'Elegance & Comfort For Women',
    tab: 'PARAGON LADIES',
    brand: 'SOLEA',
    color: '#9333ea',
    cloudinaryUrl: 'https://res.cloudinary.com/dieqsg5tr/image/upload/v1790145353/e-sbe/banners/02_solea_cover.webp',
    filename: '02_solea_cover.webp'
  },
  {
    id: 'paralite',
    title: 'Paralite Lightweight',
    subtitle: 'Lightweight Waterproof Daily Slippers',
    tab: 'PARALITE',
    brand: 'PARALITE',
    color: '#2563eb',
    cloudinaryUrl: 'https://res.cloudinary.com/dieqsg5tr/image/upload/v1790145362/e-sbe/banners/06_paralite_cover.webp',
    filename: '06_paralite_cover.webp'
  },
  {
    id: 'eeken_clogs',
    title: 'Eeken Casual Clogs',
    subtitle: 'Men\'s Collection - Max Comfort #WeekendEveryday',
    tab: 'EEKEN',
    brand: 'EEKEN',
    color: '#0d9488',
    cloudinaryUrl: 'https://res.cloudinary.com/dieqsg5tr/image/upload/v1790145377/e-sbe/banners/13_eeken_clogs.webp',
    filename: '13_eeken_clogs.webp'
  },
  {
    id: 'ptoes',
    title: 'P-Toes Kids Footwear',
    subtitle: 'Smart Footwear For Kids & Junior',
    tab: 'P-TOES PARALITE',
    brand: 'P-TOES',
    color: '#ea580c',
    cloudinaryUrl: 'https://res.cloudinary.com/dieqsg5tr/image/upload/v1790145368/e-sbe/banners/09_ptoes_cover.webp',
    filename: '09_ptoes_cover.webp'
  },
  {
    id: 'vertex',
    title: 'Paragon Vertex',
    subtitle: 'Premium PU Footwear for Men',
    tab: 'PARAGON GENTS',
    brand: 'VERTEX',
    color: '#b45309',
    cloudinaryUrl: 'https://res.cloudinary.com/dieqsg5tr/image/upload/v1790145356/e-sbe/banners/03_vertex_cover.webp',
    filename: '03_vertex_cover.webp'
  },
  {
    id: 'comfy',
    title: 'Paragon Comfy',
    subtitle: 'Ultra Soft Daily Comfort',
    tab: 'PARAGON GENTS',
    brand: 'COMFY',
    color: '#0284c7',
    cloudinaryUrl: 'https://res.cloudinary.com/dieqsg5tr/image/upload/v1790145358/e-sbe/banners/04_comfy_cover.webp',
    filename: '04_comfy_cover.webp'
  },
  {
    id: 'escoute',
    title: 'Escoute Premium Men',
    subtitle: 'Sophisticated Men\'s PU Collection',
    tab: 'Escoute',
    brand: 'ESCOUTE',
    color: '#475569',
    cloudinaryUrl: 'https://res.cloudinary.com/dieqsg5tr/image/upload/v1790145360/e-sbe/banners/05_escoute_cover.webp',
    filename: '05_escoute_cover.webp'
  },
  {
    id: 'meriva',
    title: 'Meriva by Paragon',
    subtitle: 'Stylish & Soft Women\'s PU Footwear',
    tab: 'PARAGON LADIES',
    brand: 'MERIVA',
    color: '#db2777',
    cloudinaryUrl: 'https://res.cloudinary.com/dieqsg5tr/image/upload/v1790145364/e-sbe/banners/07_meriva_cover.webp',
    filename: '07_meriva_cover.webp'
  },
  {
    id: 'paragon_max',
    title: 'Paragon Max Sports',
    subtitle: 'Durable Athletic & Daily Shoes',
    tab: 'Max',
    brand: 'MAX',
    color: '#16a34a',
    cloudinaryUrl: 'https://res.cloudinary.com/dieqsg5tr/image/upload/v1790145366/e-sbe/banners/08_paragon_max_cover.webp',
    filename: '08_paragon_max_cover.webp'
  },
  {
    id: 'school_shoes',
    title: 'Paragon School Shoes',
    subtitle: 'Durolite All-Weather School Collection',
    tab: 'School',
    brand: 'SCHOOL',
    color: '#3b82f6',
    cloudinaryUrl: 'https://res.cloudinary.com/dieqsg5tr/image/upload/v1790145370/e-sbe/banners/10_school_shoes_cover.webp',
    filename: '10_school_shoes_cover.webp'
  },
  {
    id: 'tuffboot',
    title: 'Tuffboot Heavy Duty',
    subtitle: 'Heavy Duty Industrial & Safety Footwear',
    tab: 'Safety',
    brand: 'TUFFBOOT',
    color: '#dc2626',
    cloudinaryUrl: 'https://res.cloudinary.com/dieqsg5tr/image/upload/v1790145372/e-sbe/banners/11_tuffboot_cover.webp',
    filename: '11_tuffboot_cover.webp'
  },
  {
    id: 'eeken_main',
    title: 'Eeken #WeekendEveryday',
    subtitle: 'Get Fluent In Fun - The Complete Collection',
    tab: 'EEKEN',
    brand: 'EEKEN',
    color: '#059669',
    cloudinaryUrl: 'https://res.cloudinary.com/dieqsg5tr/image/upload/v1790145375/e-sbe/banners/12_eeken_main.webp',
    filename: '12_eeken_main.webp'
  },
  {
    id: 'paragon_main',
    title: 'Paragon 2026 Collection',
    subtitle: 'India\'s Most Trusted Footwear Brand',
    tab: 'PARAGON GENTS',
    brand: 'PARAGON',
    color: '#e11d48',
    cloudinaryUrl: 'https://res.cloudinary.com/dieqsg5tr/image/upload/v1790145352/e-sbe/banners/01_paragon_main.webp',
    filename: '01_paragon_main.webp'
  }
];

const currentIndex = ref(0);
const isHovered = ref(false);
let timer = null;
let touchStartX = 0;

const currentSlide = computed(() => banners[currentIndex.value] || banners[0]);

const currentSlideImage = computed(() => {
  return currentSlide.value.cloudinaryUrl || `${baseUrl}assets/banners/${currentSlide.value.filename}`;
});

const ambientGradient = computed(() => {
  const col = currentSlide.value.color || '#c59b27';
  return `radial-gradient(circle at 75% 50%, ${col} 0%, transparent 65%)`;
});

const nextSlide = () => {
  currentIndex.value = (currentIndex.value + 1) % banners.length;
};

const prevSlide = () => {
  currentIndex.value = (currentIndex.value - 1 + banners.length) % banners.length;
};

const handleBannerClick = () => {
  emit('select-tab', currentSlide.value.tab);
  emit('explore', currentSlide.value);
};

const handleTouchStart = (e) => {
  touchStartX = e.changedTouches[0].clientX;
};

const handleTouchEnd = (e) => {
  const diff = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(diff) > 40) {
    if (diff < 0) nextSlide();
    else prevSlide();
  }
};

const startTimer = () => {
  stopTimer();
  timer = setInterval(() => {
    if (!isHovered.value) {
      nextSlide();
    }
  }, props.interval);
};

const stopTimer = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

onMounted(() => {
  startTimer();
});

onUnmounted(() => {
  stopTimer();
});
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: scale(0.98) translateY(6px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: scale(1.02) translateY(-6px);
}
</style>
