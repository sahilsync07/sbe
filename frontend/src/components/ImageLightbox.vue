<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-250 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-0 z-[200] flex flex-col bg-black/95 backdrop-blur-md"
        @click.self="$emit('close')"
      >
        <!-- Top Bar -->
        <div
          class="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top,16px),16px)] pb-3 bg-gradient-to-b from-black/80 to-transparent z-10"
        >
          <button
            @click="$emit('close')"
            class="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white active:scale-95 transition-all border border-white/10"
          >
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
          <div class="text-right min-w-0 flex-1 ml-4">
            <p v-if="title" class="text-sm font-semibold text-white truncate">{{ title }}</p>
            <p v-if="subtitle" class="text-xs text-slate-400 truncate mt-0.5">{{ subtitle }}</p>
          </div>
        </div>

        <!-- Image Area -->
        <div class="flex-1 flex items-center justify-center p-4 overflow-auto" @click.self="$emit('close')">
          <CachedImage
            v-if="src"
            :src="optimizedSrc"
            alt="Enlarged view"
            class="max-w-full max-h-full object-contain drop-shadow-2xl rounded-lg"
          />
          <div v-else class="flex flex-col items-center gap-3 text-slate-500">
            <i class="fa-solid fa-image text-5xl opacity-30"></i>
            <span class="text-sm font-medium">No image available</span>
          </div>
        </div>

        <!-- Bottom Info -->
        <div
          v-if="info"
          class="px-5 pb-[max(env(safe-area-inset-bottom,12px),16px)] pt-3 bg-gradient-to-t from-black/80 to-transparent"
        >
          <p class="text-sm text-slate-300 text-center">{{ info }}</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, watch } from 'vue';
import CachedImage from './StockTable/CachedImage.vue';

const props = defineProps({
  show: { type: Boolean, default: false },
  src: { type: String, default: null },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  info: { type: String, default: '' },
});

defineEmits(['close']);

const optimizedSrc = computed(() => {
  if (!props.src) return null;
  try {
    const parts = props.src.split('/upload/');
    if (parts.length !== 2) return props.src;
    const transformation = 'w_1000,q_80,f_auto';
    return `${parts[0]}/upload/${transformation}/${parts[1]}`;
  } catch {
    return props.src;
  }
});

// Lock body scroll when lightbox is open
watch(() => props.show, (isOpen) => {
  document.body.style.overflow = isOpen ? 'hidden' : '';
});
</script>
