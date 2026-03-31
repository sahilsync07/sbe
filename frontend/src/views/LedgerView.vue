<template>
  <div class="h-screen w-full bg-slate-50 flex flex-col font-sans text-slate-800 overflow-hidden">
    
    <!-- Header Area -->
    <header class="bg-white border-b border-slate-200 px-4 lg:px-6 py-4 flex-shrink-0 z-10 shadow-sm relative">
      <div class="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
        
        <div class="flex items-center gap-4 min-w-0">
          <button @click="handleBack" class="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors shadow-sm active:scale-95 border border-slate-200" title="Back">
             <i class="fa-solid fa-arrow-left"></i>
          </button>
          
          <div class="min-w-0">
            <h1 class="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-none truncate" :title="displayMode === 'GROUP_LEDGERS' ? selectedGroup.groupName : (displayMode === 'SEARCH' ? 'Search Results' : 'Ledger Categories')">
                {{ displayMode === 'GROUP_LEDGERS' ? selectedGroup.groupName : (displayMode === 'SEARCH' ? 'Search Results' : 'Ledger Categories') }}
            </h1>
            <p v-if="!loading" class="text-[10px] sm:text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider truncate">
                {{ currentItemList.length }} {{ displayMode === 'GROUPS' ? 'Categories' : 'Accounts' }}
            </p>
          </div>
        </div>
        
        <!-- Search Bar -->
        <div class="flex-1 max-w-md hidden sm:block">
           <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                 <i class="fa-solid fa-magnifying-glass text-slate-400 group-focus-within:text-blue-500 transition-colors"></i>
              </div>
              <input 
                type="text" 
                v-model="searchQuery"
                class="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block pl-10 p-2.5 transition-all outline-none" 
                placeholder="Search ledgers by name or group..." 
              />
              <button 
                v-if="searchQuery" 
                @click="searchQuery = ''"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 outline-none"
              >
                 <i class="fa-solid fa-circle-xmark"></i>
              </button>
           </div>
        </div>

      </div>
      
      <!-- Mobile Search (shows below header on small screens) -->
      <div class="sm:hidden w-full mt-4">
          <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                 <i class="fa-solid fa-magnifying-glass text-slate-400 group-focus-within:text-blue-500 transition-colors"></i>
              </div>
              <input 
                type="text" 
                v-model="searchQuery"
                class="w-full bg-slate-100 border-none text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 block pl-10 p-3 transition-all outline-none" 
                placeholder="Search ledgers..." 
              />
               <button 
                v-if="searchQuery" 
                @click="searchQuery = ''"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 outline-none"
              >
                 <i class="fa-solid fa-circle-xmark"></i>
              </button>
           </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 overflow-y-auto w-full custom-scrollbar relative">
      <div class="max-w-7xl mx-auto w-full p-4 lg:p-6 pb-24 h-full relative">
        
        <!-- Loading State -->
        <div v-if="loading" class="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-10">
           <div class="w-16 h-16 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
           <p class="font-bold text-slate-600 animate-pulse text-lg">Loading Directory...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="h-full flex flex-col items-center justify-center text-center px-4">
           <div class="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm">
              <i class="fa-solid fa-triangle-exclamation"></i>
           </div>
           <h2 class="text-xl font-bold text-slate-800 mb-2">Data Unavailable</h2>
           <p class="text-slate-500 max-w-md">{{ error }}</p>
           <button @click="loadLedgerData" class="mt-6 px-6 py-2.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors">
              Retry Sync
           </button>
        </div>

        <!-- Empty Results -->
        <div v-else-if="currentItemList.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
            <div class="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center text-3xl mb-4">
              <i class="fa-solid fa-magnifying-glass"></i>
           </div>
           <h3 class="text-lg font-bold text-slate-700 mb-1">No results found</h3>
           <p class="text-sm text-slate-500">Try adjusting your search query.</p>
        </div>

        <!-- Ledger/Group List -->
        <div v-else class="flex flex-col gap-2">
           <div 
              v-for="(item, idx) in paginatedItems" 
              :key="displayMode === 'GROUPS' ? item.groupName : item.ledgerName + '_' + idx"
              @click="handleItemClick(item)"
              class="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex items-center justify-between gap-2 sm:gap-4 group"
           >
              <!-- GROUP ITEM VIEW -->
              <template v-if="displayMode === 'GROUPS'">
                  <div class="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div class="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-lg sm:text-xl flex-shrink-0">
                          <i class="fa-solid fa-folder"></i>
                      </div>
                      <div class="flex flex-col min-w-0">
                         <h3 class="text-sm sm:text-base font-bold text-slate-800 leading-tight group-hover:text-blue-700 transition-colors truncate" :title="item.groupName">
                            {{ item.groupName }}
                         </h3>
                         <p class="text-[10px] sm:text-xs font-semibold text-slate-400 mt-0.5 uppercase tracking-wider truncate">
                            {{ item.ledgers ? item.ledgers.length : 0 }} Accounts
                         </p>
                      </div>
                  </div>

                  <div class="flex items-center gap-4 sm:gap-6 flex-shrink-0 border-l border-slate-100 pl-4 sm:pl-6">
                     <div class="hidden md:block text-right">
                         <span class="text-[9px] uppercase font-bold tracking-widest text-slate-400 mb-0.5 block">Net Opening</span>
                         <span class="text-xs sm:text-sm font-bold block" :class="getBalanceColor(item.openingTotal)">
                            {{ formatAmount(item.openingTotal) }} {{ getDrCr(item.openingTotal) }}
                         </span>
                     </div>
                     <div class="text-right">
                         <span class="text-[9px] uppercase font-bold tracking-widest text-slate-400 mb-0.5 block">Net Closing</span>
                         <span class="text-sm sm:text-base font-black block" :class="getBalanceColor(item.closingTotal)">
                            {{ formatAmount(item.closingTotal) }} {{ getDrCr(item.closingTotal) }}
                         </span>
                     </div>
                     <div class="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <i class="fa-solid fa-arrow-right text-xs"></i>
                     </div>
                  </div>
              </template>

              <!-- LEDGER ITEM VIEW -->
              <template v-else>
                  <div class="flex flex-col flex-1 min-w-0">
                     <h3 class="text-sm sm:text-base font-bold text-slate-800 leading-tight group-hover:text-blue-700 transition-colors truncate" :title="item.ledgerName">
                        {{ item.ledgerName }}
                     </h3>
                     <p class="text-[10px] sm:text-xs font-semibold text-slate-400 mt-0.5 uppercase tracking-wider truncate">
                        {{ item.groupName }}
                     </p>
                  </div>

                  <div class="flex items-center gap-4 sm:gap-6 flex-shrink-0 border-l border-slate-100 pl-4 sm:pl-6">
                     <div class="hidden md:block text-right">
                         <span class="text-[9px] uppercase font-bold tracking-widest text-slate-400 mb-0.5 block">Opening</span>
                         <span class="text-xs sm:text-sm font-bold block" :class="getBalanceColor(item.openingBalance)">
                            {{ formatAmount(item.openingBalance) }} {{ getDrCr(item.openingBalance) }}
                         </span>
                     </div>
                     <div class="text-right">
                         <span class="text-[9px] uppercase font-bold tracking-widest text-slate-400 mb-0.5 block">Closing</span>
                         <span class="text-sm sm:text-base font-black block" :class="getBalanceColor(item.closingBalance)">
                            {{ formatAmount(item.closingBalance) }} {{ getDrCr(item.closingBalance) }}
                         </span>
                     </div>
                     <div class="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <i class="fa-solid fa-chevron-right text-xs"></i>
                     </div>
                  </div>
              </template>
           </div>
        </div>

        <!-- Pagination Observer / Loader -->
        <div v-if="hasMore" ref="loadMoreRef" class="w-full py-8 flex justify-center">
            <div class="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
        </div>

      </div>
    </main>

    <!-- Detail Modal Component -->
    <LedgerDetailModal 
      v-if="selectedLedger" 
      :ledger="selectedLedger" 
      @close="selectedLedger = null" 
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useLedgerData } from '../composables/useLedgerData';
import LedgerDetailModal from '../components/LedgerDetailModal.vue';
import { useIntersectionObserver } from '@vueuse/core';

const router = useRouter();
const { ledgerData, allLedgers, loading, error, loadLedgerData } = useLedgerData();
const searchQuery = ref('');
const selectedGroup = ref(null);
const selectedLedger = ref(null);

// Pagination
const itemsPerPage = 30;
const page = ref(1);
const loadMoreRef = ref(null);

// Load data on mount
onMounted(() => {
  loadLedgerData();
});

// Reset pagination when search changes or group changes
watch([searchQuery, selectedGroup], () => {
   page.value = 1;
});

// Calculate totals for groups
const groupsWithTotals = computed(() => {
  if (!ledgerData.value) return [];
  return ledgerData.value.map(group => {
    let openingTotal = 0;
    let closingTotal = 0;
    if (group.ledgers && Array.isArray(group.ledgers)) {
       group.ledgers.forEach(l => {
         openingTotal += (l.openingBalance || 0);
         closingTotal += (l.closingBalance || 0);
       });
    }
    return {
      ...group,
      openingTotal,
      closingTotal
    };
  }).sort((a, b) => (a.groupName || '').localeCompare(b.groupName || ''));
});

// Display mode logic
const displayMode = computed(() => {
    if (searchQuery.value) return 'SEARCH';
    if (selectedGroup.value) return 'GROUP_LEDGERS';
    return 'GROUPS';
});

// Combined list to display
const currentItemList = computed(() => {
    if (displayMode.value === 'SEARCH') {
        const q = searchQuery.value.toLowerCase();
        return allLedgers.value.filter(l => 
            (l.ledgerName && l.ledgerName.toLowerCase().includes(q)) || 
            (l.groupName && l.groupName.toLowerCase().includes(q))
        );
    } else if (displayMode.value === 'GROUP_LEDGERS') {
        const ledgers = selectedGroup.value.ledgers || [];
        return ledgers.map(l => ({ ...l, groupName: selectedGroup.value.groupName }))
                      .sort((a,b) => (a.ledgerName||'').localeCompare(b.ledgerName||''));
    } else {
        return groupsWithTotals.value;
    }
});

// Slice for virtualization/pagination
const paginatedItems = computed(() => {
  return currentItemList.value.slice(0, page.value * itemsPerPage);
});

const hasMore = computed(() => paginatedItems.value.length < currentItemList.value.length);

// Infinite Scroll Observer
useIntersectionObserver(
  loadMoreRef,
  ([{ isIntersecting }]) => {
    if (isIntersecting && hasMore.value) {
      page.value++;
    }
  },
  { threshold: 0.1 } // Load a bit earlier
);

// Navigation / Helpers
const handleBack = () => {
    if (searchQuery.value) {
        searchQuery.value = '';
    } else if (selectedGroup.value) {
        selectedGroup.value = null;
    } else {
        router.push('/');
    }
};

const handleItemClick = (item) => {
    if (displayMode.value === 'GROUPS') {
        selectedGroup.value = item;
    } else {
        openLedgerDetail(item);
    }
};

const openLedgerDetail = (ledger) => {
  selectedLedger.value = ledger;
};

const getDrCr = (val) => {
   if (val === 0 || !val) return '';
   return val < 0 ? 'Dr' : 'Cr';
};

const getBalanceColor = (val) => {
   if (val === 0 || !val) return 'text-slate-500';
   return val < 0 ? 'text-rose-600' : 'text-emerald-600'; 
};

const formatAmount = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '0.00';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(amount));
};
</script>
