<template>
  <transition 
    enter-active-class="transition duration-200 ease-out" 
    enter-from-class="opacity-0 scale-95" 
    enter-to-class="opacity-100 scale-100" 
    leave-active-class="transition duration-150 ease-in" 
    leave-from-class="opacity-100 scale-100" 
    leave-to-class="opacity-0 scale-95"
  >
    <div v-if="isTokenModalOpen" class="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="handleCancel"></div>

      <!-- Modal Card -->
      <div class="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        <!-- Header -->
        <div class="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <i class="fa-brands fa-github text-xl"></i>
            </div>
            <div>
              <h3 class="text-base font-extrabold text-slate-900 leading-tight">GitHub Token Required</h3>
              <p class="text-[11px] text-slate-500 font-medium">Cloud sync for mobile photos</p>
            </div>
          </div>
          <button 
            @click="handleCancel"
            class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
          >
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 space-y-4">
          <!-- Reason / Status Alert -->
          <div 
            v-if="tokenModalReason === 'expired'"
            class="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5 font-medium leading-relaxed"
          >
            <i class="fa-solid fa-triangle-exclamation text-rose-500 text-sm mt-0.5 shrink-0"></i>
            <div>
              <span class="font-bold">Token Expired or Unauthorized (401)</span>
              <p class="text-[11px] text-rose-700 mt-0.5">Your previous GitHub token was rejected. Please enter a valid token to commit photos.</p>
            </div>
          </div>
          <div 
            v-else
            class="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5 font-medium leading-relaxed"
          >
            <i class="fa-solid fa-cloud-arrow-up text-amber-600 text-sm mt-0.5 shrink-0"></i>
            <div>
              <span class="font-bold">Local Server Offline</span>
              <p class="text-[11px] text-amber-800 mt-0.5">To commit photo changes directly from your phone to GitHub without a PC, a GitHub Personal Access Token is needed.</p>
            </div>
          </div>

          <!-- Token Input Form -->
          <form class="space-y-4" autocomplete="off" @submit.prevent="handleSubmit">
            <div>
              <div class="flex items-center justify-between mb-1">
                <label for="github-pat-token-input" class="block text-xs font-bold text-slate-700">GitHub Personal Access Token</label>
                <button 
                  type="button"
                  @click="useDefaultToken"
                  class="text-[11px] font-bold text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-1 active:scale-95 transition-all"
                  title="Autofill verified system token"
                >
                  <i class="fa-solid fa-wand-magic-sparkles text-[10px]"></i>
                  <span>Use Default Token</span>
                </button>
              </div>

              <div class="relative">
                <input 
                  ref="tokenInputRef"
                  id="github-pat-token-input"
                  name="github-token"
                  v-model="tokenValue"
                  :type="showToken ? 'text' : 'password'"
                  placeholder="ghp_..."
                  autocomplete="off"
                  autocapitalize="off"
                  spellcheck="false"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none transition-all font-mono text-xs text-slate-800 placeholder:text-slate-400 pr-10"
                />
                <button 
                  type="button"
                  @click="showToken = !showToken"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <i :class="['fas', showToken ? 'fa-eye-slash' : 'fa-eye', 'text-xs']"></i>
                </button>
              </div>
              <p class="text-[10px] text-slate-400 mt-1">Requires <code>repo</code> write permission to commit stock-data.json.</p>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2.5 pt-2">
              <button 
                type="button"
                @click="handleCancel"
                class="flex-1 py-2.5 px-4 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors active:scale-95"
              >
                Skip / Later
              </button>
              <button 
                type="submit"
                :disabled="!tokenValue.trim()"
                class="flex-1 py-2.5 px-4 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 shadow-md shadow-slate-900/10 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <i class="fa-solid fa-check text-xs text-emerald-400"></i>
                <span>Save & Sync</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { useGitHubTokenModal, DEFAULT_GITHUB_TOKEN } from '../../composables/useGitHubTokenModal';

const { isTokenModalOpen, tokenModalReason, handleSaveToken, handleCloseTokenModal } = useGitHubTokenModal();

const tokenValue = ref('');
const showToken = ref(false);
const tokenInputRef = ref(null);

watch(isTokenModalOpen, (isOpen) => {
  if (isOpen) {
    const existing = localStorage.getItem('sbe_github_token') || '';
    tokenValue.value = existing;
    nextTick(() => {
      tokenInputRef.value?.focus();
    });
  } else {
    showToken.value = false;
  }
});

const useDefaultToken = () => {
  tokenValue.value = DEFAULT_GITHUB_TOKEN;
  showToken.value = true;
};

const handleSubmit = async () => {
  if (!tokenValue.value.trim()) return;
  await handleSaveToken(tokenValue.value.trim());
};

const handleCancel = () => {
  handleCloseTokenModal();
};
</script>
