<template>
  <div class="az-shell">
    <!-- Ambient Glow Orbs (from HomeView) -->
    <div class="az-orb az-orb--warm"></div>
    <div class="az-orb az-orb--accent"></div>

    <main class="az-main">
      <!-- ═══ TOP BAR ═══ -->
      <header class="az-topbar">
        <div class="az-topbar__left">
          <button type="button" @click="handleBack" class="az-icon-btn" title="Back to Hub">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div class="az-topbar__title">
            <span class="az-topbar__label">Analyzer</span>
            <span class="az-topbar__sub">{{ activeTab }} · {{ getMonthLabel(currentMonth) }}</span>
          </div>
        </div>
        <div class="az-topbar__right">
          <button @click="toggleExpandAll" class="az-icon-btn" :title="allExpanded ? 'Collapse All' : 'Expand All'" id="expand-all-btn">
            <i :class="['fa-solid', allExpanded ? 'fa-compress' : 'fa-expand']"></i>
          </button>
          <!-- Sort -->
          <div class="az-sort-wrap" ref="sortDropdownRef">
            <button @click="showSortMenu = !showSortMenu" class="az-icon-btn" title="Sort" id="sort-btn">
              <i class="fa-solid fa-arrow-down-wide-short"></i>
            </button>
            <Transition name="dropdown">
              <div v-if="showSortMenu" class="az-dropdown az-dropdown--sort">
                <div class="az-dropdown__header"><span>Sort by</span></div>
                <button v-for="opt in sortOptions" :key="opt.key"
                  @click="handleSort(opt.key)"
                  :class="['az-sort-opt', sortBy === opt.key && 'az-sort-opt--active']"
                >
                  <i :class="opt.icon"></i>
                  {{ opt.label }}
                  <i v-if="sortBy === opt.key" :class="['fa-solid ml-auto', sortDir === 'asc' ? 'fa-arrow-up' : 'fa-arrow-down']"></i>
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </header>

      <!-- ═══ TAB BAR (File-Tab Style) ═══ -->
      <div class="az-controls">
        <div class="az-tab-bar" id="analyzer-tabs">
          <button v-for="tab in ['Debtors', 'Creditors']" :key="tab"
            @click="activeTab = tab"
            :class="['az-file-tab', activeTab === tab && 'az-file-tab--active']"
            :id="`tab-${tab.toLowerCase()}`"
          >
            <i :class="['fa-solid', tab === 'Debtors' ? 'fa-arrow-trend-down' : 'fa-arrow-trend-up']"></i>
            {{ tab }}
          </button>
        </div>

        <!-- Search Bar -->
        <div class="az-search-wrap">
          <i class="fa-solid fa-magnifying-glass az-search-icon"></i>
          <input v-model="searchQuery" type="search" autocomplete="off"
            class="az-search" :placeholder="`Search ${viewMode === 'Group View' ? 'groups' : 'parties'}…`"
            id="analyzer-search" />
          <button v-if="searchQuery" @click="searchQuery = ''" class="az-search-clear">
            <i class="fa-solid fa-circle-xmark"></i>
          </button>
        </div>

        <div class="az-controls__right">
          <!-- View Toggle -->
          <div class="az-view-toggle" id="view-toggle">
            <button v-for="view in ['Group View', 'Party View']" :key="view"
              @click="viewMode = view"
              :class="['az-view-toggle__btn', viewMode === view && 'az-view-toggle__btn--active']"
              :id="`toggle-${view.replace(' ', '-').toLowerCase()}`"
            >
              <i :class="['fa-solid', view === 'Group View' ? 'fa-layer-group' : 'fa-user']"></i>
              {{ view }}
            </button>
          </div>

          <!-- Group Filter (Party View only) -->
          <div v-if="viewMode === 'Party View'" class="az-filter-wrap" ref="filterDropdownRef">
            <button @click="showGroupFilter = !showGroupFilter"
              class="az-icon-btn az-icon-btn--filter"
              id="group-filter-btn"
            >
              <i class="fa-solid fa-filter"></i>
              <span v-if="selectedGroups.length > 0" class="az-filter-badge">{{ selectedGroups.length }}</span>
            </button>

            <Transition name="dropdown">
              <div v-if="showGroupFilter" class="az-dropdown" id="group-filter-dropdown">
                <div class="az-dropdown__header">
                  <span>Filter by Group</span>
                  <button v-if="selectedGroups.length > 0" @click="selectedGroups = []" class="az-dropdown__clear">Clear</button>
                </div>
                <div class="az-dropdown__list">
                  <label v-for="group in currentGroupList" :key="group.groupName" class="az-dropdown__item">
                    <input type="checkbox" :value="group.groupName" v-model="selectedGroups" />
                    <span class="az-dropdown__name">{{ toTitleCase(group.groupName) }}</span>
                    <span class="az-dropdown__count">{{ group.partyCount }}</span>
                  </label>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>

      <!-- ═══ CONTENT ═══ -->
      <section class="az-content">

        <!-- Loading -->
        <div v-if="loading" class="az-empty-state">
          <div class="az-spinner-wrap">
            <div class="az-spinner"></div>
          </div>
          <p class="az-empty-state__title">Loading analyzer</p>
          <p class="az-empty-state__sub">Processing ledger data…</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="az-empty-state">
          <div class="az-empty-state__icon az-empty-state__icon--error">
            <i class="fa-solid fa-plug-circle-xmark"></i>
          </div>
          <p class="az-empty-state__title">Couldn't load data</p>
          <p class="az-empty-state__sub">{{ error }}</p>
          <button @click="loadLedgerData" class="az-retry-btn">Try again</button>
        </div>

        <!-- Empty -->
        <div v-else-if="displayData.length === 0" class="az-empty-state">
          <div class="az-empty-state__icon">
            <i class="fa-solid fa-chart-pie"></i>
          </div>
          <p class="az-empty-state__title">No data found</p>
          <p class="az-empty-state__sub">No {{ activeTab.toLowerCase() }} data available.</p>
        </div>

        <!-- ═══ DATA TABLE ═══ -->
        <div v-else class="az-table-card" id="analyzer-table">
          <table class="az-table">
            <thead>
              <tr>
                <th class="az-th az-th--num">#</th>
                <th class="az-th az-th--name">{{ viewMode === 'Group View' ? 'Group' : 'Party' }}</th>
                <th class="az-th az-th--amt">{{ activeTab === 'Debtors' ? 'Payment Recd.' : 'Payment Made' }}</th>
                <th class="az-th az-th--amt">{{ activeTab === 'Debtors' ? 'Goods Sold' : 'Goods Purchased' }}</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(item, idx) in displayData" :key="viewMode + '-' + getItemName(item) + '-' + idx">
                <!-- Main Row (Current Month) -->
                <tr @click="toggleRow(idx)"
                  :class="['az-tr', isExpanded(idx) && 'az-tr--expanded']"
                  :id="`row-${idx}`"
                >
                  <td class="az-td az-td--num">{{ idx + 1 }}</td>
                  <td class="az-td az-td--name">
                    <div class="az-name-cell">
                      <div :class="['az-avatar', viewMode === 'Group View' ? 'az-avatar--group' : 'az-avatar--party']">
                        <i :class="['fa-solid', viewMode === 'Group View' ? 'fa-layer-group' : 'fa-user']"></i>
                      </div>
                      <div class="az-name-text">
                        <span class="az-name-primary">{{ toTitleCase(getItemName(item)) }}</span>
                        <span class="az-name-secondary" v-if="viewMode === 'Group View'">
                          {{ item.partyCount }} {{ item.partyCount === 1 ? 'party' : 'parties' }}
                        </span>
                        <span class="az-name-secondary az-name-secondary--accent" v-else>
                          {{ toTitleCase(item.groupName) }}
                        </span>
                      </div>
                      <i :class="['fa-solid fa-chevron-down az-chevron', isExpanded(idx) && 'az-chevron--open']"></i>
                    </div>
                  </td>
                  <td class="az-td az-td--amt">
                    <span class="az-amount">₹{{ formatAmount(item.currentPayment) }}</span>
                    <PctBadge :value="item.currentPaymentPct" />
                  </td>
                  <td class="az-td az-td--amt">
                    <span class="az-amount">₹{{ formatAmount(item.currentGoods) }}</span>
                    <PctBadge :value="item.currentGoodsPct" />
                  </td>
                </tr>

                <!-- Expanded Sub-Rows: previous 5 months, newest first -->
                <tr v-for="(mk, mIdx) in previousMonths" :key="'sub-' + idx + '-' + mk"
                  v-show="isExpanded(idx)"
                  class="az-tr az-tr--sub"
                  :style="{ '--sub-delay': `${mIdx * 0.04}s` }"
                >
                  <td class="az-td az-td--num"></td>
                  <td class="az-td az-td--name">
                    <span class="az-month-label">
                      <i class="fa-regular fa-calendar"></i>
                      {{ getMonthLabel(mk) }}
                    </span>
                  </td>
                  <td class="az-td az-td--amt">
                    <span class="az-amount az-amount--sub">₹{{ formatAmount(item.monthlyData[mk]?.payment || 0) }}</span>
                    <PctBadge :value="item.monthlyData[mk]?.paymentPct" size="sm" />
                  </td>
                  <td class="az-td az-td--amt">
                    <span class="az-amount az-amount--sub">₹{{ formatAmount(item.monthlyData[mk]?.goods || 0) }}</span>
                    <PctBadge :value="item.monthlyData[mk]?.goodsPct" size="sm" />
                  </td>
                </tr>
              </template>
            </tbody>
          </table>

          <!-- Footer -->
          <div class="az-table-footer">
            <span>{{ displayData.length }} {{ viewMode === 'Group View' ? 'groups' : 'parties' }}</span>
            <span>{{ getMonthLabel(previousMonths[previousMonths.length - 1]) }} — {{ getMonthLabel(currentMonth) }}</span>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, h, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useAnalyzerData } from '../composables/useAnalyzerData';

const router = useRouter();

const {
  debtorGroups, creditorGroups,
  debtorParties, creditorParties,
  months, currentMonth, previousMonths,
  loading, error,
  loadLedgerData, getMonthLabel,
} = useAnalyzerData();

// ─── State ───────────────────────────────────────────────
const activeTab = ref('Debtors');
const viewMode = ref('Group View');
const expandedSet = ref({}); // Use plain object for reactivity — keys are row indices
const allExpanded = ref(false);
const selectedGroups = ref([]);
const showGroupFilter = ref(false);
const filterDropdownRef = ref(null);
const searchQuery = ref('');
const sortBy = ref('name'); // 'name' | 'payment' | 'goods'
const sortDir = ref('asc'); // 'asc' | 'desc'
const showSortMenu = ref(false);
const sortDropdownRef = ref(null);

const sortOptions = [
  { key: 'name', label: 'Name', icon: 'fa-solid fa-font' },
  { key: 'payment', label: 'Payment', icon: 'fa-solid fa-indian-rupee-sign' },
  { key: 'goods', label: 'Goods', icon: 'fa-solid fa-box' },
];

const isExpanded = (idx) => !!expandedSet.value[idx];

const handleClickOutside = (e) => {
  if (filterDropdownRef.value && !filterDropdownRef.value.contains(e.target)) {
    showGroupFilter.value = false;
  }
  if (sortDropdownRef.value && !sortDropdownRef.value.contains(e.target)) {
    showSortMenu.value = false;
  }
};

onMounted(() => {
  loadLedgerData();
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});

watch([activeTab, viewMode], () => {
  expandedSet.value = {};
  allExpanded.value = false;
  selectedGroups.value = [];
  showGroupFilter.value = false;
  searchQuery.value = '';
});

// ─── Computed ────────────────────────────────────────────

const SYSTEM_GROUPS = [
  "_META_DATA_", "&#4; Primary", "Bank Accounts", "Bank OD A/c", "Capital Account", 
  "Cash-in-Hand", "Current Assets", "Current Liabilities", "Direct Expenses", 
  "Direct Incomes", "Duties & Taxes", "Fixed Assets", "Indirect Expenses", 
  "Indirect Incomes", "Investments", "Petty Expenses", "Purchase Accounts", 
  "Sales Accounts", "SHAD", "STAFF", "Sundry Creditors", "Sundry Debtors", 
  "Unsecured Loans", "RETAILER MEET 3.12.2025"
];

const currentGroupList = computed(() => {
  const list = activeTab.value === 'Debtors' ? debtorGroups.value : creditorGroups.value;
  return list.filter(g => g.partyCount > 0 && !SYSTEM_GROUPS.includes(g.groupName));
});

const displayData = computed(() => {
  let data;
  if (viewMode.value === 'Group View') {
    data = [...currentGroupList.value];
  } else {
    let parties = activeTab.value === 'Debtors' ? [...debtorParties.value] : [...creditorParties.value];
    if (selectedGroups.value.length > 0) {
      const filterSet = new Set(selectedGroups.value);
      parties = parties.filter(p => filterSet.has(p.groupName));
    }
    data = parties;
  }

  // Search filter
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    data = data.filter(item => {
      const name = (viewMode.value === 'Party View' ? item.name : item.groupName) || '';
      return name.toLowerCase().includes(q) || (item.groupName || '').toLowerCase().includes(q);
    });
  }

  // Sort
  data.sort((a, b) => {
    let cmp = 0;
    if (sortBy.value === 'name') {
      const nameA = viewMode.value === 'Party View' ? (a.name || '') : (a.groupName || '');
      const nameB = viewMode.value === 'Party View' ? (b.name || '') : (b.groupName || '');
      cmp = nameA.localeCompare(nameB);
    } else if (sortBy.value === 'payment') {
      cmp = (a.currentPayment || 0) - (b.currentPayment || 0);
    } else if (sortBy.value === 'goods') {
      cmp = (a.currentGoods || 0) - (b.currentGoods || 0);
    }
    return sortDir.value === 'asc' ? cmp : -cmp;
  });

  return data;
});

// ─── Helpers ─────────────────────────────────────────────

/** Fix #1: In Party View show party name (item.name), in Group View show group name */
const getItemName = (item) => {
  if (viewMode.value === 'Party View') {
    return item.name || item.groupName;
  }
  return item.groupName;
};

const handleBack = () => router.push('/home');

const toggleRow = (idx) => {
  const copy = { ...expandedSet.value };
  if (copy[idx]) {
    delete copy[idx];
  } else {
    copy[idx] = true;
  }
  expandedSet.value = copy;
  allExpanded.value = Object.keys(copy).length === displayData.value.length;
};

const toggleExpandAll = () => {
  if (allExpanded.value) {
    expandedSet.value = {};
    allExpanded.value = false;
  } else {
    const all = {};
    displayData.value.forEach((_, idx) => { all[idx] = true; });
    expandedSet.value = all;
    allExpanded.value = true;
  }
};

const handleSort = (key) => {
  if (sortBy.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortBy.value = key;
    sortDir.value = key === 'name' ? 'asc' : 'desc'; // amounts default desc (highest first)
  }
  showSortMenu.value = false;
  expandedSet.value = {};
  allExpanded.value = false;
};

const formatAmount = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '0';
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.abs(amount));
};

const toTitleCase = (str) => {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

// ─── PctBadge ────────────────────────────────────────────
const PctBadge = (props) => {
  const val = props.value;
  const small = props.size === 'sm';
  if (val === null || val === undefined) return null;

  const isUp = val > 0;
  const isZero = val === 0;
  const display = Math.abs(val).toFixed(1) + '%';

  const cls = [
    'az-pct',
    small ? 'az-pct--sm' : '',
    isZero ? 'az-pct--flat' : isUp ? 'az-pct--up' : 'az-pct--down'
  ].filter(Boolean).join(' ');

  const icon = isZero ? 'fa-solid fa-minus' : isUp ? 'fa-solid fa-arrow-up' : 'fa-solid fa-arrow-down';

  return h('span', { class: cls }, [
    h('i', { class: icon }),
    ` ${display}`
  ]);
};
PctBadge.props = { value: { type: Number, default: null }, size: { type: String, default: '' } };
</script>

<style scoped>
/* ══════════════════════════════════════
   SHELL — Matches HomeView warm tone
   ══════════════════════════════════════ */
.az-shell {
  min-height: 100vh;
  min-height: 100dvh;
  background: #f8f6f1;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  position: relative;
  overflow-x: hidden;
}

.az-main {
  position: relative;
  padding: 0 clamp(16px, 4vw, 48px);
  padding-bottom: 48px;
}

/* ══════════════════════════════════════
   AMBIENT ORBS (from HomeView)
   ══════════════════════════════════════ */
.az-orb {
  position: fixed;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
  z-index: 0;
  opacity: 0.45;
}
.az-orb--warm {
  width: 700px; height: 700px;
  top: -180px; right: -100px;
  background: radial-gradient(circle, #fde68a 0%, #fbbf24 40%, transparent 70%);
}
.az-orb--accent {
  width: 500px; height: 500px;
  bottom: -120px; left: -80px;
  background: radial-gradient(circle, #c4b5fd 0%, #8b5cf6 40%, transparent 70%);
  opacity: 0.25;
}

/* ══════════════════════════════════════
   TOP BAR
   ══════════════════════════════════════ */
.az-topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  backdrop-filter: blur(16px) saturate(1.4);
  -webkit-backdrop-filter: blur(16px) saturate(1.4);
}
.az-topbar__left, .az-topbar__right {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  z-index: 1;
}
.az-topbar__title {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.az-topbar__label {
  font-weight: 700;
  font-size: clamp(18px, 3vw, 24px);
  color: #1e293b;
  letter-spacing: -0.02em;
}
.az-topbar__sub {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
  letter-spacing: 0.02em;
}

/* Icon Buttons (from HomeView) */
.az-icon-btn {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.7);
  border: 1px solid rgba(0,0,0,0.06);
  color: #475569;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(.4,0,.2,1);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  position: relative;
}
.az-icon-btn:hover {
  background: #fff;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  transform: translateY(-1px);
}
.az-icon-btn:active { transform: scale(0.95); }

.az-icon-btn--filter { position: relative; }
.az-filter-badge {
  position: absolute;
  top: -4px; right: -4px;
  min-width: 18px; height: 18px;
  border-radius: 99px;
  background: linear-gradient(135deg, #d97706, #ea580c);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  box-shadow: 0 2px 8px rgba(217, 119, 6, 0.4);
}

/* ══════════════════════════════════════
   CONTROLS ROW (Tabs + View Toggle)
   ══════════════════════════════════════ */
.az-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0 16px;
  position: relative;
  z-index: 20;
  flex-wrap: wrap;
}
.az-controls__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* File-Tab Style */
.az-tab-bar {
  display: flex;
  gap: 2px;
  background: rgba(255,255,255,0.5);
  border-radius: 14px;
  padding: 4px;
  border: 1px solid rgba(0,0,0,0.04);
}
.az-file-tab {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 18px;
  border-radius: 11px;
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(.4,0,.2,1);
  border: none;
  background: transparent;
  letter-spacing: -0.01em;
}
.az-file-tab i { font-size: 11px; }
.az-file-tab:hover { color: #475569; background: rgba(255,255,255,0.6); }
.az-file-tab--active {
  background: #1e293b;
  color: #f8fafc;
  box-shadow: 0 6px 20px -4px rgba(0,0,0,0.3);
}
.az-file-tab--active:hover { background: #0f172a; color: #f1f5f9; }

/* View Toggle */
.az-view-toggle {
  display: flex;
  gap: 2px;
  background: rgba(255,255,255,0.5);
  border-radius: 11px;
  padding: 3px;
  border: 1px solid rgba(0,0,0,0.04);
}
.az-view-toggle__btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  background: transparent;
}
.az-view-toggle__btn i { font-size: 9px; }
.az-view-toggle__btn:hover { color: #475569; }
.az-view-toggle__btn--active {
  background: #fff;
  color: #1e293b;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  font-weight: 600;
}

/* Filter Wrap & Sort Wrap */
.az-filter-wrap, .az-sort-wrap { position: relative; }

/* Search Bar */
.az-search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 200px;
  max-width: 320px;
}
.az-search-icon {
  position: absolute;
  left: 12px;
  font-size: 13px;
  color: #94a3b8;
  pointer-events: none;
}
.az-search {
  width: 100%;
  padding: 8px 32px 8px 36px;
  font-size: 13px;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.06);
  background: rgba(255, 255, 255, 0.6);
  color: #1e293b;
  outline: none;
  transition: all 0.2s;
}
.az-search:focus {
  background: #fff;
  border-color: #fbbf24;
  box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.15);
}
.az-search-clear {
  position: absolute;
  right: 10px;
  border: none;
  background: none;
  color: #cbd5e1;
  cursor: pointer;
  padding: 2px;
  font-size: 14px;
  display: flex;
  align-items: center;
}
.az-search-clear:hover {
  color: #94a3b8;
}

/* ══════════════════════════════════════
   DROPDOWN & SORT
   ══════════════════════════════════════ */
.az-dropdown {
  position: absolute;
  right: 0; top: calc(100% + 8px);
  width: 280px;
  background: rgba(255,255,255,0.97);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow: 0 20px 48px -12px rgba(15,23,42,0.18), 0 0 0 1px rgba(0,0,0,0.04);
  padding: 12px;
  z-index: 1000;
}
.az-dropdown--sort {
  width: 180px;
}
.az-dropdown__header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0 4px 8px;
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8;
}
.az-dropdown__clear {
  font-size: 10px; font-weight: 600; color: #d97706; cursor: pointer;
  background: none; border: none; text-transform: none; letter-spacing: 0;
}
.az-dropdown__clear:hover { color: #b45309; }
.az-dropdown__list {
  max-height: 220px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(203,213,225,0.4) transparent;
}
.az-dropdown__list::-webkit-scrollbar { width: 3px; }
.az-dropdown__list::-webkit-scrollbar-thumb { background: rgba(203,213,225,0.4); border-radius: 99px; }
.az-dropdown__item {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 8px; border-radius: 10px; cursor: pointer;
  font-size: 12px; color: #334155;
  transition: background 0.15s;
}
.az-dropdown__item:hover { background: #fef3c7; }
.az-dropdown__item input[type="checkbox"] {
  width: 15px; height: 15px; border-radius: 4px;
  accent-color: #d97706;
}
.az-dropdown__name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.az-dropdown__count { font-size: 10px; color: #94a3b8; flex-shrink: 0; }

/* Sort Option Item */
.az-sort-opt {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: #475569;
  font-size: 12px;
  font-weight: 500;
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
}
.az-sort-opt:hover {
  background: #fef3c7;
  color: #b45309;
}
.az-sort-opt--active {
  background: #fef3c7;
  color: #b45309;
  font-weight: 600;
}

/* ══════════════════════════════════════
   TABLE CARD
   ══════════════════════════════════════ */
.az-content { position: relative; z-index: 1; }

.az-table-card {
  background: rgba(255,255,255,0.65);
  backdrop-filter: blur(14px) saturate(1.3);
  -webkit-backdrop-filter: blur(14px) saturate(1.3);
  border: 1px solid rgba(255,255,255,0.8);
  border-radius: 20px;
  box-shadow:
    0 1px 0 rgba(255,255,255,0.9) inset,
    0 8px 32px -8px rgba(15,23,42,0.06);
  overflow: hidden;
  animation: card-rise 0.5s cubic-bezier(.16,1,.3,1) both;
}

.az-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

/* Column widths */
.az-th--num, .az-td--num { width: 48px; }
.az-th--name, .az-td--name { width: auto; }
.az-th--amt, .az-td--amt { width: 180px; }

.az-th {
  padding: 14px 16px;
  text-align: left;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #94a3b8;
  border-bottom: 1px solid rgba(0,0,0,0.04);
  background: rgba(248,246,241,0.5);
}
.az-th--num { text-align: center; }
.az-th--amt { text-align: right; }

/* ══════════════════════════════════════
   TABLE ROWS
   ══════════════════════════════════════ */
.az-tr {
  cursor: pointer;
  transition: all 0.2s cubic-bezier(.4,0,.2,1);
  border-bottom: 1px solid rgba(0,0,0,0.03);
}
.az-tr:hover { background: rgba(254,243,199,0.25); }
.az-tr--expanded {
  background: rgba(254,243,199,0.15);
  border-bottom-color: transparent;
}

.az-tr--sub {
  cursor: default;
  background: rgba(248,246,241,0.5);
  border-bottom: 1px solid rgba(0,0,0,0.02);
  animation: subrow-in 0.25s cubic-bezier(.16,1,.3,1) var(--sub-delay, 0s) both;
}
.az-tr--sub:hover { background: rgba(254,243,199,0.2); }

.az-td {
  padding: 12px 16px;
  vertical-align: middle;
}
.az-td--num {
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  color: #cbd5e1;
}
.az-td--amt { text-align: right; }

/* Name Cell */
.az-name-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}
.az-avatar {
  width: 36px; height: 36px;
  border-radius: 11px;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px;
  flex-shrink: 0;
  transition: transform 0.3s cubic-bezier(.4,0,.2,1);
}
.az-tr:hover .az-avatar { transform: scale(1.08); }
.az-avatar--group {
  background: linear-gradient(135deg, #d97706, #ea580c);
  color: #fff;
  box-shadow: 0 4px 14px -2px rgba(217,119,6,0.35);
}
.az-avatar--party {
  background: linear-gradient(135deg, #e2e8f0, #f1f5f9);
  color: #64748b;
  border: 1px solid rgba(0,0,0,0.04);
}

.az-name-text {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: 2px;
}
.az-name-primary {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.01em;
}
.az-name-secondary {
  font-size: 10px;
  color: #94a3b8;
  font-weight: 500;
}
.az-name-secondary--accent { color: #b45309; }

.az-chevron {
  font-size: 9px;
  color: #cbd5e1;
  flex-shrink: 0;
  transition: transform 0.3s cubic-bezier(.4,0,.2,1);
}
.az-chevron--open { transform: rotate(180deg); }

/* Amount */
.az-amount {
  display: block;
  font-family: 'JetBrains Mono', 'SF Mono', 'Consolas', monospace;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}
.az-amount--sub {
  font-size: 12px;
  font-weight: 500;
  color: #475569;
}

/* Month Label in sub-rows */
.az-month-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
  padding-left: 48px; /* align with name text past the avatar */
}
.az-month-label i { font-size: 10px; color: #cbd5e1; }

/* Percentage Badge */
.az-pct {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  font-weight: 700;
  margin-top: 2px;
}
.az-pct i { font-size: 7px; }
.az-pct--sm { font-size: 9px; }
.az-pct--sm i { font-size: 6px; }
.az-pct--up { color: #16a34a; }
.az-pct--down { color: #dc2626; }
.az-pct--flat { color: #94a3b8; }

/* Table Footer */
.az-table-footer {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
  border-top: 1px solid rgba(0,0,0,0.03);
  background: rgba(248,246,241,0.4);
}

/* ══════════════════════════════════════
   EMPTY / LOADING STATES
   ══════════════════════════════════════ */
.az-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  text-align: center;
}
.az-empty-state__icon {
  width: 80px; height: 80px;
  border-radius: 24px;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px;
  color: #d97706;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  margin-bottom: 24px;
  box-shadow: 0 8px 24px -4px rgba(217,119,6,0.2);
}
.az-empty-state__icon--error {
  color: #dc2626;
  background: linear-gradient(135deg, #fecaca, #fca5a5);
  box-shadow: 0 8px 24px -4px rgba(220,38,38,0.2);
}
.az-empty-state__title {
  font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 6px;
}
.az-empty-state__sub {
  font-size: 13px; color: #94a3b8; max-width: 320px;
}
.az-spinner-wrap {
  margin-bottom: 24px;
}
.az-spinner {
  width: 48px; height: 48px;
  border: 3px solid rgba(217,119,6,0.15);
  border-top-color: #d97706;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.az-retry-btn {
  margin-top: 20px;
  padding: 10px 28px;
  border-radius: 12px;
  background: linear-gradient(135deg, #d97706, #ea580c);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  box-shadow: 0 6px 20px -4px rgba(217,119,6,0.4);
  transition: all 0.2s;
}
.az-retry-btn:hover { transform: translateY(-1px); filter: brightness(1.05); }
.az-retry-btn:active { transform: scale(0.97); }

/* ══════════════════════════════════════
   ANIMATIONS
   ══════════════════════════════════════ */
@keyframes card-rise {
  0% { opacity: 0; transform: translateY(16px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes subrow-in {
  0% { opacity: 0; transform: translateY(-4px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Dropdown transition */
.dropdown-enter-active { transition: all 0.2s cubic-bezier(.16,1,.3,1); }
.dropdown-leave-active { transition: all 0.15s ease-in; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px) scale(0.97); }

/* ══════════════════════════════════════
   RESPONSIVE
   ══════════════════════════════════════ */
@media (max-width: 639px) {
  .az-orb--warm { width: 400px; height: 400px; top: -100px; right: -60px; }
  .az-orb--accent { width: 300px; height: 300px; }
  .az-icon-btn { width: 36px; height: 36px; border-radius: 12px; font-size: 13px; }
  .az-topbar__label { font-size: 17px; }

  .az-file-tab { padding: 7px 14px; font-size: 12px; gap: 5px; }
  .az-file-tab i { font-size: 10px; }
  .az-view-toggle__btn { padding: 5px 10px; font-size: 10px; gap: 4px; }
  .az-controls { gap: 8px; padding: 6px 0 12px; flex-direction: column; align-items: stretch; }
  .az-search-wrap { max-width: none; }

  .az-table-card { border-radius: 16px; }

  .az-th--amt, .az-td--amt { width: 100px; }
  .az-th--num, .az-td--num { width: 32px; }

  .az-th { padding: 10px 8px; font-size: 8px; letter-spacing: 0.05em; }
  .az-td { padding: 10px 8px; }

  .az-avatar { width: 28px; height: 28px; border-radius: 8px; font-size: 11px; }
  .az-name-cell { gap: 8px; }
  .az-name-primary { font-size: 11px; }
  .az-name-secondary { font-size: 9px; }

  .az-amount { font-size: 11px; }
  .az-amount--sub { font-size: 10px; }

  .az-month-label { padding-left: 36px; font-size: 10px; }
  .az-chevron { font-size: 8px; }

  .az-pct { font-size: 9px; }
  .az-pct--sm { font-size: 8px; }

  .az-table-footer { padding: 10px 8px; font-size: 10px; }
}

@media (min-width: 640px) and (max-width: 1023px) {
  .az-th--amt, .az-td--amt { width: 170px; }
}

@media (min-width: 1024px) {
  .az-th--amt, .az-td--amt { width: 220px; }
  .az-th--num, .az-td--num { width: 56px; }
  .az-avatar { width: 40px; height: 40px; border-radius: 12px; font-size: 15px; }
  .az-name-primary { font-size: 14px; }
  .az-amount { font-size: 14px; }
}
</style>
