
<template>
    <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
      <div v-if="show" class="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>
        <div class="relative bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
          <div class="p-6">
            <h3 class="text-xl font-bold text-slate-800 mb-2">Admin Login</h3>
            <p class="text-sm text-slate-500 mb-6">Enter the password to access admin features.</p>
            
            <div class="space-y-4">
               <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                  <input 
                    v-model="password"
                    type="password" 
                    placeholder="Enter password"
                    @keyup.enter="handleLogin"
                    class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
                  >
               </div>
            </div>

            <div class="flex gap-3 mt-8">
               <button 
                 @click="$emit('close')"
                 class="flex-1 py-3 px-4 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
               >
                 Cancel
               </button>
               <button 
                 @click="handleLogin"
                 class="flex-1 py-3 px-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-900/10 transition-all active:scale-95"
               >
                 Login
               </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
    show: Boolean
});

const emit = defineEmits(['close', 'login']);

const password = ref('');

const handleLogin = () => {
    emit('login', password.value);
    password.value = ''; // Clear after attempt
};
</script>
