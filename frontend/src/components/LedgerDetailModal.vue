<template>
  <div class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4 transition-all">
    
    <!-- Modal Container -->
    <div 
      class="bg-white w-full sm:max-w-4xl h-[90vh] sm:h-[85vh] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up sm:animate-zoom-in"
      @click.stop
    >
      
      <!-- Modal Header -->
      <header class="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
        <div>
          <h2 class="text-2xl font-black text-slate-800 tracking-tight leading-tight">{{ ledger.ledgerName }}</h2>
          <div class="flex items-center gap-3 mt-1.5 relative">
            <span class="px-2 py-0.5 rounded bg-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-widest">{{ ledger.groupName }}</span>
            <span class="text-xs font-semibold text-slate-500">{{ (ledger.entries || []).length }} Transactions</span>
          </div>
        </div>
        <button @click="$emit('close')" class="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors shadow-sm">
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>
      </header>

      <!-- Balances Summary Bar -->
      <div class="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100 bg-white shadow-sm z-10">
         <div class="p-4 flex flex-col justify-center items-center text-center group">
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Opening</span>
            <span class="text-xl font-bold" :class="getBalanceColor(ledger.openingBalance)">
               {{ formatAmount(ledger.openingBalance) }} <span class="text-sm">{{ getDrCr(ledger.openingBalance) }}</span>
            </span>
         </div>
         <div class="p-4 flex flex-col justify-center items-center text-center group">
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Closing</span>
            <span class="text-xl font-bold" :class="getBalanceColor(ledger.closingBalance)">
               {{ formatAmount(ledger.closingBalance) }} <span class="text-sm">{{ getDrCr(ledger.closingBalance) }}</span>
            </span>
         </div>
      </div>

      <!-- Transactions List (Scrollable) -->
      <div class="flex-1 overflow-y-auto bg-slate-50/30 p-4 sm:p-6 custom-scrollbar">
         
         <div v-if="processedEntries.filter(e => e.type === 'entry').length === 0" class="h-full flex flex-col items-center justify-center text-center opacity-60">
            <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-2xl text-slate-400 mb-4">
               <i class="fa-solid fa-folder-open"></i>
            </div>
            <p class="text-sm font-bold text-slate-600">No transactions recorded</p>
            <p class="text-xs text-slate-400">for the defined period.</p>
         </div>

         <div v-else class="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto custom-scrollbar">
            <table class="w-full text-left border-collapse min-w-[600px]">
               <thead>
                  <tr class="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500 font-bold border-b border-slate-200">
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
      <footer class="p-4 border-t border-slate-200 bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.03)] z-10 shrink-0">
         <button 
           @click="handleDownloadPDF" 
           :disabled="isGenerating || processedEntries.filter(e => e.type === 'entry').length === 0"
           class="w-full py-4 bg-slate-900 hover:bg-black disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-lg"
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
