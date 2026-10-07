<template>
  <div class="min-h-screen bg-slate-50 font-sans text-slate-800 pb-28">
    <!-- Sticky Top Header -->
    <header class="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 sm:px-6">
      <div class="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <!-- Left: Back & Title -->
        <div class="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            @click="router.back()"
            class="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all shrink-0 active:scale-95"
            title="Back"
          >
            <i class="fa-solid fa-arrow-left text-sm"></i>
          </button>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h1 class="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate font-['Clash_Display']">
                Party Tagger
              </h1>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                Hub Tool
              </span>
            </div>
            <p class="text-[11px] text-slate-500 font-medium truncate">
              Classify Wholesalers, Retailers, Bad Debts & Settlements
            </p>
          </div>
        </div>

        <!-- Right: Action Buttons -->
        <div class="flex items-center gap-2 shrink-0">
          <!-- Commit Preview Button (Glowing when stagedCount > 0) -->
          <button
            v-if="stagedCount > 0"
            @click="showCommitModal = true"
            class="px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-black shadow-md shadow-indigo-600/30 flex items-center gap-2 active:scale-95 transition-all animate-pulse"
            title="Review and push staged party tags"
          >
            <i class="fa-solid fa-code-commit text-xs"></i>
            <span>Commit Preview ({{ stagedCount }})</span>
          </button>

          <!-- Refresh Data Button -->
          <button
            @click="handleRefresh"
            :disabled="loading"
            class="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all shrink-0"
            title="Refresh Ledger Data"
          >
            <i class="fa-solid fa-rotate text-xs" :class="{ 'animate-spin': loading }"></i>
          </button>
        </div>
      </div>

      <!-- Controls & Search Bar -->
      <div class="max-w-7xl mx-auto mt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <!-- Search Input -->
        <div class="relative flex-1">
          <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search party by name, area, or group..."
            class="w-full bg-slate-100/90 border border-slate-200/80 rounded-xl pl-9 pr-8 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
          />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- 3 View Modes Tabs -->
        <div class="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/60 self-start sm:self-auto shrink-0">
          <button
            @click="activeView = 'group'"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
            :class="activeView === 'group' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'"
          >
            <i class="fa-solid fa-folder-tree text-[11px]"></i>
            <span>Group View</span>
          </button>
          <button
            @click="activeView = 'ledger'"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
            :class="activeView === 'ledger' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'"
          >
            <i class="fa-solid fa-list-ul text-[11px]"></i>
            <span>Ledger View</span>
          </button>
          <button
            @click="activeView = 'criticality'"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
            :class="activeView === 'criticality' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'"
          >
            <i class="fa-solid fa-triangle-exclamation text-[11px]"></i>
            <span>Criticality View</span>
          </button>
        </div>
      </div>

      <!-- Quick Filter Pills -->
      <div class="max-w-7xl mx-auto mt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-[11px]">
        <button
          @click="statusFilter = 'all'"
          class="px-2.5 py-1 rounded-full font-bold whitespace-nowrap transition-all"
          :class="statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
        >
          All Parties ({{ totalMatchingCount }})
        </button>
        <button
          @click="statusFilter = 'wholesaler'"
          class="px-2.5 py-1 rounded-full font-bold whitespace-nowrap transition-all"
          :class="statusFilter === 'wholesaler' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'"
        >
          🏢 Wholesalers
        </button>
        <button
          @click="statusFilter = 'bad_debt'"
          class="px-2.5 py-1 rounded-full font-bold whitespace-nowrap transition-all"
          :class="statusFilter === 'bad_debt' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'"
        >
          🔴 Bad Debts
        </button>
        <button
          @click="statusFilter = 'settled'"
          class="px-2.5 py-1 rounded-full font-bold whitespace-nowrap transition-all"
          :class="statusFilter === 'settled' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'"
        >
          🟡 Settled (Not Accounted)
        </button>
        <button
          v-if="stagedCount > 0"
          @click="statusFilter = 'staged'"
          class="px-2.5 py-1 rounded-full font-bold whitespace-nowrap transition-all"
          :class="statusFilter === 'staged' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'"
        >
          ⚡ Staged ({{ stagedCount }})
        </button>
      </div>
    </header>

    <!-- Content Area -->
    <main class="max-w-7xl mx-auto px-4 py-4 sm:px-6">
      <!-- Loading State -->
      <div v-if="loading && (!allLedgers || allLedgers.length === 0)" class="py-20 text-center text-slate-400">
        <i class="fa-solid fa-spinner fa-spin text-3xl text-indigo-500 mb-3"></i>
        <p class="text-sm font-bold text-slate-600">Loading ledger data...</p>
      </div>

      <!-- GROUP VIEW -->
      <div v-else-if="activeView === 'group'" class="space-y-4">
        <div
          v-for="grp in filteredGroupsList"
          :key="grp.groupName"
          class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all"
        >
          <!-- Group Header Accordion -->
          <button
            @click="toggleGroupExpand(grp.groupName)"
            class="w-full px-4 py-3 bg-slate-50/70 hover:bg-slate-100/70 transition-colors flex items-center justify-between text-left"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <i class="fa-solid fa-folder text-indigo-500 text-xs shrink-0"></i>
              <span class="text-xs sm:text-sm font-black text-slate-800 tracking-tight uppercase truncate">
                {{ grp.groupName }}
              </span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/80 text-slate-700 shrink-0">
                {{ grp.ledgers.length }}
              </span>
            </div>
            <i
              class="fa-solid fa-chevron-down text-xs text-slate-400 transition-transform"
              :class="{ 'rotate-180': expandedGroups[grp.groupName] }"
            ></i>
          </button>

          <!-- Group Ledgers List -->
          <div v-show="expandedGroups[grp.groupName] !== false" class="p-3 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-slate-100">
            <PartyTagCard
              v-for="ledger in grp.ledgers"
              :key="ledger.ledgerName"
              :ledger="ledger"
              :effective="getEffectiveParty(ledger)"
              @update="handleTagUpdate(ledger, $event)"
              @discard="discardSingleChange(ledger.ledgerName)"
            />
          </div>
        </div>
      </div>

      <!-- LEDGER VIEW (Flat List) -->
      <div v-else-if="activeView === 'ledger'" class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <PartyTagCard
          v-for="ledger in filteredFlatList"
          :key="ledger.ledgerName"
          :ledger="ledger"
          :effective="getEffectiveParty(ledger)"
          @update="handleTagUpdate(ledger, $event)"
          @discard="discardSingleChange(ledger.ledgerName)"
        />
      </div>

      <!-- CRITICALITY VIEW (Line Debtors Aging Risk Buckets) -->
      <div v-else-if="activeView === 'criticality'" class="space-y-5">
        <div
          v-for="bucket in criticalityBuckets"
          :key="bucket.key"
          class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden"
        >
          <!-- Bucket Header -->
          <div class="px-4 py-3 flex items-center justify-between" :class="bucket.headerBg">
            <div class="flex items-center gap-2.5">
              <span class="text-base">{{ bucket.icon }}</span>
              <div>
                <h3 class="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                  {{ bucket.title }}
                </h3>
                <p class="text-[10px] font-medium text-slate-500">
                  {{ bucket.desc }}
                </p>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-black" :class="bucket.badgeClass">
              {{ bucket.items.length }} Parties • ₹{{ formatMoney(bucket.totalOutstanding) }}
            </span>
          </div>

          <!-- Bucket Cards -->
          <div class="p-3 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-slate-100">
            <PartyTagCard
              v-for="ledger in bucket.items"
              :key="ledger.ledgerName"
              :ledger="ledger"
              :effective="getEffectiveParty(ledger)"
              :criticalityBadge="bucket.title"
              @update="handleTagUpdate(ledger, $event)"
              @discard="discardSingleChange(ledger.ledgerName)"
            />
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="totalMatchingCount === 0 && !loading" class="py-16 text-center text-slate-400">
        <i class="fa-solid fa-users-slash text-4xl text-slate-300 mb-2"></i>
        <p class="text-sm font-bold text-slate-600">No matching parties found</p>
        <p class="text-xs text-slate-400 mt-0.5">Try clearing your search query or filter tags.</p>
      </div>
    </main>

    <!-- Commit Preview Modal -->
    <PartyCommitPreviewModal
      :show="showCommitModal"
      @close="showCommitModal = false"
      @committed="handleCommitted"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useLedgerData } from '@/composables/useLedgerData';
import { usePartyTagger } from '@/composables/usePartyTagger';
import { useAnalyzerData } from '@/composables/useAnalyzerData';
import PartyTagCard from '@/components/Ledger/PartyTagCard.vue';
import PartyCommitPreviewModal from '@/components/Ledger/PartyCommitPreviewModal.vue';

const router = useRouter();
const { ledgerData, allLedgers, loading, loadLedgerData } = useLedgerData();
const { stagedCount, getEffectiveParty, stagePartyChange, discardSingleChange } = usePartyTagger();
const { processedData } = useAnalyzerData();

const searchQuery = ref('');
const activeView = ref('group'); // 'group' | 'ledger' | 'criticality'
const statusFilter = ref('all'); // 'all' | 'wholesaler' | 'bad_debt' | 'settled' | 'staged'
const expandedGroups = ref({});
const showCommitModal = ref(false);

onMounted(async () => {
  await loadLedgerData();
});

const handleRefresh = async () => {
  await loadLedgerData(true);
};

const handleTagUpdate = (ledger, updates) => {
  stagePartyChange(ledger, updates);
};

const handleCommitted = () => {
  showCommitModal.value = false;
};

const toggleGroupExpand = (groupName) => {
  if (expandedGroups.value[groupName] === false) {
    expandedGroups.value[groupName] = true;
  } else {
    expandedGroups.value[groupName] = false;
  }
};

const formatMoney = (val) => {
  if (!val) return '0';
  return Math.round(val).toLocaleString('en-IN');
};

// Filter party helper
const matchesFilter = (ledger) => {
  const eff = getEffectiveParty(ledger);
  
  // Status filter
  if (statusFilter.value === 'wholesaler' && eff.partyType !== 'wholesaler') return false;
  if (statusFilter.value === 'bad_debt' && eff.creditStatus !== 'bad_debt') return false;
  if (statusFilter.value === 'settled' && eff.settlementStatus !== 'settled_unaccounted') return false;
  if (statusFilter.value === 'staged' && !eff.isStaged) return false;

  // Search query
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim();
    const name = (ledger.ledgerName || '').toLowerCase();
    const grp = (ledger.groupName || '').toLowerCase();
    const note = (eff.settlementNote || '').toLowerCase();
    return name.includes(q) || grp.includes(q) || note.includes(q);
  }

  return true;
};

// Filtered Flat List for Ledger View
const filteredFlatList = computed(() => {
  return allLedgers.value.filter(matchesFilter);
});

// Filtered Groups List for Group View
const filteredGroupsList = computed(() => {
  if (!ledgerData.value) return [];
  const list = [];
  ledgerData.value.forEach((grp) => {
    if (!grp.ledgers) return;
    const matched = grp.ledgers
      .map(l => ({ ...l, groupName: grp.groupName }))
      .filter(matchesFilter);
    if (matched.length > 0) {
      list.push({
        groupName: grp.groupName,
        ledgers: matched,
      });
    }
  });
  return list;
});

const totalMatchingCount = computed(() => {
  return filteredFlatList.value.length;
});

// Criticality Buckets (Using Analyzer Data for Line Debtors)
const criticalityBuckets = computed(() => {
  const debtors = processedData.value?.debtors || [];
  
  // Map of ledgerName -> debtor analysis
  const debtorMap = new Map();
  debtors.forEach(d => {
    debtorMap.set((d.ledgerName || '').trim().toLowerCase(), d);
  });

  const b1y = [];
  const b9m = [];
  const b6m = [];
  const b3m = [];
  const other = [];

  let tot1y = 0;
  let tot9m = 0;
  let tot6m = 0;
  let tot3m = 0;
  let totOther = 0;

  filteredFlatList.value.forEach(l => {
    const d = debtorMap.get((l.ledgerName || '').trim().toLowerCase());
    const bal = Math.abs(l.closingBalance || 0);

    if (d) {
      if (d.b_1y_plus > 100) {
        b1y.push(l);
        tot1y += bal;
      } else if (d.b_9m > 100) {
        b9m.push(l);
        tot9m += bal;
      } else if (d.b_6m > 100) {
        b6m.push(l);
        tot6m += bal;
      } else {
        b3m.push(l);
        tot3m += bal;
      }
    } else {
      other.push(l);
      totOther += bal;
    }
  });

  return [
    {
      key: '1y',
      title: '1 Year+ Overdue (Critical Risk)',
      desc: 'Oldest outstanding receivables requiring urgent recovery or write-off review',
      icon: '🚨',
      headerBg: 'bg-rose-50/80',
      badgeClass: 'bg-rose-100 text-rose-800 border border-rose-200',
      items: b1y,
      totalOutstanding: tot1y,
    },
    {
      key: '9m',
      title: '6 to 9 Months Overdue',
      desc: 'High-risk aging bracket',
      icon: '⚠️',
      headerBg: 'bg-amber-50/80',
      badgeClass: 'bg-amber-100 text-amber-800 border border-amber-200',
      items: b9m,
      totalOutstanding: tot9m,
    },
    {
      key: '6m',
      title: '3 to 6 Months Overdue',
      desc: 'Medium-risk aging bracket',
      icon: '⏳',
      headerBg: 'bg-indigo-50/80',
      badgeClass: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
      items: b6m,
      totalOutstanding: tot6m,
    },
    {
      key: '3m',
      title: 'Under 3 Months / Active',
      desc: 'Standard running accounts',
      icon: '✅',
      headerBg: 'bg-emerald-50/80',
      badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      items: b3m,
      totalOutstanding: tot3m,
    },
    {
      key: 'other',
      title: 'Other Accounts / Non-Line Debtors',
      desc: 'Suppliers, general ledgers and non-line accounts',
      icon: '📂',
      headerBg: 'bg-slate-50',
      badgeClass: 'bg-slate-200 text-slate-800',
      items: other,
      totalOutstanding: totOther,
    },
  ].filter(b => b.items.length > 0);
});
</script>
