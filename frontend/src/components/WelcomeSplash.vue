
<template>
  <div class="flex flex-col items-center justify-center w-full h-[80vh] animate-fade-in-up">
    <div class="text-center space-y-4">
      <p class="text-slate-400 text-sm font-medium uppercase tracking-widest">Welcome to</p>
      
      <h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight leading-tight px-4">
        M/S Sri Brundabana Enterprises
      </h1>
      
      <h2 class="text-xl sm:text-2xl font-bold text-slate-700">
        Rayagada
      </h2>

      <div class="pt-4">
        <div 
          class="inline-flex items-center px-4 py-2 rounded-full border shadow-sm animate-pulse-slow"
          :class="isOnline ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'"
        >
           <div 
             class="w-2 h-2 rounded-full mr-2 animate-ping-slow"
             :class="isOnline ? 'bg-green-500' : 'bg-orange-500'"
           ></div>
           <span 
             class="text-xs sm:text-sm font-bold uppercase tracking-wide"
             :class="isOnline ? 'text-green-700' : 'text-orange-700'"
           >{{ isOnline ? 'Online Mode' : 'Offline Mode' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const isOnline = ref(navigator.onLine);

const updateOnlineStatus = () => {
  isOnline.value = navigator.onLine;
};

onMounted(() => {
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
});

onBeforeUnmount(() => {
  window.removeEventListener('online', updateOnlineStatus);
  window.removeEventListener('offline', updateOnlineStatus);
});
</script>

<style scoped>
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.8s ease-out forwards;
}

@keyframes pingSlow {
  0% { transform: scale(1); opacity: 1; }
  75%, 100% { transform: scale(1.5); opacity: 0; }
}

.animate-ping-slow {
  animation: pingSlow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
}
</style>
