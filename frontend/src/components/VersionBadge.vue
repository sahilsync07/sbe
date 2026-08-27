<template>
  <div class="relative inline-block" ref="badgeRef">
    <!-- Clickable Version Tag Pill -->
    <button
      type="button"
      @click.stop="isOpen = !isOpen"
      class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider transition-all duration-200 shadow-2xs active:scale-95 border select-none cursor-pointer"
      :class="isOpen 
        ? 'bg-violet-600 text-white border-violet-700 shadow-md ring-2 ring-violet-400/30' 
        : 'bg-white/90 backdrop-blur-md text-violet-700 border-violet-200/80 hover:bg-violet-50 hover:border-violet-300'"
      title="Tap to view build update details"
    >
      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
      <span>{{ currentVersion.code }}</span>
      <i class="fa-solid fa-circle-info text-[10px] opacity-70"></i>
    </button>

    <!-- Info Bubble Popover (Click outside dismisses) -->
    <Transition name="fade-pop">
      <div
        v-if="isOpen"
        class="absolute right-0 top-full mt-2 w-80 max-w-[90vw] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/90 p-4 z-50 text-slate-800 space-y-3"
      >
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded-lg bg-violet-100 text-violet-800 text-[10px] font-black uppercase">
              {{ currentVersion.code }}
            </span>
            <span class="text-xs font-black text-slate-900">Latest Build Update</span>
          </div>
          <button
            type="button"
            @click="isOpen = false"
            class="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center text-xs cursor-pointer"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Latest Update Info -->
        <div class="space-y-1">
          <div class="text-xs font-bold text-slate-900 leading-snug">
            {{ currentVersion.commitTitle }}
          </div>
          <div class="text-[10px] font-semibold text-slate-400 flex items-center gap-1.5">
            <i class="fa-regular fa-clock text-[9px]"></i>
            <span>Deployed: {{ currentVersion.updatedAt }}</span>
          </div>
        </div>

        <!-- Change History Timeline -->
        <div class="space-y-2 border-t border-slate-100 pt-2.5 max-h-48 overflow-y-auto pr-1">
          <div class="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Recent Releases
          </div>
          <div
            v-for="c in currentVersion.changes"
            :key="c.tag"
            class="p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1"
          >
            <div class="flex items-center justify-between">
              <span class="font-extrabold text-violet-700 text-[11px]">{{ c.tag }}</span>
              <span class="text-[9px] text-slate-400 font-semibold">{{ c.date }}</span>
            </div>
            <p class="text-[11px] text-slate-600 font-medium leading-tight">
              {{ c.details }}
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="text-[10px] text-slate-400 font-medium text-center pt-1 border-t border-slate-100">
          Sri Brundabana Enterprises • Rayagada
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { APP_VERSION } from '../utils/version';

const currentVersion = APP_VERSION;
const isOpen = ref(false);
const badgeRef = ref(null);

const handleClickOutside = (e) => {
  if (badgeRef.value && !badgeRef.value.contains(e.target)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.fade-pop-enter-active,
.fade-pop-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-pop-enter-from,
.fade-pop-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}
</style>
