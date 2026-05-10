<template>
  <div class="trend-shell min-h-screen w-full font-sans text-slate-800">
    <main class="w-full pt-[54px] lg:pt-[72px] min-h-screen flex flex-col">
      <!-- Header -->
      <div class="trend-header-sticky sticky top-[54px] lg:top-[72px] z-40 px-2.5 pt-2 pb-1.5 sm:px-5 sm:pt-4 sm:pb-2 lg:px-6 xl:px-10">
        <div class="trend-header-card mx-auto flex w-full max-w-7xl flex-col gap-2.5 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:p-5 lg:mx-0 lg:max-w-none">
          <div class="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
            <button type="button" @click="router.push('/')" class="trend-back-btn flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-slate-600 transition-all duration-200 active:scale-95 sm:h-12 sm:w-12" title="Back">
              <i class="fa-solid fa-arrow-left text-sm sm:text-[15px]"></i>
            </button>
            <div class="min-w-0 flex-1">
              <span class="mb-0.5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-amber-500/25 sm:mb-1 sm:gap-1.5 sm:px-3 sm:py-1 sm:text-[11px]">
                <i class="fa-solid fa-chart-line text-[9px] sm:text-[10px]"></i>
                Stock Trends
              </span>
              <h1 class="mt-0.5 text-lg font-semibold tracking-tight text-slate-950 sm:mt-1 sm:text-2xl lg:text-3xl">Movement Insights</h1>
              <p v-if="!loading" class="mt-0.5 text-xs text-slate-500 sm:text-sm">
                <span class="font-semibold text-amber-700">{{ summary.total }}</span> products tracked
              </p>
            </div>
          </div>
          <!-- Lookback Selector -->
          <div class="flex items-center gap-1.5 sm:gap-2">
            <button v-for="opt in lookbackOptions" :key="opt.value" @click="lookbackDays = opt.value"
              :class="[lookbackDays === opt.value ? 'trend-period-active' : 'trend-period-inactive', 'rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 sm:px-4 sm:py-2 sm:text-sm']">
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>

      <div class="flex-1 px-2.5 pb-28 pt-1.5 sm:px-5 sm:pb-32 sm:pt-2 lg:px-6 xl:px-10 lg:pt-3">
        <div class="mx-auto h-full w-full max-w-7xl relative lg:mx-0 lg:max-w-none">

          <!-- Loading -->
          <div v-if="loading" class="trend-state-card absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[2rem]">
            <div class="relative mb-8">
              <div class="absolute inset-0 scale-150 rounded-full bg-gradient-to-tr from-amber-400 to-orange-400 opacity-25 blur-3xl animate-pulse"></div>
              <div class="relative flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-slate-200/80 border-t-amber-600 animate-spin"></div>
            </div>
            <p class="text-lg font-semibold text-slate-800">Analyzing stock</p>
            <p class="mt-1 text-sm text-slate-500">Crunching numbers…</p>
          </div>

          <div v-else>
            <!-- Summary Cards -->
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 lg:gap-4 mb-3 sm:mb-4">
              <button v-for="card in summaryCards" :key="card.key" @click="toggleFilter(card.key)"
                :class="[activeFilter === card.key ? 'ring-2 ring-offset-2 scale-[1.02]' : '', 'trend-summary-card group flex flex-col rounded-2xl p-3 text-left transition-all duration-200 active:scale-[0.97] sm:rounded-[1.5rem] sm:p-4 lg:p-5']"
                :style="{ '--card-accent': card.accentColor, 'ring-color': card.ringColor }">
                <div class="mb-2 flex items-center justify-between sm:mb-3">
                  <div class="flex h-9 w-9 items-center justify-center rounded-xl sm:h-11 sm:w-11 sm:rounded-2xl" :style="{ background: card.iconBg }">
                    <i :class="['fa-solid', card.icon, 'text-sm sm:text-base']" :style="{ color: card.iconColor }"></i>
                  </div>
                  <span v-if="activeFilter === card.key" class="text-[10px] font-semibold text-amber-600 sm:text-xs">Active</span>
                </div>
                <p class="font-mono text-2xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-3xl">{{ card.count }}</p>
                <p class="mt-0.5 text-[11px] font-medium text-slate-500 sm:mt-1 sm:text-xs">{{ card.label }}</p>
              </button>
            </div>

            <!-- No History State -->
            <div v-if="summary.noData === summary.total && summary.total > 0" class="trend-state-card flex flex-col items-center justify-center rounded-[2rem] px-6 py-16 text-center sm:py-20">
              <div class="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-50 text-4xl text-amber-500 shadow-inner sm:h-28 sm:w-28 sm:text-5xl">
                <i class="fa-solid fa-hourglass-half"></i>
              </div>
              <h3 class="mb-2 text-xl font-semibold text-slate-950 sm:text-2xl">Waiting for data</h3>
              <p class="max-w-sm text-sm leading-relaxed text-slate-500 sm:text-base">Sync stock from Tally a few times and trends will appear here automatically.</p>
            </div>

            <!-- Search + Filter Bar -->
            <div v-else class="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:gap-3">
              <div class="group relative flex-1">
                <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4">
                  <i class="fa-solid fa-magnifying-glass text-slate-400 transition-colors group-focus-within:text-amber-500 text-sm"></i>
                </div>
                <input type="search" v-model="searchQuery" autocomplete="off"
                  class="trend-search h-10 w-full rounded-full border-0 pl-9 pr-9 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 sm:h-12 sm:pl-11 sm:text-[15px]"
                  placeholder="Search products…" />
                <button v-if="searchQuery" type="button" @click="searchQuery = ''" class="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-amber-600">
                  <i class="fa-solid fa-circle-xmark text-lg"></i>
                </button>
              </div>
              <button v-if="activeFilter" @click="activeFilter = null" class="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-200 sm:px-4 sm:text-sm">
                <i class="fa-solid fa-xmark"></i> Clear filter
              </button>
            </div>

            <!-- Product List -->
            <div v-if="filteredProducts.length > 0" class="space-y-2 sm:space-y-2.5">
              <!-- Mobile Cards -->
              <div class="sm:hidden space-y-2">
                <div v-for="(p, idx) in paginatedProducts" :key="'m-'+idx"
                  class="trend-float-card rounded-2xl p-3 active:scale-[0.99]">
                  <div class="flex items-start justify-between gap-2 mb-2">
                    <div class="min-w-0 flex-1">
                      <h4 class="text-[13px] font-semibold leading-snug text-slate-950">{{ toTitleCase(p.productName) }}</h4>
                      <p class="mt-0.5 text-[10px] text-slate-400">{{ toTitleCase(p.groupName) }}</p>
                    </div>
                    <span :class="getCategoryBadgeClass(p)" class="flex-shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1">
                      <i :class="['fa-solid', p.categoryIcon, 'text-[8px]']"></i>
                      {{ p.categoryLabel }}
                    </span>
                  </div>
                  <div class="grid grid-cols-3 gap-1.5">
                    <div class="rounded-lg bg-slate-50/80 px-2 py-1.5 text-center">
                      <span class="block text-[9px] font-medium text-slate-400">Stock</span>
                      <span class="font-mono text-sm font-bold tabular-nums text-slate-800">{{ p.currentQty }}</span>
                    </div>
                    <div class="rounded-lg bg-rose-50/80 px-2 py-1.5 text-center">
                      <span class="block text-[9px] font-medium text-rose-400">Sold</span>
                      <span class="font-mono text-sm font-bold tabular-nums text-rose-700">{{ p.totalSold }}</span>
                    </div>
                    <div class="rounded-lg bg-amber-50/80 px-2 py-1.5 text-center">
                      <span class="block text-[9px] font-medium text-amber-500">Days Left</span>
                      <span class="font-mono text-sm font-bold tabular-nums" :class="p.daysOfStock !== null && p.daysOfStock < 7 ? 'text-red-600' : 'text-amber-700'">
                        {{ p.daysOfStock !== null ? p.daysOfStock + 'd' : '—' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Desktop Table -->
              <div class="trend-table-shell custom-scrollbar hidden overflow-hidden rounded-[1.35rem] p-1.5 sm:block sm:rounded-[1.75rem] sm:p-2">
                <div class="overflow-x-auto rounded-xl bg-white/95 shadow-inner ring-1 ring-white/80 sm:rounded-[1.35rem]">
                  <table class="w-full min-w-[700px] border-collapse text-left">
                    <thead>
                      <tr class="text-left text-[10px] font-semibold uppercase tracking-wide text-amber-900/70 sm:text-xs">
                        <th class="rounded-tl-xl bg-gradient-to-r from-amber-50 to-orange-50/60 px-3 py-2.5 sm:rounded-tl-2xl sm:px-5 sm:py-3.5">Product</th>
                        <th class="bg-gradient-to-r from-amber-50 to-orange-50/60 px-3 py-2.5 text-center sm:px-5 sm:py-3.5">Stock</th>
                        <th class="bg-gradient-to-r from-amber-50 to-orange-50/60 px-3 py-2.5 text-center sm:px-5 sm:py-3.5">Sold</th>
                        <th class="bg-gradient-to-r from-amber-50 to-orange-50/60 px-3 py-2.5 text-center sm:px-5 sm:py-3.5">Velocity</th>
                        <th class="bg-gradient-to-r from-amber-50 to-orange-50/60 px-3 py-2.5 text-center sm:px-5 sm:py-3.5">Days Left</th>
                        <th class="rounded-tr-xl bg-gradient-to-r from-amber-50 to-orange-50/60 px-3 py-2.5 text-center sm:rounded-tr-2xl sm:px-5 sm:py-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody class="text-xs sm:text-sm">
                      <tr v-for="(p, idx) in paginatedProducts" :key="idx" class="group border-t border-slate-100/80 transition-colors first:border-t-0 hover:bg-amber-50/30">
                        <td class="min-w-[220px] px-3 py-2.5 sm:px-5 sm:py-3.5">
                          <span class="font-semibold text-slate-950 group-hover:text-amber-800 transition-colors">{{ toTitleCase(p.productName) }}</span>
                          <span class="mt-0.5 block text-[10px] text-slate-400 sm:text-xs">{{ toTitleCase(p.groupName) }}</span>
                        </td>
                        <td class="whitespace-nowrap px-3 py-2.5 text-center font-mono font-semibold tabular-nums sm:px-5 sm:py-3.5" :class="p.currentQty === 0 ? 'text-red-500' : 'text-slate-700'">{{ p.currentQty }}</td>
                        <td class="whitespace-nowrap px-3 py-2.5 text-center font-mono font-semibold tabular-nums text-rose-600 sm:px-5 sm:py-3.5">{{ p.totalSold || '—' }}</td>
                        <td class="whitespace-nowrap px-3 py-2.5 text-center font-mono text-slate-600 tabular-nums sm:px-5 sm:py-3.5">{{ p.sellVelocity > 0 ? p.sellVelocity + '/d' : '—' }}</td>
                        <td class="whitespace-nowrap px-3 py-2.5 text-center font-mono font-semibold tabular-nums sm:px-5 sm:py-3.5"
                            :class="p.daysOfStock !== null && p.daysOfStock < 7 ? 'text-red-600' : 'text-slate-600'">
                          {{ p.daysOfStock !== null ? p.daysOfStock + 'd' : '—' }}
                        </td>
                        <td class="whitespace-nowrap px-3 py-2.5 text-center sm:px-5 sm:py-3.5">
                          <span :class="getCategoryBadgeClass(p)" class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 sm:px-3 sm:py-1 sm:text-[11px]">
                            <i :class="['fa-solid', p.categoryIcon, 'text-[8px] sm:text-[9px]']"></i>
                            {{ p.categoryLabel }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Load More -->
              <div v-if="hasMore" ref="loadMoreRef" class="flex w-full flex-col items-center gap-4 py-12">
                <div class="h-10 w-10 rounded-full border-2 border-slate-200/80 border-t-amber-500 animate-spin"></div>
                <p class="text-sm font-medium text-slate-500">Loading more…</p>
              </div>
            </div>

            <!-- Empty filtered state -->
            <div v-else-if="summary.total > 0 && summary.noData < summary.total" class="trend-state-card flex flex-col items-center justify-center rounded-[2rem] px-6 py-16 text-center">
              <div class="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-amber-50 text-4xl text-amber-400 shadow-inner">
                <i class="fa-solid fa-magnifying-glass"></i>
              </div>
              <h3 class="mb-2 text-xl font-semibold text-slate-950">No matches</h3>
              <p class="max-w-sm text-sm text-slate-500">Try a different search or clear your filter.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '../stores/appStore';
import { storeToRefs } from 'pinia';
import { useStockData } from '../composables/useStockData';
import { useStockAnalytics } from '../composables/useStockAnalytics';
import { useIntersectionObserver } from '@vueuse/core';

const router = useRouter();
const appStore = useAppStore();
const { stockData } = storeToRefs(appStore);
const { loading: stockLoading, loadStockData } = useStockData();

const loading = ref(true);
const searchQuery = ref('');
const activeFilter = ref(null);
const lookbackDays = ref(30);
const itemsPerPage = 40;
const page = ref(1);
const loadMoreRef = ref(null);

const lookbackOptions = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
];

const { analyzedProducts, summary } = useStockAnalytics(stockData, lookbackDays);

onMounted(async () => {
  if (!stockData.value || stockData.value.length === 0) {
    await loadStockData();
  }
  loading.value = false;
});

watch([searchQuery, activeFilter, lookbackDays], () => { page.value = 1; });

const summaryCards = computed(() => [
  { key: 'reorder', label: 'Need Reorder', count: summary.value.reorder, icon: 'fa-cart-shopping', iconBg: 'rgba(245, 158, 11, 0.15)', iconColor: '#d97706', accentColor: '#fbbf24', ringColor: '#fbbf24' },
  { key: 'fast', label: 'Fast Moving', count: summary.value.fast, icon: 'fa-bolt', iconBg: 'rgba(251, 113, 133, 0.15)', iconColor: '#e11d48', accentColor: '#fb7185', ringColor: '#fb7185' },
  { key: 'slow', label: 'Slow Moving', count: summary.value.slow, icon: 'fa-hourglass-half', iconBg: 'rgba(167, 139, 250, 0.15)', iconColor: '#7c3aed', accentColor: '#a78bfa', ringColor: '#a78bfa' },
  { key: 'dead', label: 'Dead Stock', count: summary.value.dead, icon: 'fa-box-archive', iconBg: 'rgba(148, 163, 184, 0.15)', iconColor: '#64748b', accentColor: '#94a3b8', ringColor: '#94a3b8' },
]);

const filteredProducts = computed(() => {
  let list = analyzedProducts.value;
  if (activeFilter.value) {
    list = list.filter(p => p.category === activeFilter.value);
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(p =>
      p.productName.toLowerCase().includes(q) ||
      p.groupName.toLowerCase().includes(q)
    );
  }
  return list;
});

const paginatedProducts = computed(() => filteredProducts.value.slice(0, page.value * itemsPerPage));
const hasMore = computed(() => paginatedProducts.value.length < filteredProducts.value.length);

useIntersectionObserver(loadMoreRef, ([{ isIntersecting }]) => {
  if (isIntersecting && hasMore.value) page.value++;
}, { threshold: 0.1 });

const toggleFilter = (key) => {
  activeFilter.value = activeFilter.value === key ? null : key;
};

const getCategoryBadgeClass = (p) => {
  const map = {
    reorder: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/10 text-amber-900 ring-amber-300/40',
    fast: 'bg-gradient-to-r from-rose-500/15 to-pink-500/10 text-rose-900 ring-rose-300/40',
    slow: 'bg-gradient-to-r from-violet-500/15 to-purple-500/10 text-violet-900 ring-violet-200/40',
    dead: 'bg-gradient-to-r from-slate-400/15 to-slate-500/10 text-slate-700 ring-slate-300/40',
    healthy: 'bg-gradient-to-r from-emerald-500/15 to-teal-500/10 text-emerald-900 ring-emerald-300/40',
    'no-data': 'bg-gradient-to-r from-slate-300/15 to-slate-400/10 text-slate-600 ring-slate-200/40',
  };
  return map[p.category] || map['no-data'];
};

const toTitleCase = (str) => {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};
</script>

<style scoped>
.trend-shell {
  background-color: #fefce8;
  background-image:
    radial-gradient(1100px 560px at 20% -10%, rgba(251, 191, 36, 0.18), transparent 52%),
    radial-gradient(900px 480px at 90% 25%, rgba(252, 165, 165, 0.12), transparent 48%),
    radial-gradient(600px 400px at 50% 100%, rgba(245, 158, 11, 0.06), transparent 45%);
}
.trend-header-sticky { pointer-events: none; }
.trend-header-sticky > * { pointer-events: auto; }
.trend-header-card {
  border-radius: 1.75rem;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(20px) saturate(1.35);
  -webkit-backdrop-filter: blur(20px) saturate(1.35);
  box-shadow: 0 1px 0 rgba(255,255,255,0.9) inset, 0 24px 48px -20px rgba(15,23,42,0.14), 0 0 0 1px rgba(255,255,255,0.5);
}
.trend-back-btn {
  background: #fff;
  box-shadow: 0 4px 14px rgba(15,23,42,0.08), 0 0 0 1px rgba(226,232,240,0.9);
}
.trend-back-btn:hover { color: #b45309; box-shadow: 0 8px 24px rgba(245,158,11,0.2), 0 0 0 1px rgba(252,211,77,0.5); }
.trend-period-active {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  box-shadow: 0 4px 12px rgba(245,158,11,0.35);
}
.trend-period-inactive {
  background: rgba(255,255,255,0.9);
  color: #78716c;
  box-shadow: 0 2px 8px rgba(15,23,42,0.06), 0 0 0 1px rgba(226,232,240,0.7);
}
.trend-period-inactive:hover { color: #b45309; background: rgba(255,255,255,1); }
.trend-state-card {
  background: rgba(255,255,255,0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 24px 48px -18px rgba(15,23,42,0.1), 0 0 0 1px rgba(255,255,255,0.6);
}
.trend-summary-card {
  background: rgba(255,255,255,0.88);
  box-shadow: 0 12px 28px -12px rgba(15,23,42,0.12), 0 0 0 1px rgba(255,255,255,0.8) inset;
  cursor: pointer;
}
.trend-summary-card:hover { box-shadow: 0 16px 36px -12px rgba(245,158,11,0.18), 0 0 0 1px rgba(252,211,77,0.3) inset; }
.trend-search {
  background: rgba(255,255,255,0.95);
  box-shadow: 0 4px 20px rgba(15,23,42,0.06), 0 0 0 1px rgba(226,232,240,0.9);
}
.trend-search:focus { box-shadow: 0 8px 28px rgba(245,158,11,0.12), 0 0 0 3px rgba(251,191,36,0.3); }
.trend-float-card {
  background: rgba(255,255,255,0.92);
  box-shadow: 0 16px 36px -16px rgba(15,23,42,0.15), 0 0 0 1px rgba(255,255,255,0.85) inset;
}
.trend-table-shell {
  background: linear-gradient(145deg, rgba(254,243,199,0.7) 0%, rgba(255,251,235,0.4) 100%);
  box-shadow: 0 20px 50px -24px rgba(245,158,11,0.2), 0 0 0 1px rgba(252,211,77,0.25);
}
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #fcd34d, #f59e0b); border-radius: 10px; }
</style>
