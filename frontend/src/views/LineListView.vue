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
              <div v-if="ledgerLastUpdatedFormatted" class="mt-1 flex items-center gap-1.5 text-[10px] sm:text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 w-fit">
                <i class="fa-solid fa-cloud-arrow-down text-[10px] text-emerald-600"></i>
                <span>Ledger data updated: {{ ledgerLastUpdatedFormatted }}</span>
              </div>
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
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                <h2 class="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <span class="w-7 h-7 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center text-sm"><i class="fa-regular fa-calendar"></i></span>
                  Date Range
                </h2>
                <!-- Quick Range Presets -->
                <div class="flex items-center gap-1.5 flex-wrap">
                  <button type="button" @click="setQuickRange(0)"
                    class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border"
                    :class="!fromDate && !toDate
                      ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'">
                    All Time
                  </button>
                  <button type="button" @click="setQuickRange(8)"
                    class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5"
                    :class="isPresetActive(8)
                      ? 'bg-violet-600 border-violet-600 text-white shadow-xs shadow-violet-600/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-violet-200 hover:bg-violet-50/50 hover:text-violet-700'">
                    <i v-if="isPresetActive(8)" class="fa-solid fa-check text-[10px]"></i>
                    Last 8 Days
                  </button>
                  <button type="button" @click="setQuickRange(16)"
                    class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5"
                    :class="isPresetActive(16)
                      ? 'bg-violet-600 border-violet-600 text-white shadow-xs shadow-violet-600/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-violet-200 hover:bg-violet-50/50 hover:text-violet-700'">
                    <i v-if="isPresetActive(16)" class="fa-solid fa-check text-[10px]"></i>
                    Last 16 Days
                  </button>
                  <button type="button" @click="setQuickRange(32)"
                    class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5"
                    :class="isPresetActive(32)
                      ? 'bg-violet-600 border-violet-600 text-white shadow-xs shadow-violet-600/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-violet-200 hover:bg-violet-50/50 hover:text-violet-700'">
                    <i v-if="isPresetActive(32)" class="fa-solid fa-check text-[10px]"></i>
                    Last 32 Days
                  </button>
                </div>
              </div>
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
                <i class="fa-solid fa-circle-info text-slate-300"></i>
                <span v-if="pdfStyle === 'extra_detailed' && !fromDate">Set a <strong>From</strong> date to break down pending unpaid bills in Old Balance (otherwise only total opening is shown).</span>
                <span v-else>Leaving dates empty prints all-time balances.</span>
              </p>
            </div>

            <!-- PDF Style Toggle -->
            <div class="border-t border-slate-100 pt-4">
              <h2 class="text-xs font-black text-slate-700 mb-3 uppercase tracking-wider flex items-center gap-2">
                <span class="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-sm"><i class="fa-solid fa-palette"></i></span>
                PDF Style
              </h2>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                </button>

                <!-- Extra Detailed Line List -->
                <button @click="pdfStyle = 'extra_detailed'"
                  class="group relative p-4 rounded-2xl border-2 transition-all duration-200 text-left cursor-pointer"
                  :class="pdfStyle === 'extra_detailed'
                    ? 'border-amber-600 bg-gradient-to-br from-amber-600 to-orange-700 text-white shadow-lg shadow-amber-600/25'
                    : 'border-slate-200 bg-white hover:border-amber-300 hover:shadow-sm text-slate-700'">
                  <div class="flex items-center gap-3 mb-2">
                    <div class="w-9 h-9 rounded-xl flex items-center justify-center text-sm"
                      :class="pdfStyle === 'extra_detailed' ? 'bg-white/15 text-white' : 'bg-amber-100 text-amber-600'">
                      <i class="fa-solid fa-layer-group"></i>
                    </div>
                    <div>
                      <div class="text-sm font-black">Extra Detailed Line List</div>
                      <div class="text-[10px] font-semibold" :class="pdfStyle === 'extra_detailed' ? 'text-amber-100' : 'text-slate-400'">
                        Opening pending bills + Bad debts last
                      </div>
                    </div>
                  </div>
                  <p class="text-[11px] leading-relaxed" :class="pdfStyle === 'extra_detailed' ? 'text-amber-100' : 'text-slate-500'">
                    Shows unpaid opening bills (* on half-paid bills) & pushes Bad Debt parties to the end.
                  </p>
                  <div v-if="pdfStyle === 'extra_detailed'" class="absolute top-3 right-3">
                    <i class="fa-solid fa-circle-check text-emerald-200"></i>
                  </div>
                  <span v-if="pdfStyle !== 'extra_detailed'" class="absolute top-3 right-3 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[9px] font-black uppercase">
                    New
                  </span>
                </button>
              </div>
            </div>
          </div>

          <!-- ═══ Lines Selection Card ═══ -->
          <div class="bg-white/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs border border-slate-200/80 backdrop-blur-sm">
            <div class="flex items-center justify-between mb-4 flex-wrap gap-2.5">
              <h2 class="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <span class="w-7 h-7 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center text-sm"><i class="fa-solid fa-map-location-dot"></i></span>
                Select Lines
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 normal-case">
                  {{ selectedLines.length }}/{{ displayedLines.length }}
                </span>
              </h2>

              <div class="flex items-center gap-2 flex-wrap">
                <!-- Eye button to toggle hidden lines -->
                <button @click="showHiddenLines = !showHiddenLines"
                  type="button"
                  class="text-xs font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 border"
                  :class="showHiddenLines
                    ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50/50'"
                  :title="showHiddenLines ? 'Hide inactive / empty lines' : 'Show hidden / inactive lines'">
                  <i :class="showHiddenLines ? 'fa-solid fa-eye-slash text-xs' : 'fa-solid fa-eye text-xs'"></i>
                  <span>{{ showHiddenLines ? 'Hide Inactive' : `Show Hidden (${hiddenLinesCount})` }}</span>
                </button>

                <!-- Select All / Deselect All -->
                <button @click="toggleSelectAll"
                  class="text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer"
                  :class="isAllDisplayedSelected
                    ? 'bg-slate-900 text-white shadow-xs hover:bg-slate-800'
                    : 'bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200/60'">
                  {{ isAllDisplayedSelected ? 'Deselect All' : 'Select All' }}
                </button>
              </div>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <label v-for="line in displayedLines" :key="line" 
                class="flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all hover:shadow-xs active:scale-[0.99]"
                :class="selectedLines.includes(line)
                  ? 'border-violet-400 bg-violet-50/60 shadow-xs'
                  : 'border-slate-200/80 hover:border-slate-300 bg-white'">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="relative flex items-center">
                    <input type="checkbox" :value="line" v-model="selectedLines"
                      class="w-4 h-4 rounded-md text-violet-600 focus:ring-violet-500 border-slate-300 transition-all" />
                  </div>
                  <span class="text-sm font-semibold truncate" :title="line"
                    :class="selectedLines.includes(line) ? 'text-violet-900' : 'text-slate-600'">{{ line }}</span>
                </div>
                <span v-if="isLineDefaultHidden(line)"
                  class="shrink-0 ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-400 border border-slate-200/60"
                  title="Hidden by default">
                  Hidden
                </span>
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
                  :class="pdfStyle === 'extra_detailed'
                    ? 'bg-amber-100 text-amber-800'
                    : (pdfStyle === 'detailed' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600')">
                  <i :class="pdfStyle === 'extra_detailed' ? 'fa-solid fa-layer-group' : (pdfStyle === 'detailed' ? 'fa-solid fa-receipt' : 'fa-solid fa-table-list')" class="text-[10px]"></i>
                  {{ pdfStyle === 'extra_detailed' ? 'Extra Detailed Line List' : (pdfStyle === 'detailed' ? 'Detailed' : 'Classic') }} Mode
                </div>
              </div>

              <!-- Two Action Buttons: Download PDF & Share PDF -->
              <div class="flex items-center gap-2.5 w-full sm:w-auto">
                <!-- Download PDF Button -->
                <button @click="handleDownload" :disabled="isGenerating || selectedLines.length === 0"
                  class="flex-1 sm:flex-initial px-5 sm:px-6 py-3 rounded-xl font-black text-white shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                  :class="selectedLines.length === 0
                    ? 'bg-slate-300 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 cursor-pointer shadow-violet-600/25'">
                  <i class="fa-solid" :class="isDownloading ? 'fa-spinner fa-spin' : 'fa-download'"></i>
                  <span>{{ isDownloading ? 'Downloading…' : 'Download PDF' }}</span>
                </button>

                <!-- Share PDF Button -->
                <button @click="handleShare" :disabled="isGenerating || selectedLines.length === 0"
                  class="flex-1 sm:flex-initial px-5 sm:px-6 py-3 rounded-xl font-black text-white shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                  :class="selectedLines.length === 0
                    ? 'bg-slate-300 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 cursor-pointer shadow-emerald-600/25'">
                  <i class="fa-solid" :class="isSharing ? 'fa-spinner fa-spin' : 'fa-share-nodes'"></i>
                  <span>{{ isSharing ? 'Sharing…' : 'Share PDF' }}</span>
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { generateLineListPDF, getLineListFileName, formatLedgerLastUpdated } from '../utils/pdfLineList';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { LocalNotifications } from '@capacitor/local-notifications';
import { toast } from 'vue3-toastify';

const router = useRouter();

const loading = ref(true);
const error = ref(null);
const isDownloading = ref(false);
const isSharing = ref(false);
const isGenerating = computed(() => isDownloading.value || isSharing.value);

const ledgerData = ref([]);
const ledgerLastSync = ref(null);
const availableLines = ref([]);
const selectedLines = ref([]);
const showHiddenLines = ref(false);

const fromDate = ref('');
const toDate = ref('');
const pdfStyle = ref('classic'); // 'classic' | 'detailed'

const formatDateLocal = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const setQuickRange = (days) => {
  if (!days) {
    fromDate.value = '';
    toDate.value = '';
    return;
  }
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);

  toDate.value = formatDateLocal(end);
  fromDate.value = formatDateLocal(start);
};

const isPresetActive = (days) => {
  if (!fromDate.value || !toDate.value) return false;
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  return toDate.value === formatDateLocal(end) && fromDate.value === formatDateLocal(start);
};

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

    const meta = data.find(g => g && (g.groupName === '_META_DATA_' || g.group === '_META_DATA_'));
    if (meta && meta.lastSync) {
      ledgerLastSync.value = new Date(meta.lastSync);
    }
    
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

const ledgerLastUpdatedFormatted = computed(() => {
  if (!ledgerLastSync.value) return null;
  return formatLedgerLastUpdated(ledgerLastSync.value);
});

const DEFAULT_HIDDEN_NAMES = [
  'wholesale party',
  'jeypur',
  'jeypore',
  'bissam cuttack',
  'gunupur line',
  'srikakulam line',
  'rayagada local',
  'paragon',
  'kotpeta line',
  'kotapeta line'
];

const isLineDefaultHidden = (lineName) => {
  if (!lineName) return false;
  const lower = lineName.toLowerCase().trim();

  // Match specific user-requested lines
  if (DEFAULT_HIDDEN_NAMES.some(h => lower === h || (h.includes(' ') && lower.includes(h)))) {
    return true;
  }
  if (
    lower.includes('wholesale') ||
    lower === 'jeypur' ||
    lower === 'jeypore' ||
    lower.includes('jeypore') ||
    lower.includes('jeypur') ||
    lower === 'paragon' ||
    lower.includes('srikakulam') ||
    lower.includes('kotpeta') ||
    lower.includes('kotapeta') ||
    lower === 'rayagada local' ||
    lower === 'gunupur line' ||
    lower === 'bissam cuttack'
  ) {
    return true;
  }

  // Check if line is empty (0 ledgers, or 0 entries and 0 balance)
  const group = ledgerData.value.find(g => g && g.groupName === lineName);
  if (group) {
    const ledgers = group.ledgers || [];
    if (ledgers.length === 0) return true;
    const hasAnyBalance = ledgers.some(l => Math.abs(l.closingBalance || 0) > 0.01);
    const hasAnyEntries = ledgers.some(l => (l.entries || []).length > 0);
    if (!hasAnyBalance && !hasAnyEntries) return true;
  }

  return false;
};

const displayedLines = computed(() => {
  if (showHiddenLines.value) {
    return availableLines.value;
  }
  return availableLines.value.filter(line => !isLineDefaultHidden(line));
});

const hiddenLinesCount = computed(() => {
  return availableLines.value.filter(line => isLineDefaultHidden(line)).length;
});

const isAllDisplayedSelected = computed(() => {
  if (displayedLines.value.length === 0) return false;
  return displayedLines.value.every(line => selectedLines.value.includes(line));
});

const toggleSelectAll = () => {
  const current = displayedLines.value;
  if (isAllDisplayedSelected.value) {
    selectedLines.value = selectedLines.value.filter(line => !current.includes(line));
  } else {
    const merged = new Set([...selectedLines.value, ...current]);
    selectedLines.value = Array.from(merged);
  }
};

const triggerDownloadNotification = async (fileName) => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const permStatus = await LocalNotifications.checkPermissions();
    if (permStatus.display !== 'granted') {
      const req = await LocalNotifications.requestPermissions();
      if (req.display !== 'granted') return;
    }
    await LocalNotifications.schedule({
      notifications: [
        {
          id: Math.floor(Date.now() % 100000000),
          title: 'Line List PDF Downloaded',
          body: `${fileName} saved to Documents`,
          sound: null,
          autoCancel: true,
          extra: { type: 'pdf_download', fileName }
        }
      ]
    });
  } catch (err) {
    console.warn('[LineList] Local notification error:', err);
  }
};

const preparePDFData = () => {
  if (selectedLines.value.length === 0) return null;
  const from = fromDate.value ? new Date(fromDate.value) : null;
  const to = toDate.value ? new Date(toDate.value) : null;

  // Validate dates
  if (from && isNaN(from.getTime())) throw new Error("Invalid From Date");
  if (to && isNaN(to.getTime())) throw new Error("Invalid To Date");
  if (from && to && from > to) {
    alert("From Date cannot be later than To Date.");
    return null;
  }

  const isAll = selectedLines.value.length === availableLines.value.length;
  const fileName = getLineListFileName(selectedLines.value, from, to, pdfStyle.value, isAll);
  const pdfOptions = {
    style: pdfStyle.value,
    fileName,
    lastUpdated: ledgerLastSync.value
  };

  return { from, to, fileName, pdfOptions };
};

const handleDownload = async () => {
  if (selectedLines.value.length === 0) return;
  isDownloading.value = true;
  try {
    const prepared = preparePDFData();
    if (!prepared) return;
    const { from, to, fileName, pdfOptions } = prepared;

    if (Capacitor.isNativePlatform()) {
      try {
        const pdfDataUri = await generateLineListPDF(selectedLines.value, from, to, ledgerData.value, { ...pdfOptions, returnBase64: true });
        if (!pdfDataUri) throw new Error('Failed to generate PDF');

        const base64Data = pdfDataUri.includes(',') ? pdfDataUri.split(',')[1] : pdfDataUri;
        await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true
        });

        toast.success(`PDF saved to Documents: ${fileName}`, { autoClose: 3500 });
        await triggerDownloadNotification(fileName);
        return;
      } catch (fsErr) {
        console.warn('Native Filesystem save failed, falling back to direct browser download:', fsErr);
      }
    }

    // Direct browser download
    const success = await generateLineListPDF(selectedLines.value, from, to, ledgerData.value, pdfOptions);
    if (success) {
      toast.success(`Line List PDF downloaded (${fileName})`, { autoClose: 3000 });
      await triggerDownloadNotification(fileName);
    } else {
      alert('Failed to generate PDF. Check console for details.');
    }
  } catch (err) {
    alert("Error: " + err.message);
  } finally {
    isDownloading.value = false;
  }
};

const handleShare = async () => {
  if (selectedLines.value.length === 0) return;
  isSharing.value = true;
  try {
    const prepared = preparePDFData();
    if (!prepared) return;
    const { from, to, fileName, pdfOptions } = prepared;

    if (Capacitor.isNativePlatform()) {
      const pdfDataUri = await generateLineListPDF(selectedLines.value, from, to, ledgerData.value, { ...pdfOptions, returnBase64: true });
      if (!pdfDataUri) throw new Error('Failed to generate PDF');

      const base64Data = pdfDataUri.includes(',') ? pdfDataUri.split(',')[1] : pdfDataUri;
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
        recursive: true
      });

      await Share.share({
        title: fileName,
        files: [savedFile.uri],
        dialogTitle: 'Share Line List PDF'
      });
      return;
    }

    // Web fallback: Web Share API if available
    if (navigator.share) {
      const blob = await generateLineListPDF(selectedLines.value, from, to, ledgerData.value, { ...pdfOptions, returnBlob: true });
      if (blob) {
        const file = new File([blob], fileName, { type: 'application/pdf' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: fileName
          });
          return;
        }
      }
    }

    // Web fallback when share is unsupported: download with notice
    const success = await generateLineListPDF(selectedLines.value, from, to, ledgerData.value, pdfOptions);
    if (success) {
      toast.info(`Sharing not supported on this browser. PDF downloaded (${fileName})`, { autoClose: 3500 });
    }
  } catch (err) {
    if (err && err.message && err.message.toLowerCase().includes('canceled')) {
      return;
    }
    console.error('Share error:', err);
    alert("Error: " + err.message);
  } finally {
    isSharing.value = false;
  }
};

const handlePrint = handleDownload;
</script>

<style scoped>
.line-list-shell {
  background-color: #f8fafc;
}
</style>
