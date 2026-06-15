<template>
  <div class="oldstock-shell min-h-screen w-full font-sans text-slate-800">
    <main class="w-full pt-[54px] lg:pt-[72px] min-h-screen flex flex-col">
      <!-- Header -->
      <div class="oldstock-header-sticky sticky top-[54px] lg:top-[72px] z-40 px-2.5 pt-2 pb-1.5 sm:px-5 sm:pt-4 sm:pb-2 lg:px-6 xl:px-10">
        <div class="oldstock-header-card mx-auto flex w-full max-w-5xl flex-col gap-2 p-3 sm:p-5">
          <div class="flex items-center gap-2 sm:gap-4">
            <button type="button" @click="router.push('/home')" class="oldstock-back-btn flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-slate-600 transition-all active:scale-95 sm:h-12 sm:w-12" title="Back to Home">
              <i class="fa-solid fa-arrow-left text-sm sm:text-[15px]"></i>
            </button>
            <div class="flex-1 min-w-0">
              <h1 class="text-lg font-bold tracking-tight text-slate-950 sm:text-2xl flex items-center gap-2">
                <i class="fa-solid fa-camera-retro text-indigo-500"></i>
                Products Without Photos
              </h1>
              <p class="text-[11px] text-slate-500 sm:text-xs">All groups · Sorted by quantity</p>
            </div>
            <!-- Summary Badges -->
            <div class="hidden sm:flex items-center gap-2">
              <span class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
                <i class="fa-solid fa-box-open text-slate-400"></i>
                {{ totalProducts }} products
              </span>
              <span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                <i class="fa-solid fa-cubes text-emerald-400"></i>
                {{ totalGroups }} groups
              </span>
            </div>
          </div>

          <!-- Search Bar & Controls -->
          <div class="flex flex-col sm:flex-row gap-3 mt-1">
            <div class="relative flex-1">
              <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search products, groups..."
                class="oldstock-search w-full rounded-xl bg-slate-50/80 border border-slate-200/60 pl-9 pr-9 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
              <button
                v-if="searchQuery"
                @click="searchQuery = ''"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <i class="fa-solid fa-xmark text-xs"></i>
              </button>
            </div>
            <div class="flex items-center gap-2 sm:w-auto">
              <!-- Toggle Out of Stock -->
              <label class="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl bg-slate-50/80 border border-slate-200/60 px-3 py-2.5 cursor-pointer hover:bg-slate-100 transition-colors">
                <input type="checkbox" v-model="hideOutOfStock" class="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500">
                <span class="text-xs font-semibold text-slate-700 whitespace-nowrap">Hide Out of Stock</span>
              </label>
              
              <!-- Print Button -->
              <button @click="handlePrint" class="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition-all">
                <i class="fa-solid fa-print text-sm"></i>
                <span class="text-xs font-bold whitespace-nowrap">Print PDF</span>
              </button>
            </div>
          </div>

          <!-- Mobile Summary -->
          <div class="flex sm:hidden items-center gap-2 mt-0.5">
            <span class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
              {{ totalProducts }} products
            </span>
            <span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600">
              {{ totalGroups }} groups
            </span>
            <span v-if="searchQuery" class="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-600">
              {{ filteredCount }} results
            </span>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 px-2.5 pt-2 pb-16 sm:px-5 sm:pt-4 lg:px-6 xl:px-10">
        <div class="mx-auto w-full max-w-5xl">

          <!-- Loading State -->
          <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-4">
            <div class="w-10 h-10 rounded-full border-[3px] border-slate-200 border-t-indigo-500 animate-spin"></div>
            <p class="text-sm text-slate-500">Loading stock data…</p>
          </div>

          <!-- Empty State -->
          <div v-else-if="filteredGroups.length === 0 && searchQuery" class="flex flex-col items-center justify-center py-20 gap-3">
            <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
              <i class="fa-solid fa-search text-2xl text-slate-300"></i>
            </div>
            <p class="text-sm font-medium text-slate-500">No results for "{{ searchQuery }}"</p>
            <button @click="searchQuery = ''" class="text-xs text-indigo-500 hover:text-indigo-600 font-medium">Clear search</button>
          </div>

          <!-- Groups -->
          <div v-else class="space-y-3 sm:space-y-4">
            <div
              v-for="group in filteredGroups"
              :key="group.groupName"
              class="oldstock-group-card rounded-2xl sm:rounded-[1.75rem] overflow-hidden"
            >
              <!-- Group Header -->
              <button
                @click="toggleGroup(group.groupName)"
                class="w-full flex items-center justify-between px-4 py-3 sm:px-5 sm:py-3.5 transition-colors hover:bg-slate-50/50"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    :style="{ background: getGroupGradient(group.groupName) }">
                    <span class="text-white font-bold text-xs sm:text-sm">{{ group.groupName.charAt(0) }}</span>
                  </div>
                  <div class="min-w-0 text-left">
                    <h3 class="text-sm sm:text-[15px] font-bold text-slate-900 truncate">{{ group.groupName }}</h3>
                    <p class="text-[10px] sm:text-[11px] text-slate-400">
                      {{ group.products.length }} products without photo
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="hidden sm:inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                    :class="group.inStockCount > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-500'">
                    {{ group.inStockCount }} in stock
                  </span>
                  <i class="fa-solid fa-chevron-down text-[10px] text-slate-400 transition-transform duration-200"
                    :class="{ 'rotate-180': expandedGroups.has(group.groupName) }"></i>
                </div>
              </button>

              <!-- Collapsible Table -->
              <transition
                enter-active-class="transition-all duration-300 ease-out"
                enter-from-class="max-h-0 opacity-0"
                enter-to-class="max-h-[9999px] opacity-100"
                leave-active-class="transition-all duration-200 ease-in"
                leave-from-class="max-h-[9999px] opacity-100"
                leave-to-class="max-h-0 opacity-0"
              >
                <div v-if="expandedGroups.has(group.groupName)" class="overflow-hidden">
                  <div class="border-t border-slate-100">
                    <table class="w-full">
                      <thead>
                        <tr class="bg-slate-50/70">
                          <th class="px-4 py-2 text-left text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-10">#</th>
                          <th class="px-4 py-2 text-left text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Product Name</th>
                          <th class="px-4 py-2 text-right text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-20">Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(product, idx) in group.products"
                          :key="product.productName"
                          class="border-t border-slate-50 transition-colors"
                          :class="product.quantity === 0 ? 'opacity-40' : 'hover:bg-indigo-50/30'"
                        >
                          <td class="px-4 py-2 text-[10px] sm:text-[11px] text-slate-400 font-medium">{{ idx + 1 }}</td>
                          <td class="px-4 py-2 text-xs sm:text-[13px] text-slate-800 font-medium">
                            <span v-html="highlightMatch(product.productName)"></span>
                          </td>
                          <td class="px-4 py-2 text-right">
                            <span class="inline-flex items-center justify-center min-w-[28px] rounded-lg px-2 py-0.5 text-xs sm:text-[13px] font-bold"
                              :class="product.quantity > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-400 text-[11px]'">
                              {{ product.quantity }}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </transition>
            </div>
          </div>

        </div>
      </div>
    </main>

    <!-- Hidden Print Area -->
    <div id="print-area" class="print-only">
      <div class="print-header">
        <h1>Products Without Photos</h1>
        <p>M/S Sri Brundaban Enterprises</p>
        <p>Date: {{ new Date().toLocaleDateString('en-IN') }} | Filter: {{ hideOutOfStock ? 'In-Stock Only' : 'All Products' }}</p>
      </div>
      
      <div v-for="group in filteredGroups" :key="group.groupName" class="print-group">
        <h2>{{ group.groupName }} <span>({{ group.products.length }} items)</span></h2>
        <table>
          <thead>
            <tr>
              <th style="width: 5%">#</th>
              <th style="width: 80%">Product Name</th>
              <th style="width: 15%; text-align: right;">Qty</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(product, idx) in group.products" :key="product.productName">
              <td>{{ idx + 1 }}</td>
              <td><span v-html="product.productName"></span></td>
              <td style="text-align: right;"><b>{{ product.quantity }}</b></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const searchQuery = ref('');
const hideOutOfStock = ref(true);
const loading = ref(true);
const allGroupsData = ref([]);
const expandedGroups = ref(new Set());

const handlePrint = () => {
  window.print();
};

// Fetch stock data
const fetchStockData = async () => {
  loading.value = true;
  try {
    // Try fetching from GitHub raw (live data)
    const res = await fetch('https://raw.githubusercontent.com/sahilsync07/sbe/refs/heads/main/frontend/public/assets/stock-data.json');
    const data = await res.json();
    processData(data);
  } catch (err) {
    try {
      // Fallback to local
      const base = import.meta.env.BASE_URL || '/sbe/';
      const res = await fetch(`${base}assets/stock-data.json`);
      const data = await res.json();
      processData(data);
    } catch (e) {
      console.error('Failed to load stock data', e);
    }
  }
  loading.value = false;
};

const processData = (data) => {
  const results = [];
  for (const group of data) {
    if (!group.groupName || group.groupName === '_META_DATA_') continue;
    const noPhotoProducts = group.products
      .filter(p => !p.imageUrl || p.imageUrl === null || p.imageUrl === '')
      .map(p => ({ productName: p.productName, quantity: p.quantity }))
      .sort((a, b) => b.quantity - a.quantity);
    if (noPhotoProducts.length > 0) {
      results.push({
        groupName: group.groupName,
        products: noPhotoProducts,
        inStockCount: noPhotoProducts.filter(p => p.quantity > 0).length,
      });
    }
  }
  // Sort groups by total no-photo products descending
  results.sort((a, b) => b.products.length - a.products.length);
  allGroupsData.value = results;
};

// Filter by stock
const baseGroups = computed(() => {
  if (!hideOutOfStock.value) return allGroupsData.value;
  return allGroupsData.value.map(g => ({
    ...g,
    products: g.products.filter(p => p.quantity > 0)
  })).filter(g => g.products.length > 0);
});

// Filter by search
const filteredGroups = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  const results = [];
  
  for (const group of baseGroups.value) {
    if (!q) {
      results.push({ ...group, inStockCount: group.products.filter(p=>p.quantity>0).length });
      continue;
    }
    const groupNameMatch = group.groupName.toLowerCase().includes(q);
    const matchingProducts = group.products.filter(p => p.productName.toLowerCase().includes(q));
    
    if (groupNameMatch) {
      results.push({ ...group, inStockCount: group.products.filter(p=>p.quantity>0).length });
    } else if (matchingProducts.length > 0) {
      results.push({
        ...group,
        products: matchingProducts,
        inStockCount: matchingProducts.filter(p => p.quantity > 0).length,
      });
    }
  }
  return results.sort((a, b) => b.products.length - a.products.length);
});

const totalProducts = computed(() => baseGroups.value.reduce((sum, g) => sum + g.products.length, 0));
const totalGroups = computed(() => baseGroups.value.length);
const filteredCount = computed(() => filteredGroups.value.reduce((sum, g) => sum + g.products.length, 0));

const toggleGroup = (name) => {
  const s = new Set(expandedGroups.value);
  if (s.has(name)) s.delete(name);
  else s.add(name);
  expandedGroups.value = s;
};

// Color generator for group avatars
const getGroupGradient = (name) => {
  const colors = [
    'linear-gradient(135deg, #6366f1, #8b5cf6)',
    'linear-gradient(135deg, #0ea5e9, #06b6d4)',
    'linear-gradient(135deg, #f59e0b, #d97706)',
    'linear-gradient(135deg, #ef4444, #dc2626)',
    'linear-gradient(135deg, #10b981, #059669)',
    'linear-gradient(135deg, #64748b, #475569)',
    'linear-gradient(135deg, #ec4899, #be185d)',
    'linear-gradient(135deg, #8b5cf6, #db2777)',
    'linear-gradient(135deg, #22c55e, #16a34a)',
    'linear-gradient(135deg, #14b8a6, #0d9488)',
    'linear-gradient(135deg, #f97316, #ea580c)',
    'linear-gradient(135deg, #3b82f6, #2563eb)',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

// Highlight search match in product name
const highlightMatch = (text) => {
  if (!searchQuery.value.trim()) return text;
  const q = searchQuery.value.trim();
  const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200/80 text-yellow-900 rounded px-0.5">$1</mark>');
};

onMounted(() => {
  fetchStockData();
});
</script>

<style scoped>
.oldstock-shell {
  background-color: #fafafa;
  background-image:
    radial-gradient(1000px 500px at 50% -5%, rgba(99,102,241,0.12), transparent 50%),
    radial-gradient(800px 400px at 80% 80%, rgba(14,165,233,0.08), transparent 45%);
}
.oldstock-header-sticky { pointer-events: none; }
.oldstock-header-sticky > * { pointer-events: auto; }
.oldstock-header-card {
  border-radius: 1.75rem;
  background: rgba(255,255,255,0.75);
  backdrop-filter: blur(20px) saturate(1.35);
  -webkit-backdrop-filter: blur(20px) saturate(1.35);
  box-shadow: 0 1px 0 rgba(255,255,255,0.9) inset, 0 20px 40px -18px rgba(15,23,42,0.12), 0 0 0 1px rgba(255,255,255,0.5);
}
.oldstock-back-btn {
  background: #fff;
  box-shadow: 0 4px 14px rgba(15,23,42,0.08), 0 0 0 1px rgba(226,232,240,0.9);
}
.oldstock-group-card {
  background: rgba(255,255,255,0.9);
  box-shadow: 0 16px 36px -16px rgba(15,23,42,0.10), 0 0 0 1px rgba(255,255,255,0.8) inset;
}
.oldstock-search:focus {
  background: rgba(255,255,255,0.95);
}

/* Print Styles */
.print-only { display: none; }

@media print {
  .oldstock-shell > main { display: none !important; }
  .oldstock-shell { background: white !important; min-height: auto; }
  
  .print-only {
    display: block !important;
    width: 100%;
    color: #000;
  }
  
  @page {
    size: A4;
    margin: 1.5cm;
  }
  
  .print-header {
    text-align: center;
    margin-bottom: 20px;
    border-bottom: 2px solid #000;
    padding-bottom: 10px;
  }
  .print-header h1 { font-size: 18pt; font-weight: bold; margin-bottom: 5px; color: #000; }
  .print-header p { font-size: 10pt; margin: 2px 0; color: #333; }
  
  .print-group {
    margin-bottom: 15px;
    page-break-inside: avoid;
  }
  .print-group h2 {
    font-size: 11pt;
    font-weight: bold;
    margin-bottom: 5px;
    background: #f1f5f9;
    padding: 6px 10px;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    color: #000;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .print-group h2 span { font-size: 9pt; font-weight: normal; color: #64748b; margin-left: 5px; }
  
  .print-group table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5pt;
  }
  .print-group th, .print-group td {
    border: 1px solid #cbd5e1;
    padding: 4px 8px;
    text-align: left;
    color: #000;
  }
  .print-group th {
    background: #f8fafc;
    font-weight: bold;
    color: #334155;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
</style>
