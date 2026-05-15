<template>
  <div class="rc-shell min-h-screen w-full font-sans text-slate-800">
    <main class="w-full pt-[54px] lg:pt-[72px] min-h-screen flex flex-col">
      <!-- Header -->
      <div class="rc-header-sticky sticky top-[54px] lg:top-[72px] z-40 px-2.5 pt-2 pb-1.5 sm:px-5 sm:pt-4 sm:pb-2 lg:px-6 xl:px-10">
        <div class="rc-header-card mx-auto flex w-full max-w-7xl flex-col gap-2.5 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:p-5 lg:mx-0 lg:max-w-none">
          <div class="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
            <button type="button" @click="router.push('/home')" class="rc-back-btn flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-slate-600 transition-all duration-200 active:scale-95 sm:h-12 sm:w-12" title="Back">
              <i class="fa-solid fa-arrow-left text-sm sm:text-[15px]"></i>
            </button>
            <div class="min-w-0 flex-1">
              <span class="mb-0.5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-pink-500/15 to-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-pink-700 ring-1 ring-pink-500/20 sm:mb-1 sm:gap-1.5 sm:px-3 sm:py-1 sm:text-[11px]">
                <i class="fa-solid fa-file-invoice-dollar text-[9px] sm:text-[10px]"></i>
                Rate Chart
              </span>
              <h1 class="mt-0.5 truncate text-lg font-semibold tracking-tight text-slate-950 sm:mt-1 sm:text-2xl lg:text-3xl">
                Brand Price Lists
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div class="flex-1 px-2.5 pb-28 pt-1.5 sm:px-5 sm:pb-32 sm:pt-2 lg:px-6 xl:px-10 lg:pt-3">
        <div class="mx-auto h-full w-full max-w-7xl relative lg:mx-0 lg:max-w-none">
          
          <!-- Loading -->
          <div v-if="loading" class="rc-state-card absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[2rem]">
            <div class="relative mb-8">
              <div class="absolute inset-0 scale-150 rounded-full bg-gradient-to-tr from-pink-400 to-rose-400 opacity-25 blur-3xl animate-pulse"></div>
              <div class="relative flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-slate-200/80 border-t-pink-600 animate-spin"></div>
            </div>
            <p class="text-lg font-semibold text-slate-800">Loading Brands</p>
          </div>

          <div v-else>
            <div class="space-y-2 sm:space-y-2.5">
              <div v-for="group in filteredGroups" :key="group.groupName" 
                class="rc-float-card flex items-center justify-between gap-3 rounded-2xl p-3 sm:rounded-[1.5rem] sm:p-4 lg:p-5 transition-all hover:-translate-y-0.5">
                <div class="flex min-w-0 items-center gap-3 sm:gap-4">
                  <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-sm text-white shadow-md shadow-pink-500/25 sm:h-12 sm:w-12 sm:text-base">
                    <i class="fa-solid fa-tag"></i>
                  </div>
                  <div class="min-w-0">
                    <h3 class="text-sm font-semibold text-slate-950 sm:text-lg">{{ toTitleCase(group?.groupName || '') }}</h3>
                    <p class="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
                      {{ group?.products?.length || 0 }} products
                    </p>
                  </div>
                </div>
                <button @click="printChart(group)" :disabled="printing === group.groupName"
                  class="rc-print-btn flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white sm:px-5 sm:py-2.5 sm:text-sm active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed">
                  <i v-if="printing === group.groupName" class="fa-solid fa-spinner fa-spin text-[11px] sm:text-xs"></i>
                  <i v-else class="fa-solid fa-print text-[11px] sm:text-xs"></i>
                  {{ printing === group.groupName ? 'Generating...' : 'Print' }}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '../stores/appStore';
import { storeToRefs } from 'pinia';
import { useStockData } from '../composables/useStockData';
import { generateRateChartPDF } from '../utils/pdfRateChart';

const router = useRouter();
const appStore = useAppStore();
const { stockData } = storeToRefs(appStore);
const { loadStockData } = useStockData();

const loading = ref(true);
const printing = ref(null);

onMounted(async () => {
  if (!stockData.value || stockData.value.length === 0) {
    await loadStockData();
  }
  loading.value = false;
});

const groups = computed(() => {
  if (!stockData.value) return [];
  return stockData.value
    .filter(g => g.groupName !== '_META_DATA_' && g.products && g.products.length > 0)
    .sort((a, b) => a.groupName.localeCompare(b.groupName));
});

const filteredGroups = computed(() => {
  return groups.value;
});

const printChart = async (group) => {
  try {
    printing.value = group.groupName;
    const products = group.products;
    await generateRateChartPDF(group.groupName, products);
  } catch (err) {
    console.error("Failed to generate PDF", err);
  } finally {
    printing.value = null;
  }
};

const toTitleCase = (str) => {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};
</script>

<style scoped>
.rc-shell {
  background-color: #fdf2f8;
  background-image:
    radial-gradient(1200px 600px at 80% -10%, rgba(244, 114, 182, 0.15), transparent 55%),
    radial-gradient(900px 500px at -10% 30%, rgba(251, 113, 133, 0.1), transparent 50%),
    radial-gradient(700px 400px at 50% 100%, rgba(236, 72, 153, 0.05), transparent 45%);
}
.rc-header-sticky { pointer-events: none; }
.rc-header-sticky > * { pointer-events: auto; }
.rc-header-card {
  border-radius: 1.75rem;
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  box-shadow: 0 1px 0 rgba(255,255,255,0.9) inset, 0 24px 48px -20px rgba(15,23,42,0.18), 0 0 0 1px rgba(255,255,255,0.5);
}
.rc-back-btn {
  background: #fff;
  box-shadow: 0 4px 14px rgba(15,23,42,0.08), 0 0 0 1px rgba(226,232,240,0.9);
}
.rc-back-btn:hover { color: rgb(219 39 119); box-shadow: 0 8px 24px rgba(236,72,153,0.2), 0 0 0 1px rgba(244,114,182,0.6); }

.rc-print-btn {
  background: linear-gradient(135deg, #ec4899, #be185d);
  box-shadow: 0 8px 20px rgba(236,72,153,0.35);
}
.rc-print-btn:hover:not(:disabled) { filter: brightness(1.08); }

.rc-state-card {
  background: rgba(255,255,255,0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 24px 48px -18px rgba(15,23,42,0.12), 0 0 0 1px rgba(255,255,255,0.6);
}
.rc-float-card {
  background: rgba(255,255,255,0.92);
  box-shadow: 0 20px 40px -18px rgba(15,23,42,0.2), 0 0 0 1px rgba(255,255,255,0.8) inset, 0 1px 0 rgba(15,23,42,0.04);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}
.rc-float-card:hover { box-shadow: 0 28px 56px -20px rgba(236,72,153,0.22), 0 0 0 1px rgba(252,165,165,0.5) inset; }
</style>
