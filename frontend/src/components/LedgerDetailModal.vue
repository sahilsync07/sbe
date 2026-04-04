<template>
  <div class="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-xl sm:items-center sm:p-5">
    
    <div 
      class="ledger-modal-sheet flex h-[92vh] w-full max-h-[940px] flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.35)] sm:h-[86vh] sm:max-w-4xl sm:rounded-[2rem] animate-slide-up sm:animate-zoom-in"
      @click.stop
    >
      
      <header class="relative flex items-start justify-between gap-4 px-5 pb-5 pt-6 sm:px-8 sm:pb-6 sm:pt-8">
        <div class="pointer-events-none absolute inset-x-0 top-0 h-1.5 rounded-b-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 opacity-95"></div>
        <div class="min-w-0 pt-1">
          <h2 class="text-xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-2xl">{{ ledger.ledgerName }}</h2>
          <div class="mt-2 flex flex-wrap items-center gap-2">
            <span class="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-800 ring-1 ring-indigo-500/20">{{ ledger.groupName }}</span>
            <span class="text-sm text-slate-500">{{ (ledger.entries || []).length }} lines</span>
          </div>
        </div>
        <button type="button" @click="$emit('close')" class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600">
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>
      </header>

      <div class="grid grid-cols-2 gap-3 px-5 pb-4 sm:gap-4 sm:px-8 sm:pb-5">
         <div class="rounded-2xl bg-slate-50/90 px-4 py-4 text-center ring-1 ring-slate-100 sm:py-5">
            <span class="mb-1 block text-xs font-medium text-slate-500">Opening</span>
            <span class="text-lg font-semibold sm:text-xl" :class="getBalanceColor(ledger.openingBalance)">
               {{ formatAmount(ledger.openingBalance) }} <span class="text-sm font-medium">{{ getDrCr(ledger.openingBalance) }}</span>
            </span>
         </div>
         <div class="rounded-2xl bg-gradient-to-br from-indigo-50/80 to-violet-50/50 px-4 py-4 text-center ring-1 ring-indigo-100/60 sm:py-5">
            <span class="mb-1 block text-xs font-medium text-indigo-700/80">Closing</span>
            <span class="text-lg font-semibold sm:text-xl" :class="getBalanceColor(ledger.closingBalance)">
               {{ formatAmount(ledger.closingBalance) }} <span class="text-sm font-medium">{{ getDrCr(ledger.closingBalance) }}</span>
            </span>
         </div>
      </div>

      <!-- Transactions List (Scrollable) -->
      <div class="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50/80 to-white p-4 sm:p-6 custom-scrollbar">
         
         <div v-if="processedEntries.filter(e => e.type === 'entry').length === 0" class="h-full flex flex-col items-center justify-center text-center opacity-60">
            <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-2xl text-slate-400 mb-4">
               <i class="fa-solid fa-folder-open"></i>
            </div>
            <p class="text-sm font-bold text-slate-600">No transactions recorded</p>
            <p class="text-xs text-slate-400">for the defined period.</p>
         </div>

         <div v-else class="w-full overflow-x-auto rounded-2xl bg-white/95 shadow-[0_16px_40px_-20px_rgba(15,23,42,0.15)] ring-1 ring-slate-200/60 custom-scrollbar sm:rounded-[1.35rem]">
            <table class="w-full min-w-[600px] border-collapse text-left">
               <thead>
                  <tr class="border-b border-slate-100 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
                     <th class="p-3 sm:p-4 w-28">Date</th>
                     <th class="p-3 sm:p-4">Particulars</th>
                     <th class="p-3 sm:p-4 w-24">Vch No.</th>
                     <th class="p-3 sm:p-4 w-28 text-right">Debit (Dr)</th>
                     <th class="p-3 sm:p-4 w-28 text-right">Credit (Cr)</th>
                     <th class="p-3 sm:p-4 w-32 text-right">Balance</th>
                  </tr>
               </thead>
               <tbody class="text-sm divide-y divide-slate-100 font-medium whitespace-nowrap">
                  <tr 
                     v-for="(row, idx) in processedEntries" 
                     :key="idx" 
                     :class="[
                        row.type === 'entry' ? 'hover:bg-blue-50/50 transition-colors' : '',
                        (row.type === 'opening' || row.type === 'closing') ? 'bg-amber-50/30' : '',
                        row.type === 'total' ? 'bg-slate-100 border-t-2 border-slate-300' : ''
                     ]"
                  >
                     <td class="p-3 sm:p-4 text-slate-500 font-mono text-xs">{{ row.date || '' }}</td>
                     <td class="p-3 sm:p-4">
                        <span v-if="row.type === 'entry'" class="px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">{{ row.particulars }}</span>
                        <span v-else class="font-bold text-slate-800" :class="{'uppercase tracking-wider': row.type === 'total'}">{{ row.particulars }}</span>
                     </td>
                     <td class="p-3 sm:p-4 text-slate-400 font-mono text-xs">{{ row.vchNo || (row.type === 'entry' ? '-' : '') }}</td>
                     <td class="p-3 sm:p-4 text-right font-mono" :class="row.type === 'total' ? 'text-slate-800 font-black' : 'text-rose-600 font-bold'">
                        {{ row.dr ? formatAmount(row.dr) : '' }}
                     </td>
                     <td class="p-3 sm:p-4 text-right font-mono" :class="row.type === 'total' ? 'text-slate-800 font-black' : 'text-emerald-600 font-bold'">
                        {{ row.cr ? formatAmount(row.cr) : '' }}
                     </td>
                     <td class="p-3 sm:p-4 text-right font-mono font-bold text-slate-700">
                        <span v-if="row.balance !== null">
                           {{ formatAmount(row.balance) }} 
                           <span class="text-[10px] ml-1 opacity-70">{{ getDrCr(row.balance) }}</span>
                        </span>
                     </td>
                  </tr>
               </tbody>
            </table>
         </div>

      </div>

      <!-- Action Footer -->
      <footer class="z-10 shrink-0 border-t border-slate-100 bg-white/95 p-4 backdrop-blur-md sm:p-6">
         <button 
           type="button"
           @click="handleDownloadPDF" 
           :disabled="isGenerating || processedEntries.filter(e => e.type === 'entry').length === 0"
           class="flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 py-4 text-base font-semibold text-white shadow-[0_12px_32px_-8px_rgba(15,23,42,0.45)] transition-all hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none sm:text-lg"
         >
           <span v-if="isGenerating" class="flex items-center gap-2">
              <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Generating Tally PDF...
           </span>
           <span v-else class="flex items-center gap-2">
              <i class="fa-solid fa-print text-xl text-rose-400"></i>
              Download Ledger Statement
           </span>
         </button>
      </footer>

    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { generateLedgerPDF } from '../utils/pdfLedgerGenerator.js';

const props = defineProps({
  ledger: {
    type: Object,
    required: true
  }
});

const isGenerating = ref(false);
const emit = defineEmits(['close']);

const processedEntries = computed(() => {
   const rows = [];
   const entries = props.ledger.entries || [];
   
   let totalDrAmount = 0;
   let totalCrAmount = 0;
   let currentRunningBalance = props.ledger.openingBalance || 0;

   // 1. Opening Balance Row
   let obDr = 0;
   let obCr = 0;
   if (props.ledger.openingBalance < 0) {
      obDr = Math.abs(props.ledger.openingBalance);
      totalDrAmount += obDr;
   } else if (props.ledger.openingBalance > 0) {
      obCr = props.ledger.openingBalance;
      totalCrAmount += obCr;
   }

   if (props.ledger.openingBalance !== 0) {
       rows.push({
           type: 'opening',
           date: entries.length > 0 ? entries[0].date : '',
           particulars: 'Opening Balance',
           dr: obDr,
           cr: obCr,
           balance: currentRunningBalance
       });
   }

   // 2. Entries
   entries.forEach(entry => {
       let drAmount = 0;
       let crAmount = 0;
       
       if (entry.drCr === 'Dr') {
           drAmount = entry.amount;
           currentRunningBalance -= Math.abs(entry.amount);
           totalDrAmount += entry.amount;
       } else {
           crAmount = entry.amount;
           currentRunningBalance += Math.abs(entry.amount);
           totalCrAmount += entry.amount;
       }

       rows.push({
           type: 'entry',
           date: entry.date,
           particulars: entry.type,
           vchType: entry.type,
           vchNo: entry.voucherNo,
           dr: drAmount,
           cr: crAmount,
           balance: currentRunningBalance
       });
   });

   // 3. Closing Balance
   let cbDr = 0;
   let cbCr = 0;
   
   if (totalDrAmount > totalCrAmount) {
       cbCr = totalDrAmount - totalCrAmount;
       totalCrAmount += cbCr;
   } else if (totalCrAmount > totalDrAmount) {
       cbDr = totalCrAmount - totalDrAmount;
       totalDrAmount += cbDr;
   }

   rows.push({
       type: 'closing',
       particulars: 'Closing Balance',
       dr: cbDr,
       cr: cbCr,
       balance: null
   });

   // 4. Totals
   rows.push({
       type: 'total',
       particulars: 'Total',
       dr: totalDrAmount,
       cr: totalCrAmount,
       balance: null
   });

   return rows;
});

const handleDownloadPDF = async () => {
    try {
        isGenerating.value = true;
        // The generator is synchronous, but we wrap in a timeout to let UI update to "Generating..."
        await new Promise(r => setTimeout(r, 100)); 
        generateLedgerPDF(props.ledger);
    } catch (e) {
        console.error("PDF generation failed", e);
        alert("Failed to generate PDF. Check console.");
    } finally {
        isGenerating.value = false;
    }
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

<style scoped>
.animate-slide-up {
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-zoom-in {
  animation: zoomIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

@keyframes zoomIn {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

/* Custom Scrollbar for the table/list */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 10px;
}
</style>
