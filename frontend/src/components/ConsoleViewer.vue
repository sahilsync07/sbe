<template>
  <div class="flex flex-col h-full bg-slate-950 border-l border-slate-800 shadow-2xl font-mono text-[11px] overflow-hidden">
    <div class="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 shadow-sm shrink-0">
      <div class="flex items-center gap-2">
        <i class="fa-solid fa-terminal text-slate-400 text-xs"></i>
        <h2 class="text-xs font-bold text-slate-200 tracking-wider">SYSTEM LOGS</h2>
      </div>
      <button @click="clearLogs" class="text-slate-500 hover:text-red-400 transition-colors" title="Clear Logs">
        <i class="fa-solid fa-trash-can text-xs"></i>
      </button>
    </div>
    
    <div class="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar" ref="logsContainer">
      <div v-for="(log, idx) in logs" :key="idx" class="break-words font-medium leading-relaxed" :class="getLogColor(log.type)">
        <span class="opacity-50 mr-2 text-[9px] select-none">[{{ log.time }}]</span>
        <span class="whitespace-pre-wrap">{{ log.message }}</span>
      </div>
      <div v-if="logs.length === 0" class="text-slate-600 italic text-center mt-10">
        Waiting for logs...
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';

const logs = ref([]);
const logsContainer = ref(null);

const maxLogs = 500;

// Original console methods
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info
};

const formatArgs = (args) => {
  return args.map(arg => {
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg, null, 2);
      } catch (e) {
        return String(arg);
      }
    }
    return String(arg);
  }).join(' ');
};

const addLog = (type, args) => {
  const message = formatArgs(args);
  const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second:'2-digit' });
  
  logs.value.push({ type, message, time });
  if (logs.value.length > maxLogs) {
    logs.value.shift();
  }
  
  nextTick(() => {
    if (logsContainer.value) {
      logsContainer.value.scrollTop = logsContainer.value.scrollHeight;
    }
  });
};

const clearLogs = () => {
  logs.value = [];
};

const getLogColor = (type) => {
  switch(type) {
    case 'error': return 'text-red-400';
    case 'warn': return 'text-amber-400';
    case 'info': return 'text-blue-400';
    default: return 'text-slate-300';
  }
};

onMounted(() => {
  console.log = function(...args) {
    addLog('log', args);
    originalConsole.log.apply(console, args);
  };
  console.warn = function(...args) {
    addLog('warn', args);
    originalConsole.warn.apply(console, args);
  };
  console.error = function(...args) {
    addLog('error', args);
    originalConsole.error.apply(console, args);
  };
  console.info = function(...args) {
    addLog('info', args);
    originalConsole.info.apply(console, args);
  };
});

onUnmounted(() => {
  // Restore original console
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.info = originalConsole.info;
});
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #334155;
  border-radius: 10px;
}
</style>
