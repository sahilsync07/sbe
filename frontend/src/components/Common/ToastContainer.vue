<template>
  <div 
    class="toast-portal fixed z-[999999] pointer-events-none flex flex-col gap-2.5 items-end max-w-[calc(100vw-24px)] w-full sm:w-auto"
    :style="portalStyle"
  >
    <TransitionGroup name="toast-slide" tag="div" class="flex flex-col gap-2.5 items-end w-full">
      <div
        v-for="item in toasts"
        :key="item.id"
        class="toast-card group pointer-events-auto relative flex flex-col w-full max-w-[320px] sm:w-[320px] rounded-xl bg-neutral-900/95 text-white backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40 overflow-hidden select-none transition-all duration-200"
        @mouseenter="pauseToast(item.id)"
        @mouseleave="resumeToast(item.id)"
        @touchstart.passive="pauseToast(item.id)"
        @touchend.passive="resumeToast(item.id)"
      >
        <!-- Card Body -->
        <div class="flex items-start gap-2.5 py-2.5 px-3.5 w-full">
          <!-- Icon -->
          <div class="flex-shrink-0 mt-0.5">
            <!-- Success Icon -->
            <svg 
              v-if="item.type === 'success'" 
              class="w-4 h-4 text-emerald-400" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
            </svg>

            <!-- Error Icon -->
            <svg 
              v-else-if="item.type === 'error'" 
              class="w-4 h-4 text-rose-400" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
            </svg>

            <!-- Warning Icon -->
            <svg 
              v-else-if="item.type === 'warning'" 
              class="w-4 h-4 text-amber-400" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
            </svg>

            <!-- Loading Spinner -->
            <svg 
              v-else-if="item.type === 'loading'" 
              class="w-4 h-4 text-sky-400 animate-spin" 
              viewBox="0 0 24 24" 
              fill="none"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>

            <!-- Info / Default Icon -->
            <svg 
              v-else 
              class="w-4 h-4 text-sky-400" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
            </svg>
          </div>

          <!-- Message Text (wraps cleanly to multiple lines) -->
          <div class="flex-1 min-w-0 pr-1">
            <p class="text-[13px] leading-snug font-normal text-neutral-100 break-words whitespace-pre-wrap select-text">
              {{ item.message }}
            </p>
          </div>

          <!-- Close Button -->
          <button
            v-if="item.closeButton"
            type="button"
            class="flex-shrink-0 text-neutral-400 hover:text-white p-0.5 rounded transition-colors hover:bg-white/10"
            aria-label="Close"
            @click.stop="removeToast(item.id)"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <!-- Progress Bar (3s default countdown, pauses on hover) -->
        <div 
          v-if="item.duration > 0"
          class="relative w-full h-[2.5px] bg-white/5 overflow-hidden"
        >
          <div
            class="toast-progress-bar h-full"
            :class="[
              getProgressBarColor(item.type),
              { 'toast-progress-paused': item.isPaused }
            ]"
            :style="{ '--duration': item.duration + 'ms' }"
          ></div>
        </div>

        <!-- Indeterminate pulse for loading state -->
        <div 
          v-else-if="item.type === 'loading'" 
          class="w-full h-[2px] bg-sky-500/20 overflow-hidden"
        >
          <div class="h-full bg-sky-400 animate-pulse w-full"></div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { toasts, removeToast, pauseToast, resumeToast } from '@/composables/useToast.js';

const portalStyle = computed(() => ({
  top: 'max(env(safe-area-inset-top, 16px), 16px)',
  right: 'max(env(safe-area-inset-right, 16px), 16px)'
}));

function getProgressBarColor(type) {
  switch (type) {
    case 'success':
      return 'bg-emerald-400';
    case 'error':
      return 'bg-rose-400';
    case 'warning':
      return 'bg-amber-400';
    case 'info':
      return 'bg-sky-400';
    default:
      return 'bg-neutral-300';
  }
}
</script>

<style scoped>
/* Crisp progress countdown animation */
.toast-progress-bar {
  width: 100%;
  animation: toast-countdown var(--duration, 3000ms) linear forwards;
  transform-origin: left;
}

.toast-progress-paused,
.toast-card:hover .toast-progress-bar {
  animation-play-state: paused !important;
}

@keyframes toast-countdown {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

/* Slide in from top-right + crisp fade */
.toast-slide-enter-active {
  transition: all 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-slide-leave-active {
  transition: all 0.18s cubic-bezier(0.4, 0, 1, 1);
}

.toast-slide-enter-from {
  opacity: 0;
  transform: translate3d(28px, 0, 0) scale(0.96);
}

.toast-slide-leave-to {
  opacity: 0;
  transform: translate3d(32px, 0, 0) scale(0.94);
}

.toast-slide-move {
  transition: all 0.22s ease-out;
}
</style>
