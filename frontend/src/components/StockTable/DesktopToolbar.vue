
<template>
  <div>
    <!-- Desktop Toolbar (Hidden on Mobile) -->
    <header 
      class="hidden lg:block fixed inset-x-0 top-0 z-[60] bg-black/90 backdrop-blur-md border-b border-white/10 shadow-sm transition-all duration-300 safe-area-top-fixed rounded-b-3xl"
    >
      <!-- Inner content wrapper with fixed height -->
      <div class="h-[72px] flex items-center justify-between px-6">
       <!-- Left Section: Sidebar, Sync, Search -->
       <div class="flex items-center gap-4 flex-1 min-w-0 mr-4">
          <!-- Sidebar Toggle -->
          <button
            @click="$emit('toggleSidebar')"
            class="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-900 text-slate-400 hover:bg-blue-600 hover:text-white transition-all active:scale-95 shrink-0"
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
               class="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-900 text-slate-400 hover:bg-neutral-800 hover:text-blue-500 transition-all border border-white/5"
               title="Sync Data"
            >
              <i class="fa-solid fa-rotate" :class="{ 'animate-spin': loading }"></i>
            </button>
             <button
              v-if="isSuperAdmin"
              @click="$emit('toggleLedgerView')"
              class="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-900 text-slate-400 hover:bg-neutral-800 transition-colors border border-white/5"
              title="Ledger View"
            >
               <i class="fa-solid fa-book-open"></i>
            </button>
          </div>

          <!-- Search Bar (Flexible) -->
          <div class="relative flex-1 max-w-sm group">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-400 transition-colors">
                 <i class="fa-solid fa-magnifying-glass text-sm"></i>
              </span>
              <input
                :value="localQuery"
                @input="handleSearchInput"
                type="text"
                placeholder="Search..."
                class="w-full pl-10 pr-4 py-2.5 rounded-full bg-neutral-900 border border-white/20 ring-1 ring-white/10 focus:bg-black focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all text-sm font-medium text-white placeholder-slate-400"
              />
          </div>
       </div>

       <!-- Center Section: Logo (Absolute) -->
       <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 pointer-events-none">
          <h1 
               class="text-2xl font-semibold tracking-tighter text-white select-none pointer-events-auto cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
               @click="$emit('promptAdminLogin')"
               title="Admin Login"
             >
               <span class="text-white font-['Clash_Display'] font-bold text-3xl tracking-wide uppercase">{{ companyFirstName }}</span>
               <span class="text-slate-400 font-['Clash_Display'] font-light text-3xl tracking-wide ml-1.5">{{ companyRestName }}</span>
          </h1>
          <!-- Status Pill -->
          <div class="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 bg-neutral-900 border border-white/10 px-2 py-0.5 rounded-full shadow-sm">
               <span class="w-1.5 h-1.5 rounded-full" :class="statusColor"></span>
               <span>{{ formattedLastRefresh || 'Offline' }}</span>
          </div>
       </div>

       <!-- Right Section: PDF, Toggles, Cart -->
       <div class="flex items-center gap-4 flex-1 justify-end ml-4">
           <!-- PDF Gen -->
           <button
              v-if="isAdmin"
              @click="$router.push('/pdf-gen')"
              class="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-900 text-slate-400 hover:bg-neutral-800 hover:text-red-500 transition-all border border-white/5 shrink-0"
              title="Generate PDF"
            >
              <i class="fa-solid fa-file-pdf"></i>
           </button>

           <!-- Toggles -->
           <div class="flex items-center gap-2">
               <button 
                  @click="$emit('update:cleanView', !cleanView)"
                  class="w-10 h-10 flex items-center justify-center rounded-xl border transition-all duration-300"
                  :class="cleanView ? 'bg-gradient-to-br from-slate-200 to-slate-300 border-slate-400 text-black shadow-md' : 'bg-neutral-900 border-white/5 text-slate-400 hover:bg-neutral-800 hover:text-slate-200'"
                  title="Clean View (Images Only & In Stock)"
               >
                  <i class="fa-solid fa-wand-magic-sparkles text-sm transition-all duration-500"></i>
               </button>
           </div>

           <!-- Cart -->
           <button
             @click="$emit('toggleCart')"
             class="relative w-11 h-11 flex items-center justify-center rounded-full bg-white text-black hover:bg-slate-200 transition-all shadow-lg shadow-white/10 active:scale-95 shrink-0"
             :class="{ 'opacity-0 pointer-events-none': showSidePanel }"
           >
             <i v-if="showCart" class="fa-solid fa-xmark text-lg"></i>
             <div v-else class="flex items-center justify-center w-full h-full">
                <div v-if="cartTotalItems > 0" class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full shadow-sm z-10 ring-2 ring-black">{{ cartTotalItems }}</div>
                <i class="fa-solid fa-bag-shopping text-base"></i>
             </div>
           </button>
       </div>
      </div>
    </header>


    <!-- Mobile Top Bar (Visible on Mobile) -->
    <header 
      class="lg:hidden fixed inset-x-0 top-0 z-[60] bg-black/90 backdrop-blur-md border-b border-white/10 shadow-sm transition-all"
      style="padding-top: env(safe-area-inset-top, 20px)"
    >
      <!-- Inner content wrapper with fixed height -->
      <div class="h-[54px] flex items-center justify-between px-4 relative">
         <!-- Left: Sidebar + Cache Button (Android + Admin) -->
         <div class="flex items-center gap-2">
            <!-- Sidebar Toggle -->
            <button
               @click="$emit('toggleSidebar')"
               class="w-9 h-9 flex items-center justify-center rounded-full bg-neutral-900 text-slate-400 active:bg-blue-600 active:text-white transition-all"
            >
               <i v-if="showSidePanel" class="fa-solid fa-house text-sm"></i>
               <i v-else class="fa-solid fa-bars text-sm"></i>
            </button>

            <!-- Offline Cache Button (Android Only + Admin Only) -->
            <button
               v-if="isAdmin || isSuperAdmin"
               @click="$emit('cacheImages')"
               class="android-only-btn w-9 h-9 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md active:scale-95 transition-all relative overflow-hidden"
               :class="{ 'animate-pulse': isCachingImages }"
               :disabled="isCachingImages"
               title="Download Images for Offline"
            >
               <i v-if="isCachingImages" class="fa-solid fa-spinner fa-spin text-sm"></i>
               <i v-else class="fa-solid fa-cloud-arrow-down text-sm"></i>
            </button>
         </div>

         <!-- Center: Logo (Smaller in Admin Mode) -->
         <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
            <h1 
               class="text-lg font-semibold tracking-tighter text-white select-none flex items-center gap-1 pointer-events-auto cursor-pointer transition-all"
               :class="(isAdmin || isSuperAdmin) ? 'text-lg' : 'text-2xl'"
               @click="$emit('promptAdminLogin')"
             >
               <span class="text-white font-['Clash_Display'] font-bold tracking-wide uppercase" :class="(isAdmin || isSuperAdmin) ? 'text-lg' : 'text-2xl'">{{ companyFirstName }}</span>
               <span class="text-slate-400 font-['Clash_Display'] font-light tracking-wide ml-1" :class="(isAdmin || isSuperAdmin) ? 'text-lg' : 'text-2xl'">{{ companyRestName }}</span>
            </h1>
            <div class="flex items-center gap-1.5 mt-0.5">
                <span class="w-1.5 h-1.5 rounded-full" :class="statusColor"></span>
                <span class="text-[9px] font-medium text-slate-400">{{ formattedLastRefresh || 'Offline' }}</span>
            </div>
         </div>

         <!-- Right: Refresh (Android), PDF & Cart -->
         <div class="flex items-center gap-2">


            <button
               v-if="isAdmin"
               @click="$router.push('/pdf-gen')"
               class="w-9 h-9 flex items-center justify-center rounded-full bg-neutral-900 text-slate-400 border border-white/10"
            >
              <i class="fa-solid fa-file-pdf"></i>
           </button>

           <button
             @click="$emit('toggleCart')"
             class="relative w-9 h-9 flex items-center justify-center rounded-full bg-white text-black shadow-md active:scale-95"
           >
             <div v-if="cartTotalItems > 0" class="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full ring-2 ring-black">{{ cartTotalItems }}</div>
             <i class="fa-solid fa-cart-shopping text-xs"></i>
           </button>
         </div>
      </div>
    </header>


    <!-- Mobile Bottom Bar (Fixed) -->
    <div class="lg:hidden fixed bottom-0 left-0 w-full z-[60] bg-black border-t border-white/10 p-3 pb-[max(env(safe-area-inset-bottom),12px)] shadow-[0_-4px_20px_rgba(255,255,255,0.05)] rounded-t-3xl">
       <div class="flex items-center gap-3">
          <!-- Search -->
          <div class="relative flex-1">
             <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">
                 <i class="fa-solid fa-magnifying-glass text-xs"></i>
             </span>
             <input
                :value="localQuery"
                @input="handleSearchInput"
                type="text"
                placeholder="Search products..."
                class="w-full pl-9 pr-3 py-2.5 rounded-xl bg-neutral-900 border border-white/20 ring-1 ring-white/10 focus:bg-black focus:ring-2 focus:ring-blue-500/50 transition-all text-sm font-medium text-white placeholder-slate-400"
              />
          </div>

           <!-- Toggles & Actions -->
           <div class="flex items-center gap-2 shrink-0">
               <!-- Android Refresh (Moved here) -->
               <button
                  class="android-only-btn w-10 h-10 items-center justify-center rounded-xl bg-white text-black border border-slate-200 shadow-md active:scale-95 transition-all hidden"
                  @click="$emit('refreshData')"
                  :disabled="isRefreshing"
                  title="Refresh Data"
               >
                 <i v-if="isRefreshing" class="fa-solid fa-spinner fa-spin text-sm"></i>
                 <i v-else class="fa-solid fa-arrows-rotate text-sm"></i>
               </button>

               <button 
                  @click="$emit('update:cleanView', !cleanView)"
                  class="w-10 h-10 rounded-xl flex items-center justify-center transition-all relative border overflow-hidden"
                  :class="cleanView ? 'bg-gradient-to-br from-slate-200 to-slate-300 border-slate-400 text-black shadow-md' : 'bg-neutral-900 border-white/10 text-slate-400'"
                  title="Clean View"
               >
                  <i class="fa-solid fa-wand-magic-sparkles text-sm transition-all duration-500"></i>
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
  cleanView: Boolean,
  cloudName: String,
  isRefreshing: {
    type: Boolean,
    default: false
  },
  isCachingImages: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  'toggleSidebar', 
  'toggleCart', 
  'updateStockData', 
  'toggleLedgerView', 
  'promptAdminLogin',
  'update:searchQuery',
  'update:cleanView',
  'cacheImages',
  'refreshData'
]);

const companyFirstName = computed(() => props.companyName.split(' ')[0]);
const companyRestName = computed(() => {
  const rest = props.companyName.split(' ').slice(1).join(' ');
  // Convert to Title Case: "RAYAGADA" -> "Rayagada"
  return rest.charAt(0).toUpperCase() + rest.slice(1).toLowerCase();
});
const formattedLastRefresh = computed(() => {
  if (!props.lastRefresh) return "";
  const date = new Date(props.lastRefresh);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);
  const diffInDays = Math.floor(diffInHours / 24);

  let timeString = "";
  if (diffInHours <= 7) timeString = "Recently";
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

const statusColor = computed(() => {
  if (!props.lastRefresh) return "bg-rose-500"; // Offline/No Data
  const date = new Date(props.lastRefresh);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);
  const diffInDays = diffInHours / 24;

  if (diffInDays < 1) return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]";   // Fresh (< 1 day) - Green
  if (diffInDays <= 3) return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]";    // Stale (1-3 days) - Yellow
  return "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]";                           // Old (> 3 days) - Red
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
