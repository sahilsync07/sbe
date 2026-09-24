<template>
  <div class="relative inline-flex items-center gap-1.5" ref="badgeRef">
    <!-- 1. SBE Hub Version Tag Pill (sbe-hub_xxx) -->
    <button
      type="button"
      @click.stop="toggleHub"
      class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider transition-all duration-200 shadow-2xs active:scale-95 border select-none cursor-pointer"
      :class="isHubOpen 
        ? 'bg-violet-600 text-white border-violet-700 shadow-md ring-2 ring-violet-400/30' 
        : 'bg-white/90 backdrop-blur-md text-violet-700 border-violet-200/80 hover:bg-violet-50 hover:border-violet-300'"
      title="Tap to view SBE Hub build details"
    >
      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
      <span>{{ currentVersion.hubCode || currentVersion.code }}</span>
      <i class="fa-solid fa-circle-info text-[10px] opacity-70"></i>
    </button>

    <!-- 2. SBE Core Version Tag Pill (sbe_xxx) showing recent commit update -->
    <button
      type="button"
      @click.stop="toggleSbe"
      class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider transition-all duration-200 shadow-2xs active:scale-95 border select-none cursor-pointer"
      :class="isSbeOpen 
        ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400/30' 
        : 'bg-white/90 backdrop-blur-md text-emerald-700 border-emerald-200/80 hover:bg-emerald-50 hover:border-emerald-300'"
      :title="`Recent SBE Update: ${recentCommit.message}`"
    >
      <i class="fa-solid fa-code-commit text-[10px] text-emerald-500" :class="{ 'text-white': isSbeOpen }"></i>
      <span>{{ currentVersion.sbeCode || 'sbe_033' }}</span>
      <span v-if="isLiveCommit" class="w-1 h-1 rounded-full bg-emerald-500" title="Live GitHub"></span>
    </button>

    <!-- Info Bubble Popover 1: SBE Hub Release Timeline -->
    <Transition name="fade-pop">
      <div
        v-if="isHubOpen"
        class="absolute right-0 top-full mt-2 w-80 max-w-[90vw] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/90 p-4 z-50 text-slate-800 space-y-3"
      >
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded-lg bg-violet-100 text-violet-800 text-[10px] font-black uppercase">
              {{ currentVersion.hubCode || currentVersion.code }}
            </span>
            <span class="text-xs font-black text-slate-900">SBE Hub Release</span>
          </div>
          <button
            type="button"
            @click="isHubOpen = false"
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
            Recent Hub Releases
          </div>
          <div
            v-for="c in currentVersion.changes"
            :key="c.tag"
            class="p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1"
          >
            <div class="flex items-center justify-between">
              <span class="font-extrabold text-violet-700 text-[11px]">{{ c.hubTag || c.tag }}</span>
              <span class="text-[9px] text-slate-400 font-semibold">{{ c.date }}</span>
            </div>
            <p class="text-[11px] text-slate-600 font-medium leading-tight">
              {{ c.details }}
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="text-[10px] text-slate-400 font-medium text-center pt-1 border-t border-slate-100">
          Sri Brundabana Enterprises • SBE Hub
        </div>
      </div>
    </Transition>

    <!-- Info Bubble Popover 2: Recent SBE Commit Update -->
    <Transition name="fade-pop">
      <div
        v-if="isSbeOpen"
        class="absolute right-0 top-full mt-2 w-80 max-w-[90vw] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/90 p-4 z-50 text-slate-800 space-y-3"
      >
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
              {{ currentVersion.sbeCode || 'sbe_033' }}
            </span>
            <span class="text-xs font-black text-slate-900">Recent SBE Commit</span>
          </div>
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              @click="fetchLatestCommit"
              class="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-[10px] cursor-pointer"
              title="Refresh commit from GitHub"
            >
              <i class="fa-solid fa-rotate" :class="{ 'animate-spin': isFetchingCommit }"></i>
            </button>
            <button
              type="button"
              @click="isSbeOpen = false"
              class="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center text-xs cursor-pointer"
            >
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <!-- Commit Message Highlight Card -->
        <div class="p-3 rounded-xl bg-slate-900 text-white shadow-inner space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <i class="fa-solid fa-code-commit text-emerald-400 text-xs"></i>
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-300">Commit Message</span>
            </div>
            <a
              v-if="recentCommit.url"
              :href="recentCommit.url"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-1 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 hover:underline"
              title="View on GitHub"
            >
              <span>#{{ recentCommit.sha }}</span>
              <i class="fa-solid fa-arrow-up-right-from-square text-[8px]"></i>
            </a>
            <span v-else class="text-[10px] text-slate-400 font-mono">#{{ recentCommit.sha }}</span>
          </div>

          <p class="text-xs font-semibold leading-relaxed text-slate-100">
            {{ recentCommit.message }}
          </p>

          <div class="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px] text-slate-400">
            <span>{{ recentCommit.author }}</span>
            <span class="flex items-center gap-1">
              <i class="fa-regular fa-clock text-[9px]"></i>
              {{ recentCommit.date }}
            </span>
          </div>
        </div>

        <!-- Live Status Info -->
        <div class="flex items-center justify-between px-1 text-[10px] text-slate-400">
          <span class="flex items-center gap-1.5 font-medium">
            <span class="w-1.5 h-1.5 rounded-full" :class="isLiveCommit ? 'bg-emerald-500' : 'bg-amber-400'"></span>
            {{ isLiveCommit ? 'Synced with GitHub main' : 'Snapshot from build' }}
          </span>
          <a
            href="https://github.com/sahilsync07/sbe/commits/main"
            target="_blank"
            rel="noopener noreferrer"
            class="text-violet-600 hover:text-violet-800 font-semibold hover:underline"
          >
            All Commits →
          </a>
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
const isHubOpen = ref(false);
const isSbeOpen = ref(false);
const badgeRef = ref(null);

const isFetchingCommit = ref(false);
const isLiveCommit = ref(false);
const recentCommit = ref(currentVersion.recentCommit || {
  message: currentVersion.commitTitle,
  sha: '8919400',
  date: currentVersion.updatedAt,
  author: 'Sahil kumar',
  url: 'https://github.com/sahilsync07/sbe'
});

const toggleHub = () => {
  isHubOpen.value = !isHubOpen.value;
  if (isHubOpen.value) isSbeOpen.value = false;
};

const toggleSbe = () => {
  isSbeOpen.value = !isSbeOpen.value;
  if (isSbeOpen.value) {
    isHubOpen.value = false;
    if (!isLiveCommit.value) {
      fetchLatestCommit();
    }
  }
};

const fetchLatestCommit = async () => {
  isFetchingCommit.value = true;
  try {
    const res = await fetch('https://api.github.com/repos/sahilsync07/sbe/commits?per_page=1');
    if (res.ok) {
      const data = await res.json();
      if (data && data[0] && data[0].commit) {
        recentCommit.value = {
          message: data[0].commit.message,
          sha: data[0].sha.slice(0, 7),
          date: new Date(data[0].commit.author.date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
          author: data[0].commit.author.name || 'Sahil kumar',
          url: data[0].html_url
        };
        isLiveCommit.value = true;
      }
    }
  } catch (e) {
    // Graceful offline fallback to recentCommit from version.js
  } finally {
    isFetchingCommit.value = false;
  }
};

const handleClickOutside = (e) => {
  if (badgeRef.value && !badgeRef.value.contains(e.target)) {
    isHubOpen.value = false;
    isSbeOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  // Auto-fetch latest commit in background
  fetchLatestCommit();
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
