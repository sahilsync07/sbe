<template>
  <div class="daybook-shell min-h-screen w-full font-sans text-slate-800">
    

    

    
    

    <main class="w-full pt-[54px] lg:pt-[72px] min-h-screen flex flex-col">
      <div class="daybook-header-sticky sticky top-[54px] lg:top-[72px] z-40 px-2.5 pt-2 pb-1.5 sm:px-5 sm:pt-4 sm:pb-2 lg:px-6 xl:px-10">
        <div class="daybook-header-card mx-auto flex w-full max-w-7xl flex-col gap-2.5 overflow-visible p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:p-5 lg:mx-0 lg:max-w-none">
          <div class="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
            <button 
              type="button"
              @click="router.push('/')" 
              class="daybook-back-btn flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-slate-600 transition-all duration-200 active:scale-95 sm:h-12 sm:w-12" 
              title="Back"
            >
              <i class="fa-solid fa-arrow-left text-sm sm:text-[15px]"></i>
            </button>
            <div class="min-w-0 flex-1">
              <span class="mb-0.5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500/15 to-teal-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 ring-1 ring-emerald-500/25 sm:mb-1 sm:gap-1.5 sm:px-3 sm:py-1 sm:text-[11px]">
                <i class="fa-solid fa-calendar-day text-[9px] sm:text-[10px]"></i>
                Daybook
              </span>
              <h1 class="mt-0.5 text-lg font-semibold tracking-tight text-slate-950 sm:mt-1 sm:text-2xl lg:text-3xl">Transactions</h1>
              <p v-if="!loading" class="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0 text-xs text-slate-500 sm:gap-x-2 sm:text-sm">
                <span class="font-semibold text-emerald-700">{{ selectedDateFormatted }}</span>
                <span class="text-slate-300">·</span>
                <span><span class="font-semibold tabular-nums text-slate-800">{{ vouchers.length }}</span> vouchers</span>
              </p>
            </div>
          </div>

          <div class="w-full sm:w-auto sm:flex-shrink-0">
            <ModernDatePicker v-model="selectedDate" />
          </div>
        </div>
      </div>

      <div class="flex-1 px-2.5 pb-28 pt-1.5 sm:px-5 sm:pb-32 sm:pt-2 lg:px-6 xl:px-10 lg:pt-3">
        <div class="mx-auto h-full w-full max-w-7xl relative lg:mx-0 lg:max-w-none">
          <div v-if="loading" class="daybook-state-card absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[2rem] sm:rounded-[2.25rem]">
             <div class="relative mb-8">
               <div class="absolute inset-0 scale-150 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 opacity-25 blur-3xl animate-pulse"></div>
               <div class="relative flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-slate-200/80 border-t-emerald-600 animate-spin"></div>
             </div>
             <p class="text-lg font-semibold text-slate-800">Loading daybook</p>
             <p class="mt-1 text-sm text-slate-500">Almost there…</p>
          </div>

          <div v-else-if="error" class="daybook-state-card flex h-[min(60vh,520px)] flex-col items-center justify-center rounded-[2rem] px-6 py-12 text-center sm:rounded-[2.25rem]">
             <div class="mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-50 text-4xl text-amber-600 shadow-[0_20px_60px_-15px_rgba(245,158,11,0.35)]">
                <i class="fa-solid fa-cloud-arrow-down"></i>
             </div>
             <h2 class="mb-2 text-2xl font-semibold text-slate-950">Sync required</h2>
             <p class="max-w-md leading-relaxed text-slate-600">Pull fresh data from the home screen, then open daybook again.</p>
             <button type="button" @click="loadLedgerData" class="daybook-pill-btn mt-10 rounded-full px-10 py-4 text-[15px] font-semibold text-white active:scale-[0.98]">
                Retry
             </button>
          </div>

          <div v-else-if="vouchers.length === 0" class="daybook-state-card flex flex-col items-center justify-center rounded-[2rem] px-6 py-20 text-center sm:rounded-[2.25rem] sm:py-28">
              <div class="mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 via-white to-emerald-50 text-5xl text-emerald-500 shadow-inner ring-1 ring-slate-200/60">
                <i class="fa-solid fa-sun"></i>
             </div>
             <h3 class="mb-2 text-2xl font-semibold text-slate-950">No activity</h3>
             <p class="max-w-sm text-slate-600">Choose a different date — nothing posted on this one.</p>
          </div>

          <div v-else>
             <div class="mb-20 space-y-2.5 sm:mb-24 sm:hidden">
                 <div 
                   v-for="(vch, idx) in vouchers" 
                   :key="'m-'+idx" 
                   class="daybook-float-card touch-manipulation rounded-2xl p-3.5 active:scale-[0.99] sm:rounded-[1.75rem] sm:p-5"
                 >
                   <div class="mb-2.5 flex items-start justify-between gap-2 sm:mb-4 sm:gap-3">
                      <div class="flex min-w-0 flex-col gap-1.5 sm:gap-3">
                         <span class="text-[11px] font-medium text-slate-500 sm:text-xs">#{{ idx + 1 }} · {{ vch.voucherNo || '—' }}</span>
                         <span 
                           class="w-fit rounded-full bg-gradient-to-r px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1 sm:px-3 sm:py-1.5 sm:text-[11px]"
                           :class="voucherTypeClass(vch.type)"
                         >{{ vch.type }}</span>
                      </div>
                      <div class="text-right">
                         <p :class="[vch.drCr === 'Dr' ? 'text-rose-600' : 'text-emerald-600', 'font-mono text-lg font-semibold tabular-nums tracking-tight sm:text-2xl']">
                            ₹{{ formatAmount(vch.amount) }}
                         </p>
                         <span class="mt-0.5 block text-[10px] font-medium text-slate-400 sm:mt-1 sm:text-xs">{{ vch.drCr }}</span>
                      </div>
                   </div>
                   <div class="flex items-center justify-between rounded-xl bg-slate-50/90 px-3 py-2 sm:rounded-2xl sm:px-4 sm:py-3">
                      <div class="min-w-0 pr-2 sm:pr-3">
                         <h4 class="text-sm font-semibold leading-snug text-slate-950 sm:text-base">{{ toTitleCase(vch.ledgerName) }}</h4>
                      </div>
                      <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm sm:h-10 sm:w-10">
                         <i class="fa-solid fa-receipt text-xs sm:text-sm"></i>
                      </div>
                   </div>
                 </div>
             </div>

             <div class="daybook-table-shell custom-scrollbar mb-20 hidden overflow-hidden rounded-[1.35rem] p-1.5 sm:mb-24 sm:block sm:rounded-[1.75rem] sm:p-2 md:rounded-[2rem] md:p-3">
                <div class="overflow-x-auto rounded-xl bg-white/95 shadow-inner ring-1 ring-white/80 sm:rounded-[1.35rem] md:rounded-[1.5rem]">
                <table class="w-full min-w-[800px] border-collapse text-left">
                   <thead>
                      <tr class="text-left text-[10px] font-semibold uppercase tracking-wide text-emerald-900/75 sm:text-xs">
                         <th class="rounded-tl-xl bg-gradient-to-r from-emerald-50 to-teal-50/80 px-3 py-2.5 text-center sm:rounded-tl-2xl sm:px-5 sm:py-3.5">#</th>
                         <th class="bg-gradient-to-r from-emerald-50 to-teal-50/80 px-3 py-2.5 sm:px-5 sm:py-3.5">Ledger</th>
                         <th class="bg-gradient-to-r from-emerald-50 to-teal-50/80 px-3 py-2.5 sm:px-5 sm:py-3.5">Type</th>
                         <th class="bg-gradient-to-r from-emerald-50 to-teal-50/80 px-3 py-2.5 text-center sm:px-5 sm:py-3.5">No.</th>
                         <th class="bg-gradient-to-r from-emerald-50 to-teal-50/80 px-3 py-2.5 text-right sm:px-5 sm:py-3.5">Debit</th>
                         <th class="rounded-tr-xl bg-gradient-to-r from-emerald-50 to-teal-50/80 px-3 py-2.5 text-right sm:rounded-tr-2xl sm:px-5 sm:py-3.5">Credit</th>
                      </tr>
                   </thead>
                   <tbody class="text-xs sm:text-sm">
                      <tr 
                         v-for="(vch, idx) in vouchers" 
                         :key="idx" 
                         class="group border-t border-slate-100/90 transition-colors first:border-t-0 hover:bg-emerald-50/40"
                      >
                         <td class="whitespace-nowrap px-3 py-2.5 text-center font-mono text-[10px] text-slate-400 sm:px-5 sm:py-3.5 sm:text-xs">{{ idx + 1 }}</td>
                         <td class="min-w-[200px] px-3 py-2.5 sm:px-5 sm:py-3.5">
                            <span class="font-semibold leading-snug text-slate-950 transition-colors group-hover:text-emerald-800 sm:leading-relaxed">{{ toTitleCase(vch.ledgerName) }}</span>
                         </td>
                         <td class="whitespace-nowrap px-3 py-2.5 sm:px-5 sm:py-3.5">
                            <span 
                              class="inline-flex rounded-full bg-gradient-to-r px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 sm:px-3 sm:py-1 sm:text-[11px]"
                              :class="voucherTypeClass(vch.type)"
                            >{{ vch.type }}</span>
                         </td>
                         <td class="whitespace-nowrap px-3 py-2.5 text-center font-mono text-[10px] text-slate-500 sm:px-5 sm:py-3.5 sm:text-xs">{{ vch.voucherNo || '—' }}</td>
                         <td class="whitespace-nowrap px-3 py-2.5 text-right font-mono sm:px-5 sm:py-3.5">
                            <span v-if="vch.drCr === 'Dr'" class="font-semibold text-rose-600 tabular-nums">{{ formatAmount(vch.amount) }}</span>
                            <span v-else class="text-slate-200">—</span>
                         </td>
                         <td class="whitespace-nowrap px-3 py-2.5 text-right font-mono sm:px-5 sm:py-3.5">
                            <span v-if="vch.drCr === 'Cr'" class="font-semibold text-emerald-600 tabular-nums">{{ formatAmount(vch.amount) }}</span>
                            <span v-else class="text-slate-200">—</span>
                         </td>
                      </tr>
                   </tbody>
                </table>
                </div>
             </div>
          </div>
        </div>
      </div>
    </main>

    <footer v-if="vouchers.length > 0" class="daybook-footer safe-area-bottom fixed bottom-3 left-2.5 right-2.5 z-[70] sm:bottom-5 sm:left-5 sm:right-5 lg:left-6 lg:right-6 xl:left-10 xl:right-10">
        <div class="daybook-footer-inner mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-3 py-2.5 text-white sm:gap-4 sm:px-7 sm:py-5 lg:mx-0 lg:max-w-none">
            <div class="hidden min-w-0 lg:block">
                <span class="text-xs font-medium text-emerald-200/80">Summary</span>
                <p class="whitespace-nowrap text-sm font-semibold text-white">{{ selectedDateFormatted }}</p>
            </div>
            
            <div class="flex flex-1 items-center justify-between gap-4 sm:gap-12 lg:justify-end">
                <div class="text-right">
                    <span class="mb-0 block text-[10px] font-medium text-rose-200/90 sm:mb-0.5 sm:text-xs">Debits</span>
                    <span class="font-mono text-sm font-semibold tabular-nums tracking-tight text-rose-100 sm:text-lg md:text-2xl">₹{{ formatAmount(totalDebits) }} <span class="ml-0.5 font-sans text-[10px] font-medium opacity-80 sm:ml-1 sm:text-xs">Dr</span></span>
                </div>
                <div class="hidden h-10 w-px rounded-full bg-white/20 sm:block sm:h-12"></div>
                <div class="text-right">
                    <span class="mb-0 block text-[10px] font-medium text-emerald-200/90 sm:mb-0.5 sm:text-xs">Credits</span>
                    <span class="font-mono text-sm font-semibold tabular-nums tracking-tight text-emerald-100 sm:text-lg md:text-2xl">₹{{ formatAmount(totalCredits) }} <span class="ml-0.5 font-sans text-[10px] font-medium opacity-80 sm:ml-1 sm:text-xs">Cr</span></span>
                </div>
            </div>
        </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useLedgerData } from '../composables/useLedgerData';
import ModernDatePicker from '../components/ModernDatePicker.vue';
import { useAdmin } from '../composables/useAdmin';
import { useStockData } from '../composables/useStockData';
import { useCart } from '../composables/useCart';
import { useBrandGroups } from '../composables/useBrandGroups';
import { useAppStore } from '../stores/appStore';
import { storeToRefs } from 'pinia';

const router = useRouter();
const appStore = useAppStore();
const { stockData, config } = storeToRefs(appStore);

const { allLedgers, loading: ledgerLoading, error, loadLedgerData } = useLedgerData();
const { isAdmin, isSuperAdmin } = useAdmin();
const companyName = ref('SBE Rayagada');

const { loading: stockLoading } = useStockData();
const { cartTotalItems } = useCart();

// Sidebar & Search glue
const searchQuery = ref('');
const { groupedSidebar } = useBrandGroups(stockData, config, searchQuery);
const activeScrollGroup = ref('');

const showSidePanel = ref(false);
const showCart = ref(false);
const loading = computed(() => ledgerLoading.value);

const handleSidebarClick = (group) => {
    router.push({ path: '/', query: { brand: group.groupName } });
};

const handleClubClick = (clubName) => {
    router.push({ path: '/', query: { club: clubName } });
};

// Get today's date in YYYY-MM-DD format
const getTodayStr = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

const selectedDate = ref(getTodayStr());

onMounted(() => {
  if (!isAdmin.value && !isSuperAdmin.value) {
    router.replace('/');
    return;
  }
  loadLedgerData().then(() => {
    if (allFlattenedEntries.value.length > 0) {
      const sorted = [...allFlattenedEntries.value]
        .filter(e => e.date)
        .sort((a, b) => b.date.localeCompare(a.date));
      if (sorted[0]) {
        const normalized = normalizeDate(sorted[0].date);
        if (normalized) selectedDate.value = normalized;
      }
    }
  });
});

const normalizeDate = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
    if (dateStr.match(/^\d{8}$/)) {
        return `${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    return null;
};

const allFlattenedEntries = computed(() => {
    const entries = [];
    allLedgers.value.forEach(ledger => {
        if (ledger.entries && Array.isArray(ledger.entries)) {
            ledger.entries.forEach(entry => {
                entries.push({
                    ...entry,
                    ledgerName: ledger.ledgerName,
                    groupName: ledger.groupName, // Include group info
                    normalizedDate: normalizeDate(entry.date)
                });
            });
        }
    });
    return entries;
});

// Accounting ledgers heuristic
const ACCT_GROUPS = ['Duties & Taxes', 'Sales Accounts', 'Purchase Accounts', 'Direct Expenses', 'Indirect Expenses', 'Direct Incomes', 'Indirect Incomes', 'Bank Accounts', 'Cash-in-hand', 'Fixed Assets'];
const ACCT_NAMES = ['Round Off', 'ROUND OFF-SALE', 'Sales', 'Purchase', 'CGST', 'SGST', 'IGST', 'Output', 'Input'];

const isAccountingLedger = (ledgerName, groupName) => {
    if (ACCT_GROUPS.includes(groupName)) return true;
    const name = (ledgerName || '').toUpperCase();
    return ACCT_NAMES.some(n => name.includes(n.toUpperCase()));
};

const vouchers = computed(() => {
    const groups = {};
    filteredEntries.value.forEach(entry => {
        const key = `${entry.normalizedDate}_${entry.type}_${entry.voucherNo}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(entry);
    });

    return Object.values(groups).map(entries => {
        // Find primary ledger (Party or most significant account)
        // Sort by amount descending
        const sorted = [...entries].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
        
        let primary = sorted.find(e => !isAccountingLedger(e.ledgerName, e.groupName));
        
        // If all are accounting ledgers, pick the largest one
        if (!primary) primary = sorted[0];

        return {
            date: primary.date,
            voucherNo: primary.voucherNo,
            type: primary.type,
            ledgerName: primary.ledgerName,
            amount: primary.amount,
            drCr: primary.drCr,
            isCompound: entries.length > 2
        };
    });
});

const filteredEntries = computed(() => {
    return allFlattenedEntries.value.filter(e => e.normalizedDate === selectedDate.value);
});

const totalDebits = computed(() => {
    return filteredEntries.value
        .filter(e => e.drCr === 'Dr')
        .reduce((sum, entry) => sum + (entry.amount || 0), 0);
});

const totalCredits = computed(() => {
    return filteredEntries.value
        .filter(e => e.drCr === 'Cr')
        .reduce((sum, entry) => sum + (entry.amount || 0), 0);
});

const selectedDateFormatted = computed(() => {
    if (!selectedDate.value) return '';
    const [y, m, d] = selectedDate.value.split('-');
    return new Date(y, m-1, d).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
});

const toTitleCase = (str) => {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(word => {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
};

const formatAmount = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '0.00';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(amount));
};

/** Tailwind class strings for voucher type chips */
const voucherTypeClass = (type) => {
  const t = (type || '').toLowerCase();
  if (t.includes('payment')) return 'from-rose-500/20 to-orange-500/10 text-rose-900 ring-rose-300/40';
  if (t.includes('receipt')) return 'from-emerald-500/20 to-teal-500/10 text-emerald-900 ring-emerald-300/45';
  if (t.includes('sale')) return 'from-sky-500/15 to-indigo-500/10 text-indigo-900 ring-indigo-200/50';
  if (t.includes('purchase')) return 'from-amber-500/20 to-yellow-500/10 text-amber-950 ring-amber-300/45';
  if (t.includes('contra') || t.includes('journal')) return 'from-violet-500/15 to-purple-500/10 text-violet-900 ring-violet-200/45';
  return 'from-slate-400/15 to-slate-500/10 text-slate-800 ring-slate-300/40';
};
</script>

<style scoped>
.daybook-shell {
  background-color: #f4f4f5;
  background-image:
    radial-gradient(1100px 560px at 15% -8%, rgba(52, 211, 153, 0.2), transparent 52%),
    radial-gradient(900px 480px at 95% 20%, rgba(20, 184, 166, 0.12), transparent 48%),
    radial-gradient(600px 400px at 50% 100%, rgba(16, 185, 129, 0.07), transparent 45%);
}

.daybook-header-sticky {
  pointer-events: none;
}
.daybook-header-sticky > * {
  pointer-events: auto;
}

.daybook-header-card {
  border-radius: 1.75rem;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px) saturate(1.35);
  -webkit-backdrop-filter: blur(20px) saturate(1.35);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.9) inset,
    0 24px 48px -20px rgba(15, 23, 42, 0.16),
    0 0 0 1px rgba(255, 255, 255, 0.5);
}

.daybook-back-btn {
  background: #fff;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(226, 232, 240, 0.9);
}
.daybook-back-btn:hover {
  color: rgb(5 122 85);
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.22), 0 0 0 1px rgba(110, 231, 183, 0.5);
}

.daybook-state-card {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 24px 48px -18px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.6);
}

.daybook-float-card {
  background: rgba(255, 255, 255, 0.92);
  box-shadow:
    0 20px 40px -18px rgba(15, 23, 42, 0.18),
    0 0 0 1px rgba(255, 255, 255, 0.85) inset;
}

.daybook-table-shell {
  background: linear-gradient(145deg, rgba(236, 253, 245, 0.9) 0%, rgba(240, 253, 250, 0.5) 100%);
  box-shadow: 0 20px 50px -24px rgba(16, 185, 129, 0.25), 0 0 0 1px rgba(167, 243, 208, 0.35);
}

.daybook-pill-btn {
  background: linear-gradient(135deg, #059669 0%, #0d9488 50%, #10b981 100%);
  box-shadow: 0 12px 32px -8px rgba(5, 150, 105, 0.5);
}
.daybook-pill-btn:hover {
  filter: brightness(1.06);
}

.daybook-footer {
  filter: drop-shadow(0 20px 40px rgba(6, 78, 59, 0.35));
}

.daybook-footer-inner {
  border-radius: 1.5rem;
  background: linear-gradient(135deg, #042f2e 0%, #0f766e 40%, #115e59 100%);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12) inset;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #6ee7b7, #34d399);
  border-radius: 10px;
}

.safe-area-bottom {
  padding-bottom: max(1rem, env(safe-area-inset-bottom, 24px));
}

@keyframes daybook-footer-up {
  from {
    transform: translateY(120%) scale(0.96);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.daybook-footer {
  animation: daybook-footer-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
