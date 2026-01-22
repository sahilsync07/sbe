
<template>
  <header
    class="sticky top-0 z-[60] w-full bg-white border-b border-slate-200 transition-all duration-300 pb-2 pt-[max(env(safe-area-inset-top),20px)]"
  >
    <div class="w-full px-2 sm:px-6 lg:px-8">
      <div class="flex flex-col gap-2">
        <!-- Top Row: Buttons & Title -->
        <div class="flex items-center justify-between">
          <!-- Left: Sidebar Toggle & Sync -->
          <div class="flex items-center gap-3">
             <button
              @click="$emit('toggleSidebar')"
              class="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md active:scale-95 w-10 h-10 flex items-center justify-center border border-white/20"
              :class="{ 'opacity-0 pointer-events-none': showCart }"
            >
              <i v-if="showSidePanel" class="fa-solid fa-house text-lg animate-fade-in"></i>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 animate-fade-in" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>

            <button
              v-if="isAdmin && !isSuperAdmin"
              @click="$emit('updateStockData')"
              class="hidden sm:block p-2 rounded-full bg-transparent hover:bg-gray-100 transition-colors relative group"
              title="Sync Data"
            >
              <img
                :src="`https://res.cloudinary.com/${cloudName}/image/upload/v1749701539/cloud-sync_nznxzz.png`"
                alt="Refresh"
                class="w-6 h-6 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                :class="{ 'animate-spin': loading }"
              />
            </button>
            <button
              v-if="isSuperAdmin"
              @click="$emit('toggleLedgerView')"
              class="p-2 rounded-full hover:bg-slate-100 transition-colors group"
              title="Ledger View"
            >
              <img
                :src="`https://res.cloudinary.com/${cloudName}/image/upload/v1753616091/accounting-book_vh3kg5.png`"
                alt="Ledger"
                class="w-6 h-6 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
              />
            </button>
          </div>

          <!-- Center: Title -->
          <div class="flex flex-col items-center justify-center px-2">
            <h1 
              class="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 select-none inline-block cursor-pointer leading-none"
              @click="$emit('promptAdminLogin')"
              title="Admin Login"
            >
              <span class="text-blue-600">{{ companyFirstName }}</span> {{ companyRestName }}
            </h1>
            <span class="text-[10px] text-slate-400 font-medium mt-0.5">
               Last Synced: {{ formattedLastRefresh }}
            </span>
          </div>

          <!-- Right: Cart -->
          <div class="flex items-center justify-end gap-2">
             <button
               @click="$emit('toggleCart')"
               class="relative group p-2 bg-blue-600 rounded-full hover:bg-blue-700 transition-all shadow-md active:scale-95 shrink-0 w-10 h-10 flex items-center justify-center border border-white/20"
               :class="{ 'opacity-0 pointer-events-none': showSidePanel }"
               title="Toggle Cart"
             >
               <i v-if="showCart" class="fa-solid fa-house text-white text-lg animate-fade-in"></i>
               <div v-else class="flex items-center justify-center w-full h-full animate-fade-in">
                  <div v-if="cartTotalItems > 0" class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm z-10 border border-white">{{ cartTotalItems }}</div>
                  <i class="fa-solid fa-cart-shopping text-white text-lg"></i>
               </div>
             </button>
          </div>
        </div>

        <!-- Bottom Row: Search & Filters -->
        <div class="flex items-center gap-2">
           <!-- Integrated Search Bar -->
           <div class="relative flex-1">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                 <i class="fa-solid fa-magnifying-glass"></i>
              </span>
              <input
                :value="searchQuery"
                @input="$emit('update:searchQuery', $event.target.value)"
                type="text"
                placeholder="Search items..."
                class="w-full pl-9 pr-4 py-2 rounded-full bg-slate-100/50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              />
           </div>

            <!-- PDF Generator Button (Inline with Search) -->
            <button
              v-if="isAdmin"
              @click="$router.push('/pdf-gen')"
              class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors group shrink-0"
              title="Generate Catalog PDF"
            >
              <!-- Modern Catalog Icon style -->
              <i class="fa-solid fa-file-invoice text-red-500 text-xl group-hover:scale-110 transition-transform"></i>
            </button>

            <!-- Cache Images Button -->
            <button
              v-if="isAdmin"
              @click="$emit('cacheImages')"
              class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors group shrink-0"
              title="Cache All Images for Offline"
            >
              <i class="fa-solid fa-cloud-arrow-down text-blue-600 text-xl group-hover:scale-110 transition-transform"></i>
            </button>
           
           <!-- Image Toggle -->
           <label class="flex items-center cursor-pointer select-none bg-white lg:bg-slate-50 border border-slate-200 rounded-full px-3 py-2 shadow-sm active:scale-95 transition-transform h-[38px]" title="Show Images Only">
               <input 
                 type="checkbox" 
                 :checked="showImagesOnly" 
                 @change="$emit('update:showImagesOnly', $event.target.checked)"
                 class="sr-only peer"
               >
               <i class="fa-solid fa-image text-slate-400 text-sm peer-checked:text-blue-600 mr-2 transition-colors"></i>
               <div class="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600 relative"></div>
           </label>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';

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
  cloudName: String
});

defineEmits([
  'toggleSidebar', 
  'toggleCart', 
  'updateStockData', 
  'toggleLedgerView', 
  'promptAdminLogin',
  'update:searchQuery',
  'update:showImagesOnly',
  'cacheImages'
]);

const companyFirstName = computed(() => props.companyName.split(' ')[0]);
const companyRestName = computed(() => props.companyName.split(' ').slice(1).join(' '));
const formattedLastRefresh = computed(() => 
  props.lastRefresh ? new Date(props.lastRefresh).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "Never"
);
</script>
