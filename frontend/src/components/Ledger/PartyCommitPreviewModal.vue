<template>
  <transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="show"
      class="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
      @click.self="$emit('close')"
    >
      <div
        class="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up"
      >
        <!-- Modal Header -->
        <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/80 via-white to-amber-50/40">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
              <i class="fa-solid fa-code-commit text-sm"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-base sm:text-lg font-black font-['Clash_Display'] text-slate-900 tracking-tight">
                  Commit Preview
                </h3>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
                  {{ stagedCount }} Parties Staged
                </span>
              </div>
              <p class="text-[11px] text-slate-500 font-medium">
                Review party classifications before pushing to GitHub
              </p>
            </div>
          </div>

          <button
            @click="$emit('close')"
            class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Close"
          >
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        <!-- Banner Info -->
        <div class="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2 text-xs text-slate-600">
          <i class="fa-solid fa-tags text-indigo-600 text-xs shrink-0"></i>
          <span class="leading-relaxed">
            Ready to push all <strong>{{ stagedCount }}</strong> party classification updates to GitHub in a single commit.
          </span>
        </div>

        <!-- Staged Items List -->
        <div class="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[140px] max-h-[48vh]">
          <div
            v-if="stagedCount === 0"
            class="py-12 text-center text-slate-400 flex flex-col items-center justify-center"
          >
            <i class="fa-solid fa-circle-check text-3xl text-emerald-400 mb-2"></i>
            <p class="text-sm font-bold text-slate-600">All changes committed!</p>
            <p class="text-xs text-slate-400 mt-0.5">No pending party modifications in this session.</p>
          </div>

          <div
            v-for="item in stagedList"
            :key="item.ledgerName"
            class="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col gap-2"
          >
            <!-- Top line: Name & Discard -->
            <div class="flex items-center justify-between gap-2">
              <div class="min-w-0">
                <h4 class="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  {{ item.ledgerName }}
                </h4>
                <p v-if="item.groupName" class="text-[10px] text-slate-400 font-medium truncate">
                  {{ item.groupName }}
                </p>
              </div>

              <button
                @click="discardSingleChange(item.ledgerName)"
                class="w-7 h-7 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                title="Discard change for this party"
              >
                <i class="fa-solid fa-xmark text-xs"></i>
              </button>
            </div>

            <!-- Tags summary -->
            <div class="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 text-[10px] font-bold">
              <!-- Party Type -->
              <span
                class="px-2 py-0.5 rounded-md uppercase"
                :class="item.partyType === 'wholesaler' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-slate-100 text-slate-700'"
              >
                {{ item.partyType === 'wholesaler' ? '🏢 Wholesaler' : '🛍️ Retailer' }}
              </span>

              <!-- Credit Status -->
              <span
                v-if="item.creditStatus === 'bad_debt'"
                class="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200 uppercase"
              >
                🔴 Bad Debt
              </span>
              <span
                v-else-if="item.creditStatus === 'doubtful'"
                class="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 uppercase"
              >
                🟠 Doubtful
              </span>

              <!-- Settlement Status -->
              <span
                v-if="item.settlementStatus === 'settled_unaccounted'"
                class="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase"
              >
                🟡 Settled (Not Accounted)
              </span>

              <!-- Note -->
              <span v-if="item.settlementNote" class="text-slate-500 font-normal italic truncate max-w-full block w-full mt-0.5 text-[11px]">
                Note: "{{ item.settlementNote }}"
              </span>
            </div>
          </div>
        </div>

        <!-- Commit Message Input -->
        <div class="px-5 py-3 bg-slate-50/80 border-t border-slate-100">
          <label class="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5">
            Commit Message
          </label>
          <div class="flex items-center gap-2">
            <input
              v-model="customCommitMessage"
              type="text"
              :placeholder="defaultMessage"
              class="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-xs"
            />
            <button
              v-if="customCommitMessage"
              @click="customCommitMessage = ''"
              class="px-2 py-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-600 bg-white border border-slate-200 rounded-xl shrink-0"
              title="Reset to default message"
            >
              Reset
            </button>
          </div>
        </div>

        <!-- Modal Footer Actions -->
        <div class="px-5 py-3.5 bg-white border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            @click="handleDiscardAll"
            :disabled="isCommitting || stagedCount === 0"
            class="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            Discard All
          </button>

          <div class="flex items-center gap-2">
            <button
              @click="$emit('close')"
              :disabled="isCommitting"
              class="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Keep Staging
            </button>

            <button
              @click="handleCommit"
              :disabled="isCommitting || stagedCount === 0"
              class="px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-500 hover:to-violet-600 active:scale-95 text-white text-xs font-black shadow-md shadow-indigo-700/25 flex items-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              <i v-if="isCommitting" class="fa-solid fa-spinner fa-spin text-xs"></i>
              <i v-else class="fa-solid fa-cloud-arrow-up text-xs"></i>
              <span>{{ isCommitting ? 'Pushing to GitHub...' : `Commit & Push (${stagedCount})` }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed } from 'vue';
import { usePartyTagger } from '@/composables/usePartyTagger';

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'committed']);

const { stagedList, stagedCount, isCommitting, discardSingleChange, discardAllChanges, commitStagedParties } = usePartyTagger();

const customCommitMessage = ref('');

const defaultMessage = computed(() => {
  return `Update classifications for ${stagedCount.value} parties`;
});

const handleDiscardAll = () => {
  if (confirm(`Are you sure you want to discard all ${stagedCount.value} staged party updates?`)) {
    discardAllChanges();
    emit('close');
  }
};

const handleCommit = async () => {
  const msg = customCommitMessage.value.trim() || defaultMessage.value;
  const res = await commitStagedParties(msg);
  if (res.success) {
    customCommitMessage.value = '';
    emit('committed');
    emit('close');
  }
};
</script>
