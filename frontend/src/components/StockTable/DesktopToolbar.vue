
<template>
  <div>
    <!-- Desktop Toolbar (Hidden on Mobile) -->
    <header class="hidden md:flex fixed top-0 inset-x-0 z-[60] bg-white/90 backdrop-blur-md border-b border-slate-200/50 shadow-sm transition-all duration-300 h-[72px] px-6 items-center justify-between">
       <!-- Left Section: Sidebar, Sync, Search -->
       <div class="flex items-center gap-4 flex-1 min-w-0 mr-4">
          <!-- Sidebar Toggle -->
          <button
            @click="$emit('toggleSidebar')"
            class="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white transition-all active:scale-95 shrink-0"
            :class="{ 'opacity-0 pointer-events-none': showCart }"
          >
             <i v-if="showSidePanel" class="fa-solid fa-house text-sm"></i>
             <i v-else class="fa-solid fa-bars text-sm"></i>
          </button>

          <!-- Sync/Ledger (Admin) -->
          <div class="flex items-center gap-2 shrink-0">
            <button
               v-if="isAdmin && !isSuperAdmin"
               @click="$emit('updateStockData')"
               class="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-all border border-slate-200"
               title="Sync Data"
            >
              <i class="fa-solid fa-rotate" :class="{ 'animate-spin': loading }"></i>
            </button>
             <button
              v-if="isSuperAdmin"
              @click="$emit('toggleLedgerView')"
              class="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors border border-slate-200"
              title="Ledger View"
            >
               <i class="fa-solid fa-book-open"></i>
            </button>
          </div>

          <!-- Search Bar (Flexible) -->
          <div class="relative flex-1 max-w-sm group">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                 <i class="fa-solid fa-magnifying-glass text-sm"></i>
              </span>
              <input
                :value="localQuery"
                @input="handleSearchInput"
                type="text"
                placeholder="Search..."
                class="w-full pl-10 pr-4 py-2.5 rounded-full bg-slate-100/50 border border-slate-200/60 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all text-sm font-medium"
              />
          </div>
       </div>

       <!-- Center Section: Logo (Absolute) -->
       <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 pointer-events-none">
          <h1 
               class="text-2xl font-semibold tracking-tighter text-slate-900 select-none pointer-events-auto cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
               @click="$emit('promptAdminLogin')"
               title="Admin Login"
             >
               <span class="text-blue-600 font-bold">{{ companyFirstName }}</span>
               <span class="font-medium">{{ companyRestName }}</span>
          </h1>
          <!-- Status Pill -->
          <div class="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full shadow-sm">
               <span class="w-1.5 h-1.5 rounded-full" :class="lastRefresh ? 'bg-green-500' : 'bg-slate-300'"></span>
               <span>{{ formattedLastRefresh || 'Offline' }}</span>
          </div>
       </div>

       <!-- Right Section: PDF, Toggles, Cart -->
       <div class="flex items-center gap-4 flex-1 justify-end ml-4">
           <!-- PDF Gen -->
           <button
              v-if="isAdmin"
              @click="$router.push('/pdf-gen')"
              class="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-red-500 transition-all border border-slate-200 shrink-0"
              title="Generate PDF"
            >
              <i class="fa-solid fa-file-pdf"></i>
           </button>

           <!-- Toggles -->
           <div class="flex items-center bg-slate-100/80 p-1 rounded-full border border-slate-200">
               <button 
                  @click="$emit('update:hideNegativeStocks', !hideNegativeStocks)"
                  class="w-9 h-9 rounded-full flex items-center justify-center transition-all relative"
                  :class="hideNegativeStocks ? 'bg-white shadow text-red-600' : 'text-slate-400 hover:text-slate-600'"
                  title="Hide Negative Stocks"
               >
                  <i class="fa-solid fa-boxes-stacked text-xs"></i>
                  <span v-if="hideNegativeStocks" class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"></span>
               </button>
               
               <button 
                  @click="$emit('update:showImagesOnly', !showImagesOnly)"
                  class="w-9 h-9 rounded-full flex items-center justify-center transition-all relative"
                  :class="showImagesOnly ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-600'"
                  title="Show Images Only"
               >
                  <i class="fa-solid fa-image text-xs"></i>
                  <span v-if="showImagesOnly" class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-600 rounded-full ring-2 ring-white"></span>
               </button>
           </div>

           <!-- Cart -->
           <button
             @click="$emit('toggleCart')"
             class="relative w-11 h-11 flex items-center justify-center rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95 shrink-0"
             :class="{ 'opacity-0 pointer-events-none': showSidePanel }"
           >
             <i v-if="showCart" class="fa-solid fa-xmark text-lg"></i>
             <div v-else class="flex items-center justify-center w-full h-full">
                <div v-if="cartTotalItems > 0" class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full shadow-sm z-10 ring-2 ring-white">{{ cartTotalItems }}</div>
                <i class="fa-solid fa-bag-shopping text-base"></i>
             </div>
           </button>
       </div>
    </header>


    <!-- Mobile Top Bar (Visible on Mobile) -->
    <header class="md:hidden fixed top-0 inset-x-0 z-[60] bg-white/90 backdrop-blur-md border-b border-slate-200/50 shadow-sm h-[60px] flex items-center justify-between px-4 transition-all">
         <!-- Left: Sidebar -->
         <button
            @click="$emit('toggleSidebar')"
            class="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 active:bg-blue-600 active:text-white transition-all"
         >
             <i v-if="showSidePanel" class="fa-solid fa-house text-sm"></i>
             <i v-else class="fa-solid fa-bars text-sm"></i>
          </button>

         <!-- Center: Logo -->
         <div class="flex flex-col items-center">
            <h1 
               class="text-lg font-semibold tracking-tighter text-slate-900 select-none flex items-center gap-1"
               @click="$emit('promptAdminLogin')"
             >
               <span class="text-blue-600 font-bold">{{ companyFirstName }}</span>
               <span class="font-medium">{{ companyRestName }}</span>
            </h1>
            <span class="text-[9px] font-medium text-slate-400">{{ formattedLastRefresh || 'Offline' }}</span>
         </div>

         <!-- Right: PDF & Cart -->
         <div class="flex items-center gap-2">
            <button
               v-if="isAdmin"
               @click="$router.push('/pdf-gen')"
               class="w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 border border-slate-100"
            >
              <i class="fa-solid fa-file-pdf"></i>
           </button>

           <button
             @click="$emit('toggleCart')"
             class="relative w-9 h-9 flex items-center justify-center rounded-full bg-slate-900 text-white shadow-md active:scale-95"
           >
             <div v-if="cartTotalItems > 0" class="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full ring-2 ring-white">{{ cartTotalItems }}</div>
             <i class="fa-solid fa-bag-shopping text-xs"></i>
           </button>
         </div>
    </header>


    <!-- Mobile Bottom Bar (Fixed) -->
    <div class="md:hidden fixed bottom-0 left-0 w-full z-[60] bg-white border-t border-slate-200/80 p-3 pb-[max(env(safe-area-inset-bottom),12px)] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
       <div class="flex items-center gap-3">
          <!-- Search -->
          <div class="relative flex-1">
             <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                 <i class="fa-solid fa-magnifying-glass text-xs"></i>
             </span>
             <input
                :value="localQuery"
                @input="handleSearchInput"
                type="text"
                placeholder="Search products..."
                class="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-100 border-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-medium"
              />
          </div>

          <!-- Toggles -->
           <div class="flex items-center bg-slate-100 p-1 rounded-lg shrink-0">
               <button 
                  @click="$emit('update:hideNegativeStocks', !hideNegativeStocks)"
                  class="w-9 h-9 rounded-md flex items-center justify-center transition-all relative"
                  :class="hideNegativeStocks ? 'bg-white shadow-sm text-red-600' : 'text-slate-400'"
               >
                  <i class="fa-solid fa-boxes-stacked text-xs"></i>
               </button>
               <div class="w-px h-4 bg-slate-200 mx-0.5"></div>
               <button 
                  @click="$emit('update:showImagesOnly', !showImagesOnly)"
                  class="w-9 h-9 rounded-md flex items-center justify-center transition-all relative"
                  :class="showImagesOnly ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'"
               >
                  <i class="fa-solid fa-image text-xs"></i>
               </button>
           </div>
       </div>
    </div>

  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  isAdmin: Boolean,
  isSuperAdmin: Boolean,
  loading: Boolean,
  showSidePanel: Boolean,
  showCart: Boolean,
  companyName: {
    type: String,
    default: ''
  },
  lastRefresh: [Date, String, Object],
  cartTotalItems: Number,
  searchQuery: String,
  showImagesOnly: Boolean,
  hideNegativeStocks: Boolean,
  cloudName: String
});

const emit = defineEmits([
  'toggleSidebar', 
  'toggleCart', 
  'updateStockData', 
  'toggleLedgerView', 
  'promptAdminLogin',
  'update:searchQuery',
  'update:showImagesOnly',
  'update:hideNegativeStocks',
  'cacheImages'
]);

const companyFirstName = computed(() => props.companyName.split(' ')[0]);
const companyRestName = computed(() => props.companyName.split(' ').slice(1).join(' '));
const formattedLastRefresh = computed(() => {
  if (!props.lastRefresh) return "";
  const date = new Date(props.lastRefresh);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);
  const diffInDays = Math.floor(diffInHours / 24);

  let timeString = "";
  if (diffInHours < 1) timeString = "Recently";
  else if (diffInHours < 24) timeString = `${Math.floor(diffInHours)} hours ago`;
  else if (diffInDays < 7) timeString = `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  else {
      timeString = date.toLocaleString("en-IN", { 
          day: 'numeric',
          month: 'short'
      });
  }
  return `Last Synced ${timeString}`;
});

// --- Debounce Search Logic ---
const localQuery = ref(props.searchQuery);
let debounceTimeout = null;

const handleSearchInput = (event) => {
  const value = event.target.value;
  localQuery.value = value;
  
  if (debounceTimeout) clearTimeout(debounceTimeout);
  
  debounceTimeout = setTimeout(() => {
    emit('update:searchQuery', value);
  }, 300); // 300ms wait
};

// Sync external changes (e.g. clear search from parent)
watch(() => props.searchQuery, (newVal) => {
  if (newVal !== localQuery.value) {
    localQuery.value = newVal;
  }
});
</script>
