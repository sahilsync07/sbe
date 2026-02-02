
<template>
  <header
    class="sticky top-0 z-[60] w-full bg-white/80 backdrop-blur-md border-b border-slate-200/50 transition-all duration-300 pb-3 pt-[max(env(safe-area-inset-top),16px)] shadow-soft"
  >
    <div class="w-full px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col gap-3">
        <!-- Top Row: Buttons & Title -->
        <div class="flex items-center justify-between">
          <!-- Left: Sidebar Toggle & Sync -->
          <div class="flex items-center gap-3">
             <button
              @click="$emit('toggleSidebar')"
              class="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600/90 text-white hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/30 active:scale-95 border border-white/10"
              :class="{ 'opacity-0 pointer-events-none': showCart }"
            >
              <i v-if="showSidePanel" class="fa-solid fa-house text-sm animate-fade-in"></i>
              <i v-else class="fa-solid fa-bars text-sm animate-fade-in"></i>
            </button>

            <button
              v-if="isAdmin && !isSuperAdmin"
              @click="$emit('updateStockData')"
              class="hidden sm:flex w-9 h-9 items-center justify-center rounded-full bg-slate-100/50 hover:bg-slate-100 text-slate-600 transition-all active:scale-95"
              title="Sync Data"
            >
              <i class="fa-solid fa-rotate" :class="{ 'animate-spin': loading }"></i>
            </button>
            
            <button
              v-if="isSuperAdmin"
              @click="$emit('toggleLedgerView')"
              class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
              title="Ledger View"
            >
               <i class="fa-solid fa-book-open text-slate-500"></i>
            </button>
          </div>

          <!-- Center: Title -->
          <div class="flex flex-col items-center justify-center">
            <h1 
              class="text-xl sm:text-2xl font-semibold tracking-tighter text-slate-900 select-none cursor-pointer flex items-center gap-1.5"
              @click="$emit('promptAdminLogin')"
              title="Admin Login"
            >
              <span class="text-blue-600 font-bold">{{ companyFirstName }}</span>
              <span class="font-medium">{{ companyRestName }}</span>
            </h1>
            <div class="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full mt-1">
               <span class="w-1.5 h-1.5 rounded-full" :class="lastRefresh ? 'bg-green-500' : 'bg-slate-300'"></span>
               <span>{{ formattedLastRefresh || 'Offline' }}</span>
            </div>
          </div>

          <!-- Right: Cart -->
          <div class="flex items-center justify-end gap-2">
             <button
               @click="$emit('toggleCart')"
               class="relative w-10 h-10 flex items-center justify-center rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95"
               :class="{ 'opacity-0 pointer-events-none': showSidePanel }"
               title="Toggle Cart"
             >
               <i v-if="showCart" class="fa-solid fa-xmark text-lg animate-fade-in"></i>
               <div v-else class="flex items-center justify-center w-full h-full animate-fade-in">
                  <div v-if="cartTotalItems > 0" class="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full shadow-sm z-10 ring-2 ring-white">{{ cartTotalItems }}</div>
                  <i class="fa-solid fa-bag-shopping text-sm"></i>
               </div>
             </button>
          </div>
        </div>

        <!-- Bottom Row: Search & Filters -->
        <div class="flex items-center gap-3">
           <!-- Integrated Search Bar -->
           <div class="relative flex-1 group">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                 <i class="fa-solid fa-magnifying-glass text-sm"></i>
              </span>
              <input
                :value="localQuery"
                @input="handleSearchInput"
                type="text"
                placeholder="Search products..."
                class="w-full pl-10 pr-4 py-2.5 rounded-full bg-slate-100/80 border border-slate-200/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white focus:border-blue-500 transition-all text-sm font-medium shadow-sm"
              />
           </div>

            <!-- Action Buttons Group -->
            <div class="flex items-center gap-2">
                <button
                  v-if="isAdmin"
                  @click="$router.push('/pdf-gen')"
                  class="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 transition-all border border-slate-200"
                  title="Generate Catalog PDF"
                >
                  <i class="fa-solid fa-file-pdf text-red-500"></i>
                </button>

                <!-- Filters -->
                <div class="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200/60">
                     <!-- Negative Stock Toggle -->
                     <button 
                        @click="$emit('update:hideNegativeStocks', !hideNegativeStocks)"
                        class="w-9 h-9 rounded-full flex items-center justify-center transition-all relative"
                        :class="hideNegativeStocks ? 'bg-white shadow text-red-600' : 'text-slate-400 hover:text-slate-600'"
                        title="Hide Negative Stocks"
                     >
                        <i class="fa-solid fa-boxes-stacked text-xs"></i>
                        <span v-if="hideNegativeStocks" class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"></span>
                     </button>
                     
                     <!-- Image Toggle -->
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
            </div>
        </div>
      </div>
    </div>
  </header>
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
