<template>
  <div class="line-list-shell min-h-screen w-full font-sans text-slate-800 pb-28 antialiased selection:bg-violet-500 selection:text-white">
    <!-- Ambient Background Glow -->
    <div class="fixed inset-0 pointer-events-none -z-10" style="background: radial-gradient(ellipse 900px 500px at 50% -5%, rgba(99,102,241,0.12), transparent), radial-gradient(ellipse 700px 400px at 85% 90%, rgba(139,92,246,0.08), transparent), radial-gradient(ellipse 600px 350px at 10% 70%, rgba(20,184,166,0.06), transparent), #f8fafc;"></div>

    <main class="w-full pt-[54px] lg:pt-[72px] flex flex-col items-center">
      <!-- ═══ Header Bar ═══ -->
      <div class="sticky top-[54px] lg:top-[72px] z-30 w-full px-2.5 pt-2 pb-1.5 sm:px-5 sm:pt-4 sm:pb-2 xl:px-10">
        <div class="mx-auto w-full max-w-5xl rounded-2xl sm:rounded-[1.75rem] p-3 sm:p-5 flex items-center justify-between"
          style="background: rgba(255,255,255,0.80); backdrop-filter: blur(24px) saturate(1.4); box-shadow: 0 1px 0 rgba(255,255,255,0.95) inset, 0 20px 50px -18px rgba(15,23,42,0.14), 0 0 0 1px rgba(255,255,255,0.55);">
          <div class="flex items-center gap-3 sm:gap-4">
            <button @click="router.push('/home')"
              class="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-white/90 text-slate-600 shadow-xs border border-slate-200/60 transition-all hover:scale-105 hover:shadow-md active:scale-95 cursor-pointer" title="Back">
              <i class="fa-solid fa-arrow-left text-sm sm:text-base"></i>
            </button>
            <div>
              <div class="flex items-center gap-2.5">
                <h1 class="text-lg sm:text-2xl font-black tracking-tight text-slate-900">Line List</h1>
                <span class="px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-100 to-indigo-100 text-[10px] font-black text-violet-700 uppercase tracking-wider border border-violet-200/60">
                  Generator
                </span>
              </div>
              <p class="text-[11px] sm:text-xs text-slate-400 font-semibold mt-0.5">Print debtor balances by area with itemized bills</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="w-full max-w-5xl px-2.5 pt-3 sm:px-5 sm:pt-5 xl:px-10 flex flex-col gap-4 sm:gap-5">
        
        <!-- Loading -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-24 space-y-4">
          <div class="w-14 h-14 rounded-full border-[3px] border-violet-200 border-t-violet-600 animate-spin"></div>
          <p class="text-sm font-bold text-slate-500 animate-pulse">Loading lines data…</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="bg-rose-50 text-rose-700 p-5 rounded-2xl text-center font-semibold border border-rose-200 shadow-xs space-y-2">
          <i class="fa-solid fa-circle-exclamation text-rose-500 text-xl"></i>
          <p class="text-sm">{{ error }}</p>
        </div>

        <template v-else>
          <!-- ═══ Date Range + Style Selector Card ═══ -->
          <div class="bg-white/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs border border-slate-200/80 backdrop-blur-sm space-y-5">
            <!-- Date Range -->
            <div>
              <h2 class="text-xs font-black text-slate-700 mb-3 uppercase tracking-wider flex items-center gap-2">
                <span class="w-7 h-7 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center text-sm"><i class="fa-regular fa-calendar"></i></span>
                Date Range
              </h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-bold text-slate-400 mb-1.5 ml-1 uppercase tracking-wider">From</label>
                  <input type="date" v-model="fromDate"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10" />
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-slate-400 mb-1.5 ml-1 uppercase tracking-wider">To</label>
                  <input type="date" v-model="toDate"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10" />
                </div>
              </div>
              <p class="mt-2.5 text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <i class="fa-solid fa-circle-info text-slate-300"></i> Leaving dates empty prints all-time balances.
              </p>
            </div>

            <!-- PDF Style Toggle -->
            <div class="border-t border-slate-100 pt-4">
              <h2 class="text-xs font-black text-slate-700 mb-3 uppercase tracking-wider flex items-center gap-2">
                <span class="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-sm"><i class="fa-solid fa-palette"></i></span>
                PDF Style
              </h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <!-- Classic Style -->
                <button @click="pdfStyle = 'classic'"
                  class="group relative p-4 rounded-2xl border-2 transition-all duration-200 text-left cursor-pointer"
                  :class="pdfStyle === 'classic'
                    ? 'border-slate-800 bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm text-slate-700'">
                  <div class="flex items-center gap-3 mb-2">
                    <div class="w-9 h-9 rounded-xl flex items-center justify-center text-sm"
                      :class="pdfStyle === 'classic' ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-500'">
                      <i class="fa-solid fa-table-list"></i>
                    </div>
                    <div>
                      <div class="text-sm font-black">Classic</div>
                      <div class="text-[10px] font-semibold" :class="pdfStyle === 'classic' ? 'text-slate-300' : 'text-slate-400'">
                        Combined totals
                      </div>
                    </div>
                  </div>
                  <p class="text-[11px] leading-relaxed" :class="pdfStyle === 'classic' ? 'text-slate-400' : 'text-slate-500'">
                    Bills & payments shown as single combined amounts. Clean, compact layout.
                  </p>
                  <div v-if="pdfStyle === 'classic'" class="absolute top-3 right-3">
                    <i class="fa-solid fa-circle-check text-emerald-400"></i>
                  </div>
                </button>

                <!-- Detailed Style -->
                <button @click="pdfStyle = 'detailed'"
                  class="group relative p-4 rounded-2xl border-2 transition-all duration-200 text-left cursor-pointer"
                  :class="pdfStyle === 'detailed'
                    ? 'border-violet-600 bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-lg shadow-violet-600/25'
                    : 'border-slate-200 bg-white hover:border-violet-200 hover:shadow-sm text-slate-700'">
                  <div class="flex items-center gap-3 mb-2">
                    <div class="w-9 h-9 rounded-xl flex items-center justify-center text-sm"
                      :class="pdfStyle === 'detailed' ? 'bg-white/15 text-white' : 'bg-violet-100 text-violet-500'">
                      <i class="fa-solid fa-receipt"></i>
                    </div>
                    <div>
                      <div class="text-sm font-black">Detailed</div>
                      <div class="text-[10px] font-semibold" :class="pdfStyle === 'detailed' ? 'text-violet-200' : 'text-slate-400'">
                        Itemized bills & payments
                      </div>
                    </div>
                  </div>
                  <p class="text-[11px] leading-relaxed" :class="pdfStyle === 'detailed' ? 'text-violet-200' : 'text-slate-500'">
                    Each bill & payment listed individually with date & amount, bold total underneath.
                  </p>
                  <div v-if="pdfStyle === 'detailed'" class="absolute top-3 right-3">
                    <i class="fa-solid fa-circle-check text-emerald-300"></i>
                  </div>
                  <span v-if="pdfStyle !== 'detailed'" class="absolute top-3 right-3 px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-700 text-[9px] font-black uppercase">
                    New
                  </span>
                </button>
              </div>
            </div>
          </div>

          <!-- ═══ Lines Selection Card ═══ -->
          <div class="bg-white/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs border border-slate-200/80 backdrop-blur-sm">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <span class="w-7 h-7 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center text-sm"><i class="fa-solid fa-map-location-dot"></i></span>
                Select Lines
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 normal-case">
                  {{ selectedLines.length }}/{{ availableLines.length }}
                </span>
              </h2>
              <button @click="toggleSelectAll"
                class="text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer"
                :class="selectedLines.length === availableLines.length
                  ? 'bg-slate-900 text-white shadow-xs hover:bg-slate-800'
                  : 'bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200/60'">
                {{ selectedLines.length === availableLines.length ? 'Deselect All' : 'Select All' }}
              </button>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <label v-for="line in availableLines" :key="line" 
                class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:shadow-xs active:scale-[0.99]"
                :class="selectedLines.includes(line)
                  ? 'border-violet-400 bg-violet-50/60 shadow-xs'
                  : 'border-slate-200/80 hover:border-slate-300 bg-white'">
                <div class="relative flex items-center">
                  <input type="checkbox" :value="line" v-model="selectedLines"
                    class="w-4 h-4 rounded-md text-violet-600 focus:ring-violet-500 border-slate-300 transition-all" />
                </div>
                <span class="text-sm font-semibold truncate" :title="line"
                  :class="selectedLines.includes(line) ? 'text-violet-900' : 'text-slate-600'">{{ line }}</span>
              </label>
            </div>
          </div>

          <!-- ═══ Sticky Bottom Action Bar ═══ -->
          <div class="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.25rem)] max-w-5xl">
            <div class="bg-white/95 backdrop-blur-xl rounded-2xl p-3.5 sm:p-4 shadow-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3"
              style="box-shadow: 0 -4px 30px -6px rgba(15,23,42,0.12), 0 25px 50px -12px rgba(15,23,42,0.18);">
              <div class="flex items-center gap-3 text-sm">
                <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200/60">
                  <span class="font-black text-violet-600">{{ selectedLines.length }}</span>
                  <span class="text-slate-500 font-semibold">lines selected</span>
                </div>
                <div class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold"
                  :class="pdfStyle === 'detailed' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'">
                  <i :class="pdfStyle === 'detailed' ? 'fa-solid fa-receipt' : 'fa-solid fa-table-list'" class="text-[10px]"></i>
                  {{ pdfStyle === 'detailed' ? 'Detailed' : 'Classic' }} Mode
                </div>
              </div>
              <button @click="handlePrint" :disabled="isGenerating || selectedLines.length === 0"
                class="w-full sm:w-auto px-7 py-3 rounded-xl font-black text-white shadow-md transition-all flex items-center justify-center gap-2.5 text-sm"
                :class="selectedLines.length === 0
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 cursor-pointer shadow-violet-600/25'">
                <i class="fa-solid" :class="isGenerating ? 'fa-spinner fa-spin' : 'fa-print'"></i>
                {{ isGenerating ? 'Generating PDF…' : 'Print Line List' }}
              </button>
            </div>
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
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { toast } from 'vue3-toastify';

const router = useRouter();

const loading = ref(true);
const error = ref(null);
const isGenerating = ref(false);

const ledgerData = ref([]);
const availableLines = ref([]);
const selectedLines = ref([]);

const fromDate = ref('');
const toDate = ref('');
const pdfStyle = ref('classic'); // 'classic' | 'detailed'

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
    let data;
    try {
      const baseUrl = import.meta.env.BASE_URL || '/';
      const localUrl = baseUrl.endsWith('/') ? `${baseUrl}assets/ledger-data.json` : `${baseUrl}/assets/ledger-data.json`;
      const res = await fetch(`${localUrl}?t=${new Date().getTime()}`);
      if (!res.ok) throw new Error('Local fetch failed');
      data = await res.json();
    } catch (localErr) {
      console.warn('Local ledger-data fetch failed, falling back to raw github:', localErr);
      const res = await fetch('https://raw.githubusercontent.com/sahilsync07/sbe/refs/heads/main/frontend/public/assets/ledger-data.json');
      if (!res.ok) throw new Error('Failed to load ledger data from raw GitHub');
      data = await res.json();
    }
    
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

    const pdfOptions = { style: pdfStyle.value };
    
    if (Capacitor.isNativePlatform() || Capacitor.getPlatform() === 'android') {
      const pdfDataUri = await generateLineListPDF(selectedLines.value, from, to, ledgerData.value, { ...pdfOptions, returnBase64: true });
      if (!pdfDataUri) throw new Error('Failed to generate PDF');

      const base64Data = pdfDataUri.includes(',') ? pdfDataUri.split(',')[1] : pdfDataUri;
      const fileName = `LineList_${pdfStyle.value === 'detailed' ? 'Detailed_' : ''}${Date.now()}.pdf`;
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache
      });

      await Share.share({
        title: 'Line List PDF',
        text: `Line List (${selectedLines.value.join(', ')}) - ${pdfStyle.value === 'detailed' ? 'Detailed' : 'Classic'}`,
        files: [savedFile.uri]
      });
      toast.success('Line List PDF ready to share!', { autoClose: 2500 });
    } else {
      if (typeof navigator !== 'undefined' && navigator.canShare && typeof navigator.share === 'function') {
        try {
          const pdfBlob = await generateLineListPDF(selectedLines.value, from, to, ledgerData.value, { ...pdfOptions, returnBlob: true });
          if (pdfBlob) {
            const file = new File([pdfBlob], `LineList_${Date.now()}.pdf`, { type: 'application/pdf' });
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                title: 'Line List PDF',
                files: [file]
              });
              toast.success('Line List PDF shared!', { autoClose: 2500 });
              return;
            }
          }
        } catch (shareErr) {
          if (shareErr.name !== 'AbortError') {
            console.warn('Web Share fallback to direct download:', shareErr);
          } else {
            return;
          }
        }
      }

      const success = await generateLineListPDF(selectedLines.value, from, to, ledgerData.value, pdfOptions);
      if (success) {
        toast.success(`Line List PDF (${pdfStyle.value === 'detailed' ? 'Detailed' : 'Classic'}) downloaded!`, { autoClose: 2500 });
      } else {
        alert('Failed to generate PDF. Check console for details.');
      }
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
}
</style>
