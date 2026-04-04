<template>
  <Transition name="fade">
    <div v-if="isLoginModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div 
        @click="isLoginModalOpen = false"
        class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      ></div>

      <!-- Modal Content -->
      <div 
        class="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all animate-spring-up"
      >
        <div class="px-6 pt-8 pb-6">
          <div class="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
            <i class="fa-solid fa-lock text-3xl"></i>
          </div>
          
          <h2 class="text-2xl font-black text-slate-800 text-center tracking-tight mb-2">Admin Login</h2>
          <p class="text-xs font-bold text-slate-500 text-center uppercase tracking-widest mb-8">Enter access password</p>

          <form @submit.prevent="handleSubmit" class="space-y-4" autocomplete="off">
            <div class="relative group">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <i class="fa-solid fa-key"></i>
              </span>
              <input 
                ref="passwordInput"
                id="global-admin-login-password"
                name="password"
                type="password" 
                v-model="password"
                placeholder="••••••••"
                autocomplete="current-password"
                autocapitalize="off"
                spellcheck="false"
                data-bwignore="true"
                data-lpignore="true"
                data-1p-ignore="true"
                autofocus
                class="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-mono font-bold text-lg"
              />
            </div>

            <button 
              type="submit"
              :disabled="loading"
              class="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-200 hover:bg-black active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              <span v-if="loading" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span v-else>Authorize Access</span>
            </button>
          </form>

          <button 
            @click="isLoginModalOpen = false"
            class="w-full mt-4 py-2 text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { useAdmin } from '../composables/useAdmin';

const { isLoginModalOpen, login } = useAdmin();
const password = ref('');
const loading = ref(false);
const passwordInput = ref(null);

const handleSubmit = async () => {
    if (!password.value) return;
    loading.value = true;
    const success = await login(password.value);
    loading.value = false;
    if (success) {
        password.value = '';
    } else {
        // Vibrate or shake effect could go here
    }
};

// Auto-focus when opened
watch(isLoginModalOpen, (isOpen) => {
    if (isOpen) {
        password.value = '';
        nextTick(() => {
            passwordInput.value?.focus();
        });
    }
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes spring-up {
  0% { transform: translateY(20px) scale(0.95); opacity: 0; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}

.animate-spring-up {
  animation: spring-up 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}
</style>
