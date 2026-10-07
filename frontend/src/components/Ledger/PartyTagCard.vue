<template>
  <div
    class="p-3.5 sm:p-4 rounded-2xl bg-white border transition-all duration-200 flex flex-col justify-between gap-3 shadow-xs"
    :class="effective.isStaged ? 'border-indigo-400 ring-2 ring-indigo-500/15 shadow-indigo-100/50' : 'border-slate-200/80 hover:border-slate-300'"
  >
    <!-- Card Top: Name, Group, Balance & Staged Badge -->
    <div>
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1.5 flex-wrap">
            <h4 class="text-xs sm:text-sm font-black text-slate-900 truncate tracking-tight">
              {{ ledger.ledgerName }}
            </h4>
            <!-- Staged Tag -->
            <span
              v-if="effective.isStaged"
              class="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 border border-indigo-200 shrink-0 flex items-center gap-1"
            >
              <i class="fa-solid fa-bolt text-[8px]"></i> Staged
            </span>
          </div>

          <div class="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-medium truncate">
            <span class="truncate">{{ ledger.groupName || 'Party' }}</span>
            <span v-if="criticalityBadge" class="text-rose-500 font-bold truncate">
              • {{ criticalityBadge }}
            </span>
          </div>
        </div>

        <!-- Balance Display -->
        <div class="text-right shrink-0">
          <span
            class="text-xs sm:text-sm font-black font-mono tracking-tight"
            :class="closingBalanceVal > 0 ? 'text-rose-600' : (closingBalanceVal < 0 ? 'text-emerald-600' : 'text-slate-500')"
          >
            ₹{{ Math.abs(closingBalanceVal).toLocaleString('en-IN') }}
          </span>
          <p class="text-[9px] font-extrabold uppercase text-slate-400">
            {{ closingBalanceVal > 0 ? 'Debit (Owed)' : (closingBalanceVal < 0 ? 'Credit' : 'Cleared') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Middle: Tagging Controls -->
    <div class="space-y-2 pt-2 border-t border-slate-100 text-xs">
      <!-- 1. Party Type (Retailer vs Wholesaler) -->
      <div class="flex items-center justify-between gap-2">
        <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Type
        </span>
        <div class="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200/60">
          <button
            type="button"
            @click="setType('retailer')"
            class="px-2.5 py-1 rounded-md text-[10px] font-bold transition-all"
            :class="effective.partyType !== 'wholesaler' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'"
          >
            🛍️ Retailer
          </button>
          <button
            type="button"
            @click="setType('wholesaler')"
            class="px-2.5 py-1 rounded-md text-[10px] font-bold transition-all"
            :class="effective.partyType === 'wholesaler' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-600'"
          >
            🏢 Wholesaler
          </button>
        </div>
      </div>

      <!-- 2. Credit Risk (Normal vs Bad Debt vs Doubtful) -->
      <div class="flex items-center justify-between gap-2">
        <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Risk
        </span>
        <div class="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200/60">
          <button
            type="button"
            @click="setCredit('normal')"
            class="px-2 py-0.5 rounded-md text-[10px] font-bold transition-all"
            :class="effective.creditStatus === 'normal' || !effective.creditStatus ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'"
          >
            Normal
          </button>
          <button
            type="button"
            @click="setCredit('doubtful')"
            class="px-2 py-0.5 rounded-md text-[10px] font-bold transition-all"
            :class="effective.creditStatus === 'doubtful' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-400 hover:text-slate-600'"
          >
            🟠 Doubtful
          </button>
          <button
            type="button"
            @click="setCredit('bad_debt')"
            class="px-2 py-0.5 rounded-md text-[10px] font-bold transition-all"
            :class="effective.creditStatus === 'bad_debt' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-600'"
          >
            🔴 Bad Debt
          </button>
        </div>
      </div>

      <!-- 3. Settlement Status (Settled Unaccounted) -->
      <div class="pt-1">
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            :checked="effective.settlementStatus === 'settled_unaccounted'"
            @change="toggleSettlement($event.target.checked)"
            class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 cursor-pointer"
          />
          <span class="text-[11px] font-bold text-slate-700">
            🟡 Settled / Cleared (Voucher pending in Tally)
          </span>
        </label>

        <!-- Settlement Note Input -->
        <div v-if="effective.settlementStatus === 'settled_unaccounted' || showNoteInput" class="mt-2 pl-5">
          <input
            v-model="settlementNoteModel"
            @blur="saveNote"
            @keydown.enter="saveNote"
            type="text"
            placeholder="e.g. Settled ₹30,000 cash with agent on 04-Oct, entry pending"
            class="w-full bg-amber-50/60 border border-amber-200/80 rounded-lg px-2.5 py-1 text-[11px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
          />
        </div>
      </div>
    </div>

    <!-- Bottom: Discard Button (if staged) -->
    <div v-if="effective.isStaged" class="pt-1 flex items-center justify-between text-[10px]">
      <span class="text-indigo-600 font-bold">
        Modified in current session
      </span>
      <button
        type="button"
        @click="$emit('discard')"
        class="text-rose-600 font-bold hover:underline"
      >
        Discard change
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  ledger: {
    type: Object,
    required: true,
  },
  effective: {
    type: Object,
    required: true,
  },
  criticalityBadge: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update', 'discard']);

const showNoteInput = ref(false);
const settlementNoteModel = ref(props.effective.settlementNote || '');

watch(
  () => props.effective.settlementNote,
  (val) => {
    settlementNoteModel.value = val || '';
  }
);

// Tally convention: negative = Debit (customer owes), positive = Credit
const closingBalanceVal = computed(() => {
  const bal = props.ledger.closingBalance || 0;
  return -bal; // Invert for customer debtor readability: positive = Debit
});

const setType = (partyType) => {
  emit('update', { partyType });
};

const setCredit = (creditStatus) => {
  emit('update', { creditStatus });
};

const toggleSettlement = (checked) => {
  if (checked) {
    showNoteInput.value = true;
    emit('update', { settlementStatus: 'settled_unaccounted' });
  } else {
    emit('update', { settlementStatus: 'normal' });
  }
};

const saveNote = () => {
  emit('update', { settlementNote: settlementNoteModel.value.trim() });
};
</script>
