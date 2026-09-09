<template>
  <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
    <div v-if="show" class="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="$emit('close')"></div>

      <!-- Modal Card -->
      <div class="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        <!-- Header -->
        <div class="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <i class="fa-brands fa-github text-xl"></i>
            </div>
            <div>
              <h3 class="text-base font-extrabold text-slate-900 leading-tight">GitHub Cloud Sync</h3>
              <p class="text-[11px] text-slate-500 font-medium">Direct catalog & photo commits</p>
            </div>
          </div>
          <button 
            @click="$emit('close')"
            class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
          >
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 space-y-5">
          <!-- Connection Status Card -->
          <div class="p-4 rounded-2xl border transition-all" :class="isConfigured ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50/50 border-amber-200'">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2">
                <span class="relative flex h-2.5 w-2.5">
                  <span v-if="isConfigured" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2.5 w-2.5" :class="isConfigured ? 'bg-emerald-500' : 'bg-amber-500'"></span>
                </span>
                <span class="text-xs font-black uppercase tracking-wider" :class="isConfigured ? 'text-emerald-700' : 'text-amber-800'">
                  {{ isConfigured ? 'Cloud Sync Active' : 'Setup Required on Device' }}
                </span>
              </div>
              <span class="text-[10px] font-mono text-slate-400">main</span>
            </div>
            <p class="text-xs mt-2 text-slate-600 font-medium leading-relaxed">
              {{ isConfigured 
                ? 'Device is authorized to commit photo uploads directly to sahilsync07/sbe.' 
                : 'This device needs a sync key to commit photos to GitHub without a PC server.' 
              }}
            </p>
          </div>

          <!-- Pending Photos Status -->
          <div class="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-white text-slate-600 shadow-sm flex items-center justify-center">
                <i class="fa-solid fa-images text-xs"></i>
              </div>
              <div>
                <div class="text-xs font-bold text-slate-800">Pending Changes</div>
                <div class="text-[10px] text-slate-400">Photos uploaded on this device</div>
              </div>
            </div>
            <button 
              @click="handleCheckPending"
              class="px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 rounded-lg"
            >
              {{ isChecking ? 'Checking...' : (pendingCount !== null ? `${pendingCount} pending` : 'Check') }}
            </button>
          </div>

          <!-- Quick Unlock / Configure Form (if not configured or editing) -->
          <div v-if="!isConfigured || showTokenInput" class="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-3">
            <div class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <i class="fa-solid fa-key text-amber-500 text-xs"></i>
              Activate Device Sync
            </div>
            <p class="text-[11px] text-slate-500">
              Enter your admin password (<code>sahil123</code>) or paste your GitHub Personal Access Token below:
            </p>
            <div class="flex gap-2">
              <input 
                v-model="tokenInput"
                type="password"
                placeholder="sahil123 or ghp_..."
                class="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-blue-500 outline-none font-mono"
                @keyup.enter="handleActivate"
              />
              <button 
                @click="handleActivate"
                class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all active:scale-95"
              >
                Activate
              </button>
            </div>
          </div>

          <!-- Main Actions -->
          <div class="space-y-2 pt-1">
            <!-- Push Button -->
            <button 
              @click="handlePush"
              :disabled="isPushing"
              class="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2.5 transition-all active:scale-95 disabled:opacity-50"
            >
              <i class="fa-solid fa-cloud-arrow-up text-sm" :class="{ 'animate-bounce': isPushing }"></i>
              <span>{{ isPushing ? 'Committing to GitHub...' : 'Push Pending Photos to GitHub' }}</span>
            </button>

            <!-- Pull / Refresh Button -->
            <button 
              @click="handlePull"
              :disabled="isPulling"
              class="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <i class="fa-solid fa-arrows-rotate text-xs" :class="{ 'animate-spin': isPulling }"></i>
              <span>{{ isPulling ? 'Fetching latest catalog...' : 'Pull Fresh Catalog from GitHub' }}</span>
            </button>

            <!-- Tally Local Sync (PC only) -->
            <button 
              v-if="isLocalMachine"
              @click="handleTallySync"
              class="w-full py-3 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <i class="fa-solid fa-server text-xs"></i>
              <span>Sync Stock from Tally (Local PC)</span>
            </button>
          </div>

          <!-- Token toggle toggle/reset -->
          <div class="flex items-center justify-between pt-1 text-[11px] text-slate-400 px-1">
            <button 
              @click="showTokenInput = !showTokenInput"
              class="hover:text-slate-600 underline underline-offset-2"
            >
              {{ showTokenInput ? 'Hide key input' : (isConfigured ? 'Change sync key' : 'Paste manual token') }}
            </button>
            <span v-if="isConfigured" class="text-emerald-600 font-medium">✓ Ready for camera uploads</span>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { toast } from 'vue3-toastify';
import { hasGitHubToken, unlockSyncToken, setCustomGitHubToken } from '../../composables/useAdmin';
import { useStockData } from '../../composables/useStockData';

import { computed } from 'vue';
import { Capacitor } from '@capacitor/core';

const props = defineProps({
  show: Boolean
});

const emit = defineEmits(['close']);

const { pushPendingPhotosToGitHub, loadStockData, updateStockData, stockData } = useStockData();

const isLocalMachine = computed(() => {
  if (Capacitor.isNativePlatform()) return false;
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
});

const handleTallySync = async () => {
  if (updateStockData) {
    await updateStockData();
  }
};

const isConfigured = ref(false);
const showTokenInput = ref(false);
const tokenInput = ref('');
const isPushing = ref(false);
const isPulling = ref(false);
const isChecking = ref(false);
const pendingCount = ref(null);

const checkStatus = () => {
  isConfigured.value = hasGitHubToken();
};

onMounted(() => {
  checkStatus();
});

const handleActivate = async () => {
  const val = tokenInput.value.trim();
  if (!val) {
    toast.warning('Please enter password or token');
    return;
  }

  // Check if it looks like a GitHub PAT
  if (val.startsWith('ghp_') || val.startsWith('github_pat_')) {
    await setCustomGitHubToken(val);
    toast.success('✓ GitHub PAT saved to this device!');
    isConfigured.value = true;
    showTokenInput.value = false;
    tokenInput.value = '';
    return;
  }

  // Otherwise attempt to unlock using password
  const ok = await unlockSyncToken(val);
  if (ok) {
    toast.success('✓ Device Cloud Sync Activated!');
    isConfigured.value = true;
    showTokenInput.value = false;
    tokenInput.value = '';
  } else {
    toast.error('Invalid password or token. Please try again.');
  }
};

const handleCheckPending = async () => {
  isChecking.value = true;
  try {
    const REMOTE_DATA_URL = 'https://raw.githubusercontent.com/sahilsync07/sbe/refs/heads/main/frontend/public/assets/stock-data.json';
    const res = await fetch(`${REMOTE_DATA_URL}?_t=${Date.now()}`);
    if (res.ok) {
      const remote = await res.json();
      const remoteMap = new Map();
      remote.forEach(g => (g.products || []).forEach(p => remoteMap.set(p.productName, p)));

      let count = 0;
      (stockData.value || []).forEach(g => {
        (g.products || []).forEach(p => {
          if (p.imageUrl) {
            const r = remoteMap.get(p.productName);
            if (!r || r.imageUrl !== p.imageUrl) count++;
          }
        });
      });
      pendingCount.value = count;
      if (count === 0) {
        toast.info('0 pending changes. Remote is up to date.');
      } else {
        toast.info(`${count} photo(s) pending push to GitHub.`);
      }
    }
  } catch (e) {
    toast.error('Could not check remote catalog');
  } finally {
    isChecking.value = false;
  }
};

const handlePush = async () => {
  if (!isConfigured.value) {
    toast.warning('Please activate sync key on this device first.');
    showTokenInput.value = true;
    return;
  }

  isPushing.value = true;
  try {
    const res = await pushPendingPhotosToGitHub();
    if (res.success) {
      pendingCount.value = 0;
    }
  } finally {
    isPushing.value = false;
  }
};

const handlePull = async () => {
  isPulling.value = true;
  try {
    await loadStockData(true);
    toast.success('✓ Catalog reloaded from GitHub!');
  } finally {
    isPulling.value = false;
  }
};
</script>
