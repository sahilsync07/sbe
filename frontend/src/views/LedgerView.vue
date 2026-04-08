<template>
  <div class="ledger-shell min-h-screen w-full font-sans text-slate-800">
    

    

    
    

    <main class="w-full pt-[54px] lg:pt-[72px] min-h-screen flex flex-col transition-all duration-300">
      
      <div class="ledger-header-sticky sticky top-[54px] lg:top-[72px] z-40 px-2.5 pt-2 pb-1.5 sm:px-5 sm:pt-4 sm:pb-2 lg:px-6 xl:px-10">
        <div class="ledger-header-card mx-auto flex w-full max-w-7xl flex-col gap-2.5 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:p-5 lg:mx-0 lg:max-w-none">
          
          <div class="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
            <button 
              type="button"
              @click="handleBack" 
              class="ledger-back-btn flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-slate-600 transition-all duration-200 active:scale-95 sm:h-12 sm:w-12" 
              title="Back"
            >
               <i class="fa-solid fa-arrow-left text-sm sm:text-[15px]"></i>
            </button>
            
            <div class="min-w-0 flex-1">
              <span class="mb-0.5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-500/15 to-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 ring-1 ring-indigo-500/20 sm:mb-1 sm:gap-1.5 sm:px-3 sm:py-1 sm:text-[11px]">
                <i class="fa-solid fa-book-open text-[9px] sm:text-[10px]"></i>
                Ledger
              </span>
              <h1 class="mt-0.5 truncate text-lg font-semibold tracking-tight text-slate-950 sm:mt-1 sm:text-2xl lg:text-3xl" 
                  :title="displayMode === 'GROUP_LEDGERS' ? selectedGroup.groupName : (displayMode === 'SEARCH' ? 'Search' : 'Categories')">
                  {{ displayMode === 'GROUP_LEDGERS' ? toTitleCase(selectedGroup.groupName) : (displayMode === 'SEARCH' ? 'Search results' : 'All categories') }}
              </h1>
              <p v-if="!loading" class="mt-0.5 text-xs text-slate-500 tabular-nums sm:text-sm">
                  <span class="font-semibold text-indigo-600">{{ currentItemList.length }}</span>
                  {{ displayMode === 'GROUPS' ? ' categories' : ' accounts' }}
              </p>
            </div>
          </div>
          
          <div class="w-full sm:max-w-sm sm:flex-shrink-0">
             <div class="group relative">
                <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4">
                   <i class="fa-solid fa-magnifying-glass text-slate-400 transition-colors group-focus-within:text-indigo-500 text-sm sm:text-[15px]"></i>
                </div>
                <input 
                  type="search" 
                  v-model="searchQuery"
                  autocomplete="off"
                  class="ledger-search h-10 w-full rounded-full border-0 pl-9 pr-9 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 sm:h-12 sm:pl-11 sm:pr-11 sm:text-[15px]" 
                  placeholder="Search…" 
                />
                <button 
                  v-if="searchQuery" 
                  type="button"
                  @click="searchQuery = ''"
                  class="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 transition-colors hover:text-indigo-600 sm:pr-3.5"
                >
                   <i class="fa-solid fa-circle-xmark text-lg sm:text-xl"></i>
                </button>
             </div>
          </div>
        </div>
      </div>

      <div class="flex-1 px-2.5 pb-28 pt-1.5 sm:px-5 sm:pb-32 sm:pt-2 lg:px-6 xl:px-10 lg:pt-3">
        <div class="mx-auto h-full w-full max-w-7xl relative lg:mx-0 lg:max-w-none">
          
          <div v-if="loading" class="ledger-state-card absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[2rem] sm:rounded-[2.25rem]">
             <div class="relative mb-8">
               <div class="absolute inset-0 scale-150 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 opacity-25 blur-3xl animate-pulse"></div>
               <div class="relative flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-slate-200/80 border-t-indigo-600 animate-spin"></div>
             </div>
             <p class="text-lg font-semibold text-slate-800">Loading ledger</p>
             <p class="mt-1 text-sm text-slate-500">Hang tight…</p>
          </div>

          <div v-else-if="error" class="ledger-state-card flex h-[min(60vh,520px)] flex-col items-center justify-center rounded-[2rem] px-6 py-12 text-center sm:rounded-[2.25rem]">
             <div class="mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-orange-50 text-4xl text-rose-500 shadow-[0_20px_60px_-15px_rgba(244,63,94,0.35)]">
                <i class="fa-solid fa-plug-circle-xmark"></i>
             </div>
             <h2 class="mb-2 text-2xl font-semibold text-slate-950">Couldn’t load data</h2>
             <p class="max-w-md leading-relaxed text-slate-600">{{ error }}</p>
             <button type="button" @click="loadLedgerData" class="ledger-pill-btn mt-10 rounded-full px-10 py-4 text-[15px] font-semibold text-white active:scale-[0.98]">
                Try again
             </button>
          </div>

          <div v-else-if="currentItemList.length === 0" class="ledger-state-card flex flex-col items-center justify-center rounded-[2rem] px-6 py-20 text-center sm:rounded-[2.25rem] sm:py-28">
              <div class="mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 via-white to-indigo-50 text-5xl text-indigo-400 shadow-inner ring-1 ring-slate-200/60">
                <i class="fa-solid fa-magnifying-glass"></i>
             </div>
             <h3 class="mb-2 text-2xl font-semibold text-slate-950">Nothing here</h3>
             <p class="max-w-sm text-slate-600">Adjust your search or step back a level.</p>
          </div>

          <div v-else class="flex flex-col gap-3 pb-6 sm:gap-5 sm:pb-8">
             
             <div class="space-y-2.5 sm:hidden">
                <div 
                  v-for="(item, idx) in paginatedItems" 
                  :key="'m-'+idx"
                  @click="handleItemClick(item)"
                  class="ledger-float-card touch-manipulation rounded-2xl p-3.5 active:scale-[0.99] sm:rounded-[1.75rem] sm:p-5"
                >
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex min-w-0 items-center gap-2.5">
                      <div 
                        v-if="displayMode === 'GROUPS'" 
                        class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm text-white shadow-md shadow-indigo-500/30 sm:h-14 sm:w-14 sm:text-lg sm:shadow-lg"
                      >
                          <i class="fa-solid fa-folder-tree text-[13px] sm:text-base"></i>
                      </div>
                      <div 
                        v-else 
                        class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-100 text-sm text-slate-600 ring-1 ring-slate-200/80 sm:h-14 sm:w-14 sm:text-lg"
                      >
                          <i class="fa-solid fa-file-invoice-dollar text-[13px] sm:text-base"></i>
                      </div>
                      <div class="min-w-0">
                        <h3 class="break-words text-sm font-semibold leading-snug text-slate-950 sm:text-lg">
                          {{ displayMode === 'GROUPS' ? toTitleCase(item.groupName) : toTitleCase(item.ledgerName) }}
                        </h3>
                        <p class="mt-0.5 text-xs text-slate-500 sm:mt-1 sm:text-sm">
                          {{ displayMode === 'GROUPS' ? (item.ledgers ? item.ledgers.length + ' accounts' : 'Empty') : toTitleCase(item.groupName) }}
                        </p>
                      </div>
                    </div>
                    <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 sm:h-10 sm:w-10">
                       <i class="fa-solid fa-chevron-right text-[10px] sm:text-xs"></i>
                    </div>
                  </div>

                  <div class="mt-3 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3">
                    <div class="rounded-xl bg-slate-50/90 px-3 py-2 sm:rounded-2xl sm:px-4 sm:py-3">
                      <span class="mb-0.5 block text-[10px] font-medium text-slate-500 sm:mb-1 sm:text-xs">Opening</span>
                      <p :class="[getBalanceColor(displayMode === 'GROUPS' ? item.openingTotal : item.openingBalance), 'font-mono text-xs font-semibold tabular-nums tracking-tight sm:text-sm']">
                         ₹{{ formatAmount(displayMode === 'GROUPS' ? item.openingTotal : item.openingBalance) }} <span class="text-[10px] font-sans font-medium opacity-80 sm:text-xs">{{ getDrCr(displayMode === 'GROUPS' ? item.openingTotal : item.openingBalance) }}</span>
                      </p>
                    </div>
                    <div class="rounded-xl bg-indigo-50/80 px-3 py-2 text-right ring-1 ring-indigo-100/50 sm:rounded-2xl sm:px-4 sm:py-3">
                      <span class="mb-0.5 block text-[10px] font-medium text-indigo-600/80 sm:mb-1 sm:text-xs">Closing</span>
                      <p :class="[getBalanceColor(displayMode === 'GROUPS' ? item.closingTotal : item.closingBalance), 'font-mono text-sm font-semibold tabular-nums tracking-tight sm:text-base']">
                         ₹{{ formatAmount(displayMode === 'GROUPS' ? item.closingTotal : item.closingBalance) }} <span class="text-[10px] font-sans font-medium opacity-80 sm:text-xs">{{ getDrCr(displayMode === 'GROUPS' ? item.closingTotal : item.closingBalance) }}</span>
                      </p>
                    </div>
                  </div>
                </div>
             </div>

             <div class="hidden flex-col gap-3 sm:flex sm:flex-col sm:gap-4">
                <div 
                  v-for="(item, idx) in paginatedItems" 
                  :key="'d-'+idx"
                  @click="handleItemClick(item)"
                  class="ledger-float-card group flex cursor-pointer items-center justify-between gap-4 rounded-[1.35rem] px-4 py-3.5 transition-all duration-300 hover:-translate-y-0.5 sm:gap-6 sm:rounded-[1.75rem] sm:px-6 sm:py-5"
                >
                  <div class="flex min-w-0 flex-1 items-center gap-5">
                    <div 
                      v-if="displayMode === 'GROUPS'" 
                      class="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xl text-white shadow-lg shadow-indigo-500/25 transition-transform duration-300 group-hover:scale-105"
                    >
                        <i class="fa-solid fa-folder-tree"></i>
                    </div>
                    <div 
                      v-else 
                      class="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-50 text-lg text-slate-600 ring-1 ring-slate-200/80 transition-colors group-hover:from-indigo-100 group-hover:to-violet-50 group-hover:text-indigo-700"
                    >
                        <i class="fa-solid fa-file-invoice-dollar"></i>
                    </div>
                    <div class="min-w-0 py-0.5">
                      <h3 class="truncate text-lg font-semibold text-slate-950 transition-colors group-hover:text-indigo-700" :title="displayMode === 'GROUPS' ? item.groupName : item.ledgerName">
                        {{ displayMode === 'GROUPS' ? toTitleCase(item.groupName) : toTitleCase(item.ledgerName) }}
                      </h3>
                      <p class="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                        <span v-if="displayMode === 'GROUPS'" class="inline-flex items-center rounded-full bg-slate-100 px-3 py-0.5 text-xs font-medium text-slate-600">{{ item.ledgers ? item.ledgers.length : 0 }} accounts</span>
                        <span v-else class="text-indigo-600/90">{{ toTitleCase(item.groupName) }}</span>
                      </p>
                    </div>
                  </div>

                  <div class="flex flex-shrink-0 items-center gap-6 sm:gap-10">
                     <div class="hidden text-right sm:block">
                         <span class="mb-1 block text-xs font-medium text-slate-500">Opening</span>
                         <span class="font-mono text-sm font-semibold tabular-nums tracking-tight" :class="getBalanceColor(displayMode === 'GROUPS' ? item.openingTotal : item.openingBalance)">
                            ₹{{ formatAmount(displayMode === 'GROUPS' ? item.openingTotal : item.openingBalance) }} <span class="text-xs font-sans font-medium">{{ getDrCr(displayMode === 'GROUPS' ? item.openingTotal : item.openingBalance) }}</span>
                         </span>
                     </div>
                     <div class="min-w-[128px] text-right sm:min-w-[140px]">
                         <span class="mb-1 block text-xs font-medium text-indigo-600/80">Closing</span>
                         <span class="font-mono text-xl font-semibold tabular-nums tracking-tight" :class="getBalanceColor(displayMode === 'GROUPS' ? item.closingTotal : item.closingBalance)">
                            ₹{{ formatAmount(displayMode === 'GROUPS' ? item.closingTotal : item.closingBalance) }} <span class="text-sm font-sans font-medium">{{ getDrCr(displayMode === 'GROUPS' ? item.closingTotal : item.closingBalance) }}</span>
                         </span>
                     </div>
                     <div class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-all duration-200 group-hover:bg-indigo-100 group-hover:text-indigo-600">
                        <i class="fa-solid fa-chevron-right text-sm"></i>
                     </div>
                  </div>
                </div>
             </div>

             <div v-if="hasMore" ref="loadMoreRef" class="flex w-full flex-col items-center gap-4 py-16">
                 <div class="h-11 w-11 rounded-full border-2 border-slate-200/80 border-t-indigo-600 animate-spin"></div>
                 <p class="text-sm font-medium text-slate-500">Loading more…</p>
             </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Detail Modal -->
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
import { useAdmin } from '../composables/useAdmin';
import { useStockData } from '../composables/useStockData';
import { useCart } from '../composables/useCart';
import { useBrandGroups } from '../composables/useBrandGroups';
import { useAppStore } from '../stores/appStore';
import { storeToRefs } from 'pinia';
import { useIntersectionObserver } from '@vueuse/core';

const router = useRouter();
const appStore = useAppStore();
const { stockData, config } = storeToRefs(appStore);

const { ledgerData, allLedgers, loading: ledgerLoading, error, loadLedgerData } = useLedgerData();
const { isAdmin, isSuperAdmin } = useAdmin();
const companyName = ref('SBE Rayagada');

const { loading: stockLoading } = useStockData();
const { cartTotalItems } = useCart();

// Sidebar & Search glue
const searchQuery = ref('');
const { groupedSidebar } = useBrandGroups(stockData, config, searchQuery);
const activeScrollGroup = ref('');

const selectedGroup = ref(null);
const selectedLedger = ref(null);
const showSidePanel = ref(false);
const showCart = ref(false);
const loading = computed(() => ledgerLoading.value);

// Pagination
const itemsPerPage = 30;
const page = ref(1);
const loadMoreRef = ref(null);

// Load data on mount
onMounted(() => {
  if (!isAdmin.value && !isSuperAdmin.value) {
    router.replace('/');
    return;
  }
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

const handleSidebarClick = (group) => {
    router.push({ path: '/', query: { brand: group.groupName } });
    showSidePanel.value = false;
};

const handleClubClick = (clubName) => {
    router.push({ path: '/', query: { club: clubName } });
    showSidePanel.value = false;
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

const toTitleCase = (str) => {
  if (!str) return '';
  // Remove "as per details"
  let clean = str.replace(/as per details/gi, '').trim();
  return clean.toLowerCase().split(' ').map(word => {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
};
</script>

<style scoped>
.ledger-shell {
  background-color: #f4f4f5;
  background-image:
    radial-gradient(1200px 600px at 80% -10%, rgba(129, 140, 248, 0.22), transparent 55%),
    radial-gradient(900px 500px at -10% 30%, rgba(167, 139, 250, 0.14), transparent 50%),
    radial-gradient(700px 400px at 50% 100%, rgba(99, 102, 241, 0.08), transparent 45%);
}

.ledger-header-sticky {
  pointer-events: none;
}
.ledger-header-sticky > * {
  pointer-events: auto;
}

.ledger-header-card {
  border-radius: 1.75rem;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.9) inset,
    0 24px 48px -20px rgba(15, 23, 42, 0.18),
    0 0 0 1px rgba(255, 255, 255, 0.5);
}

.ledger-back-btn {
  background: #fff;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(226, 232, 240, 0.9);
}
.ledger-back-btn:hover {
  color: rgb(67 56 202);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.2), 0 0 0 1px rgba(165, 180, 252, 0.6);
}

.ledger-search {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06), 0 0 0 1px rgba(226, 232, 240, 0.9);
}
.ledger-search:focus {
  box-shadow:
    0 8px 28px rgba(99, 102, 241, 0.12),
    0 0 0 3px rgba(129, 140, 248, 0.35);
}

.ledger-state-card {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 24px 48px -18px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.6);
}

.ledger-float-card {
  background: rgba(255, 255, 255, 0.92);
  box-shadow:
    0 20px 40px -18px rgba(15, 23, 42, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.8) inset,
    0 1px 0 rgba(15, 23, 42, 0.04);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}
.ledger-float-card:hover {
  box-shadow:
    0 28px 56px -20px rgba(99, 102, 241, 0.22),
    0 0 0 1px rgba(199, 210, 254, 0.5) inset;
}

.ledger-pill-btn {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6366f1 100%);
  box-shadow: 0 12px 32px -8px rgba(79, 70, 229, 0.55);
}
.ledger-pill-btn:hover {
  filter: brightness(1.06);
  box-shadow: 0 16px 40px -8px rgba(79, 70, 229, 0.65);
}
</style>
