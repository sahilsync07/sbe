<template>
  <div class="line-list-shell min-h-screen w-full font-sans text-slate-800 pb-20">
    <main class="w-full pt-[54px] lg:pt-[72px] flex flex-col items-center">
      <!-- Header -->
      <div class="sticky top-[54px] lg:top-[72px] z-30 w-full px-2.5 pt-2 pb-1.5 sm:px-5 sm:pt-4 sm:pb-2 xl:px-10">
        <div class="mx-auto w-full max-w-4xl rounded-2xl sm:rounded-[1.75rem] p-3 sm:p-5 flex items-center justify-between"
          style="background: rgba(255,255,255,0.75); backdrop-filter: blur(20px) saturate(1.35); box-shadow: 0 1px 0 rgba(255,255,255,0.9) inset, 0 20px 40px -18px rgba(15,23,42,0.12), 0 0 0 1px rgba(255,255,255,0.5);">
          <div class="flex items-center gap-3 sm:gap-4">
            <button @click="router.push('/home')"
              class="flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm border border-slate-200/60 transition-all hover:scale-105 active:scale-95" title="Back">
              <i class="fa-solid fa-arrow-left text-sm sm:text-base"></i>
            </button>
            <div>
              <h1 class="text-lg sm:text-2xl font-bold tracking-tight text-slate-900">Line List</h1>
              <p class="text-[11px] sm:text-xs text-slate-500 font-medium">Print debtor balances by area</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="w-full max-w-4xl px-2.5 pt-2 sm:px-5 sm:pt-4 xl:px-10 flex flex-col gap-4 sm:gap-6">
        
        <div v-if="loading" class="flex flex-col items-center justify-center py-20">
          <i class="fa-solid fa-circle-notch fa-spin text-3xl text-indigo-500 mb-4"></i>
          <p class="text-slate-500 font-medium animate-pulse">Loading lines data...</p>
        </div>

        <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-xl text-center font-medium border border-red-100">
          <i class="fa-solid fa-triangle-exclamation mr-2"></i> {{ error }}
        </div>

        <template v-else>
          <!-- Date Selection -->
          <div class="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100">
            <h2 class="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider flex items-center gap-2">
              <i class="fa-regular fa-calendar text-indigo-500"></i> Date Range
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">From Date</label>
                <input type="date" v-model="fromDate"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">To Date</label>
                <input type="date" v-model="toDate"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" />
              </div>
            </div>
            <p class="mt-3 text-xs text-slate-400">
              <i class="fa-solid fa-circle-info mr-1"></i> Leaving dates empty will print all-time balances.
            </p>
          </div>

          <!-- Lines Selection -->
          <div class="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100 flex-1">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <i class="fa-solid fa-map-location-dot text-indigo-500"></i> Select Lines
              </h2>
              <button @click="toggleSelectAll" class="text-xs font-bold text-indigo-600 hover:text-indigo-700 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors">
                {{ selectedLines.length === availableLines.length ? 'Deselect All' : 'Select All' }}
              </button>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <label v-for="line in availableLines" :key="line" 
                class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:bg-slate-50"
                :class="selectedLines.includes(line) ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200'">
                <input type="checkbox" :value="line" v-model="selectedLines"
                  class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                <span class="text-sm font-medium text-slate-700 truncate" :title="line">{{ line }}</span>
              </label>
            </div>
          </div>

          <!-- Print Action -->
          <div class="sticky bottom-4 z-40 bg-white rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
            <div class="text-sm font-medium text-slate-600">
              <span class="font-bold text-indigo-600">{{ selectedLines.length }}</span> lines selected
            </div>
            <button @click="handlePrint" :disabled="isGenerating || selectedLines.length === 0"
              class="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-white shadow-md transition-all flex items-center justify-center gap-2"
              :class="selectedLines.length === 0 ? 'bg-slate-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 active:scale-95'">
              <i class="fa-solid" :class="isGenerating ? 'fa-spinner fa-spin' : 'fa-print'"></i>
              {{ isGenerating ? 'Generating PDF...' : 'Print Line List' }}
            </button>
          </div>
        </template>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { generateLineListPDF } from '../utils/pdfLineList';

const router = useRouter();

const loading = ref(true);
const error = ref(null);
const isGenerating = ref(false);

const ledgerData = ref([]);
const availableLines = ref([]);
const selectedLines = ref([]);

const fromDate = ref('');
const toDate = ref('');

// Standard Tally system groups to exclude from "Lines"
const SYSTEM_GROUPS = [
  "_META_DATA_", "&#4; Primary", "Bank Accounts", "Bank OD A/c", "Capital Account", 
  "Cash-in-Hand", "Current Assets", "Current Liabilities", "Direct Expenses", 
  "Direct Incomes", "Duties & Taxes", "Fixed Assets", "Indirect Expenses", 
  "Indirect Incomes", "Investments", "Petty Expenses", "Purchase Accounts", 
  "Sales Accounts", "SHAD", "STAFF", "Sundry Creditors", "Sundry Debtors", 
  "Unsecured Loans", "RETAILER MEET 3.12.2025"
];

onMounted(async () => {
  try {
    const res = await fetch('/assets/ledger-data.json');
    if (!res.ok) throw new Error('Failed to load ledger data');
    const data = await res.json();
    
    ledgerData.value = data;
    
    // Filter out standard tally groups to leave only area/line groups
    availableLines.value = data
      .map(g => g.groupName)
      .filter(name => !SYSTEM_GROUPS.includes(name))
      .sort((a, b) => a.localeCompare(b));
      
  } catch (err) {
    console.error(err);
    error.value = "Failed to load lines. Please ensure ledger-data.json is available.";
  } finally {
    loading.value = false;
  }
});

const toggleSelectAll = () => {
  if (selectedLines.value.length === availableLines.value.length) {
    selectedLines.value = [];
  } else {
    selectedLines.value = [...availableLines.value];
  }
};

const handlePrint = async () => {
  if (selectedLines.value.length === 0) return;
  
  isGenerating.value = true;
  try {
    const from = fromDate.value ? new Date(fromDate.value) : null;
    const to = toDate.value ? new Date(toDate.value) : null;
    
    // Validate dates
    if (from && isNaN(from.getTime())) throw new Error("Invalid From Date");
    if (to && isNaN(to.getTime())) throw new Error("Invalid To Date");
    if (from && to && from > to) {
      alert("From Date cannot be later than To Date.");
      isGenerating.value = false;
      return;
    }
    
    const success = await generateLineListPDF(selectedLines.value, from, to, ledgerData.value);
    
    if (!success) {
      alert("Failed to generate PDF. Check console for details.");
    }
  } catch (err) {
    alert("Error: " + err.message);
  } finally {
    isGenerating.value = false;
  }
};
</script>

<style scoped>
.line-list-shell {
  background-color: #f8fafc;
  background-image:
    radial-gradient(1000px 500px at 50% -5%, rgba(99,102,241,0.08), transparent 50%),
    radial-gradient(800px 400px at 80% 80%, rgba(236,72,153,0.05), transparent 45%);
}
</style>
