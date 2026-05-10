<template>
  <div class="sr-shell min-h-screen w-full font-sans text-slate-800">
    <main class="w-full pt-[54px] lg:pt-[72px] min-h-screen flex flex-col">
      <!-- Header -->
      <div class="sr-header-sticky sticky top-[54px] lg:top-[72px] z-40 px-2.5 pt-2 pb-1.5 sm:px-5 sm:pt-4 sm:pb-2 lg:px-6 xl:px-10">
        <div class="sr-header-card mx-auto flex w-full max-w-7xl flex-col gap-2.5 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:p-5 lg:mx-0 lg:max-w-none">
          <div class="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
            <button type="button" @click="handleBack" class="sr-back-btn flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-slate-600 transition-all duration-200 active:scale-95 sm:h-12 sm:w-12" title="Back">
              <i class="fa-solid fa-arrow-left text-sm sm:text-[15px]"></i>
            </button>
            <div class="min-w-0 flex-1">
              <span class="mb-0.5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-sky-500/15 to-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-800 ring-1 ring-sky-500/25 sm:mb-1 sm:gap-1.5 sm:px-3 sm:py-1 sm:text-[11px]">
                <i class="fa-solid fa-box-open text-[9px] sm:text-[10px]"></i>
                Sample Room
              </span>
              <h1 class="mt-0.5 truncate text-lg font-semibold tracking-tight text-slate-950 sm:mt-1 sm:text-2xl lg:text-3xl">
                {{ selectedGroup ? toTitleCase(selectedGroup.groupName) : 'Select Brand' }}
              </h1>
              <p v-if="selectedGroup" class="mt-0.5 text-xs text-slate-500 sm:text-sm">
                <span class="font-semibold text-sky-700">{{ checkedCount }}</span> / {{ selectedGroup.products.length }} present
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <!-- Select All / None -->
            <template v-if="selectedGroup">
              <button @click="selectAll" class="sr-action-btn rounded-full px-3 py-1.5 text-xs font-semibold sm:px-4 sm:py-2 sm:text-sm">All</button>
              <button @click="selectNone" class="sr-action-btn rounded-full px-3 py-1.5 text-xs font-semibold sm:px-4 sm:py-2 sm:text-sm">None</button>
            </template>
            <!-- Print -->
            <button v-if="selectedGroup && checkedCount > 0" @click="printPDF" class="sr-print-btn flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold text-white sm:px-5 sm:py-2 sm:text-sm active:scale-[0.97]">
              <i class="fa-solid fa-print text-[11px] sm:text-xs"></i> Print
            </button>
          </div>
        </div>
      </div>

      <div class="flex-1 px-2.5 pb-28 pt-1.5 sm:px-5 sm:pb-32 sm:pt-2 lg:px-6 xl:px-10 lg:pt-3">
        <div class="mx-auto h-full w-full max-w-7xl relative lg:mx-0 lg:max-w-none">

          <!-- Loading -->
          <div v-if="loading" class="sr-state-card absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[2rem]">
            <div class="relative mb-8">
              <div class="absolute inset-0 scale-150 rounded-full bg-gradient-to-tr from-sky-400 to-cyan-400 opacity-25 blur-3xl animate-pulse"></div>
              <div class="relative flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-slate-200/80 border-t-sky-600 animate-spin"></div>
            </div>
            <p class="text-lg font-semibold text-slate-800">Loading</p>
          </div>

          <!-- Brand Selection (no group selected) -->
          <div v-else-if="!selectedGroup">
            <div class="mb-3 sm:mb-4">
              <div class="group relative">
                <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4">
                  <i class="fa-solid fa-magnifying-glass text-slate-400 group-focus-within:text-sky-500 text-sm"></i>
                </div>
                <input type="search" v-model="brandSearch" autocomplete="off"
                  class="sr-search h-10 w-full rounded-full border-0 pl-9 pr-9 text-sm text-slate-900 outline-none placeholder:text-slate-400 sm:h-12 sm:pl-11 sm:text-[15px]"
                  placeholder="Search brand…" />
                <button v-if="brandSearch" type="button" @click="brandSearch = ''" class="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-sky-600">
                  <i class="fa-solid fa-circle-xmark text-lg"></i>
                </button>
              </div>
            </div>
            <div class="space-y-2 sm:space-y-2.5">
              <div v-for="group in filteredGroups" :key="group.groupName" @click="selectGroup(group)"
                class="sr-float-card flex cursor-pointer items-center justify-between gap-3 rounded-2xl p-3 active:scale-[0.99] sm:rounded-[1.5rem] sm:p-4 lg:p-5 transition-all hover:-translate-y-0.5">
                <div class="flex min-w-0 items-center gap-3 sm:gap-4">
                  <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-600 text-sm text-white shadow-md shadow-sky-500/25 sm:h-12 sm:w-12 sm:text-base">
                    <i class="fa-solid fa-tag"></i>
                  </div>
                  <div class="min-w-0">
                    <h3 class="text-sm font-semibold text-slate-950 sm:text-lg">{{ toTitleCase(group.groupName) }}</h3>
                    <p class="mt-0.5 text-[11px] text-slate-500 sm:text-xs">{{ group.products.length }} products</p>
                  </div>
                </div>
                <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 sm:h-10 sm:w-10">
                  <i class="fa-solid fa-chevron-right text-[10px] sm:text-xs"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- Product Checklist -->
          <div v-else>
            <div class="space-y-1.5 sm:space-y-2">
              <label v-for="(product, idx) in selectedGroup.products" :key="idx"
                class="sr-check-card flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-all sm:rounded-2xl sm:p-4"
                :class="checkedMap[product.productName] ? 'sr-check-active' : ''">
                <div class="relative flex-shrink-0">
                  <input type="checkbox" :checked="checkedMap[product.productName]" @change="toggleCheck(product.productName)"
                    class="peer sr-only" />
                  <div class="flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-all sm:h-7 sm:w-7 sm:rounded-xl"
                    :class="checkedMap[product.productName] ? 'border-sky-500 bg-sky-500 text-white' : 'border-slate-300 bg-white text-transparent'">
                    <i class="fa-solid fa-check text-[10px] sm:text-xs"></i>
                  </div>
                </div>
                <div class="min-w-0 flex-1">
                  <h4 class="text-[13px] font-semibold leading-snug text-slate-900 sm:text-sm">{{ toTitleCase(product.productName) }}</h4>
                </div>
                <span class="flex-shrink-0 font-mono text-xs font-semibold tabular-nums text-slate-500 sm:text-sm">
                  {{ product.quantity || 0 }} pcs
                </span>
              </label>
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
import { generateSampleRoomPDF } from '../utils/pdfSampleRoom';
import axios from 'axios';

const router = useRouter();
const appStore = useAppStore();
const { stockData } = storeToRefs(appStore);
const { loadStockData } = useStockData();

const loading = ref(true);
const saving = ref(false);
const selectedGroup = ref(null);
const checkedMap = ref({});
const brandSearch = ref('');

// Build checkedMap from inSampleRoom flags in stockData
const initCheckedMap = () => {
  const map = {};
  if (!stockData.value) return map;
  stockData.value.forEach(group => {
    if (!group.products) return;
    group.products.forEach(p => {
      if (p.inSampleRoom) map[p.productName] = true;
    });
  });
  checkedMap.value = map;
};

onMounted(async () => {
  if (!stockData.value || stockData.value.length === 0) {
    await loadStockData();
  }
  initCheckedMap();
  loading.value = false;
});

// Re-init if stockData changes (e.g. after a sync)
watch(stockData, () => { initCheckedMap(); }, { deep: false });

const groups = computed(() => {
  if (!stockData.value) return [];
  return stockData.value
    .filter(g => g.groupName !== '_META_DATA_' && g.products && g.products.length > 0)
    .sort((a, b) => a.groupName.localeCompare(b.groupName));
});

const filteredGroups = computed(() => {
  if (!brandSearch.value) return groups.value;
  const q = brandSearch.value.toLowerCase();
  return groups.value.filter(g => g.groupName.toLowerCase().includes(q));
});

const checkedCount = computed(() => {
  if (!selectedGroup.value) return 0;
  return selectedGroup.value.products.filter(p => checkedMap.value[p.productName]).length;
});

const selectGroup = (group) => { selectedGroup.value = group; };

const handleBack = () => {
  if (selectedGroup.value) {
    selectedGroup.value = null;
  } else {
    router.push('/');
  }
};

// Persist changes to backend -> stock-data.json
const persistToBackend = async (updates) => {
  try {
    saving.value = true;
    await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/updateSampleRoom`, { updates });
  } catch (err) {
    console.warn('Backend save failed (offline?):', err.message);
  } finally {
    saving.value = false;
  }
};

const toggleCheck = (name) => {
  const newVal = !checkedMap.value[name];
  checkedMap.value[name] = newVal;
  // Also update the reactive stockData so it stays in sync
  stockData.value.forEach(g => {
    if (!g.products) return;
    g.products.forEach(p => {
      if (p.productName === name) p.inSampleRoom = newVal;
    });
  });
  persistToBackend({ [name]: newVal });
};

const selectAll = () => {
  const updates = {};
  selectedGroup.value.products.forEach(p => {
    checkedMap.value[p.productName] = true;
    p.inSampleRoom = true;
    updates[p.productName] = true;
  });
  persistToBackend(updates);
};

const selectNone = () => {
  const updates = {};
  selectedGroup.value.products.forEach(p => {
    checkedMap.value[p.productName] = false;
    p.inSampleRoom = false;
    updates[p.productName] = false;
  });
  persistToBackend(updates);
};

const printPDF = async () => {
  const products = selectedGroup.value.products.map(p => ({
    productName: p.productName,
    quantity: p.quantity || 0,
    present: !!checkedMap.value[p.productName],
  }));
  await generateSampleRoomPDF(selectedGroup.value.groupName, products);
};

const toTitleCase = (str) => {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};
</script>

<style scoped>
.sr-shell {
  background-color: #f0f9ff;
  background-image:
    radial-gradient(1100px 560px at 15% -8%, rgba(56, 189, 248, 0.18), transparent 52%),
    radial-gradient(900px 480px at 90% 25%, rgba(34, 211, 238, 0.10), transparent 48%),
    radial-gradient(600px 400px at 50% 100%, rgba(14, 165, 233, 0.06), transparent 45%);
}
.sr-header-sticky { pointer-events: none; }
.sr-header-sticky > * { pointer-events: auto; }
.sr-header-card {
  border-radius: 1.75rem;
  background: rgba(255,255,255,0.75);
  backdrop-filter: blur(20px) saturate(1.35);
  -webkit-backdrop-filter: blur(20px) saturate(1.35);
  box-shadow: 0 1px 0 rgba(255,255,255,0.9) inset, 0 24px 48px -20px rgba(15,23,42,0.14), 0 0 0 1px rgba(255,255,255,0.5);
}
.sr-back-btn {
  background: #fff;
  box-shadow: 0 4px 14px rgba(15,23,42,0.08), 0 0 0 1px rgba(226,232,240,0.9);
}
.sr-back-btn:hover { color: #0369a1; box-shadow: 0 8px 24px rgba(14,165,233,0.2), 0 0 0 1px rgba(125,211,252,0.5); }
.sr-action-btn {
  background: rgba(255,255,255,0.9);
  color: #475569;
  box-shadow: 0 2px 8px rgba(15,23,42,0.06), 0 0 0 1px rgba(226,232,240,0.7);
}
.sr-action-btn:hover { color: #0369a1; }
.sr-print-btn {
  background: linear-gradient(135deg, #0284c7, #0369a1);
  box-shadow: 0 8px 20px rgba(14,165,233,0.35);
}
.sr-print-btn:hover { filter: brightness(1.08); }
.sr-state-card {
  background: rgba(255,255,255,0.75);
  backdrop-filter: blur(12px);
  box-shadow: 0 24px 48px -18px rgba(15,23,42,0.1), 0 0 0 1px rgba(255,255,255,0.6);
}
.sr-search {
  background: rgba(255,255,255,0.95);
  box-shadow: 0 4px 20px rgba(15,23,42,0.06), 0 0 0 1px rgba(226,232,240,0.9);
}
.sr-search:focus { box-shadow: 0 8px 28px rgba(14,165,233,0.12), 0 0 0 3px rgba(56,189,248,0.3); }
.sr-float-card {
  background: rgba(255,255,255,0.92);
  box-shadow: 0 16px 36px -16px rgba(15,23,42,0.15), 0 0 0 1px rgba(255,255,255,0.85) inset;
}
.sr-float-card:hover { box-shadow: 0 20px 44px -16px rgba(14,165,233,0.18), 0 0 0 1px rgba(186,230,253,0.4) inset; }
.sr-check-card {
  background: rgba(255,255,255,0.88);
  box-shadow: 0 4px 16px -8px rgba(15,23,42,0.1), 0 0 0 1px rgba(226,232,240,0.5);
}
.sr-check-active {
  background: rgba(224,242,254,0.7);
  box-shadow: 0 4px 16px -8px rgba(14,165,233,0.15), 0 0 0 1px rgba(125,211,252,0.4);
}
</style>
