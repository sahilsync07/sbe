<template>
  <div class="creditor-analytics space-y-4">
    <!-- ═══ LOADING & ERROR STATES ═══ -->
    <div v-if="loading" class="py-20 flex flex-col items-center justify-center space-y-4">
      <div class="w-12 h-12 rounded-full border-3 border-amber-200 border-t-amber-600 animate-spin"></div>
      <p class="text-sm font-bold text-slate-600">Calculating Creditors & Payables aging breakdown…</p>
    </div>

    <div v-else-if="error" class="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center space-y-2">
      <i class="fa-solid fa-circle-exclamation text-rose-500 text-2xl"></i>
      <h3 class="text-base font-bold text-rose-900">Unable to load ledger data</h3>
      <p class="text-xs text-rose-700 max-w-md mx-auto">{{ error }}</p>
    </div>

    <template v-else>
      <!-- ═══ 5 KPI SUMMARY DASHBOARD ═══ -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        <!-- 0-30 Days -->
        <div
          @click="activeAgingFilter = activeAgingFilter === '0_30' ? 'all' : '0_30'"
          class="bg-white rounded-2xl p-3 sm:p-3.5 border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md active:scale-[0.99] relative overflow-hidden"
          :class="activeAgingFilter === '0_30' ? 'border-emerald-500 ring-2 ring-emerald-400/20 bg-emerald-50/40' : 'border-slate-200/80 hover:border-emerald-300'"
        >
          <div class="flex items-center justify-between mb-1">
            <span class="text-[10px] font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              0–30 Days
            </span>
            <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {{ summaryStats.pct0_30.toFixed(0) }}%
            </span>
          </div>
          <div class="text-sm sm:text-base font-black text-slate-900 tracking-tight">
            {{ formatINR(summaryStats.b0_30) }}
          </div>
          <p class="text-[10px] text-slate-400 font-semibold mt-0.5">{{ summaryStats.count0_30 }} Vendors (Current)</p>
        </div>

        <!-- 31-60 Days -->
        <div
          @click="activeAgingFilter = activeAgingFilter === '31_60' ? 'all' : '31_60'"
          class="bg-white rounded-2xl p-3 sm:p-3.5 border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md active:scale-[0.99] relative overflow-hidden"
          :class="activeAgingFilter === '31_60' ? 'border-amber-500 ring-2 ring-amber-400/20 bg-amber-50/40' : 'border-slate-200/80 hover:border-amber-300'"
        >
          <div class="flex items-center justify-between mb-1">
            <span class="text-[10px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-amber-500"></span>
              31–60 Days
            </span>
            <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {{ summaryStats.pct31_60.toFixed(0) }}%
            </span>
          </div>
          <div class="text-sm sm:text-base font-black text-slate-900 tracking-tight">
            {{ formatINR(summaryStats.b31_60) }}
          </div>
          <p class="text-[10px] text-slate-400 font-semibold mt-0.5">{{ summaryStats.count31_60 }} Vendors (Due)</p>
        </div>

        <!-- 61-90 Days -->
        <div
          @click="activeAgingFilter = activeAgingFilter === '61_90' ? 'all' : '61_90'"
          class="bg-white rounded-2xl p-3 sm:p-3.5 border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md active:scale-[0.99] relative overflow-hidden"
          :class="activeAgingFilter === '61_90' ? 'border-orange-500 ring-2 ring-orange-400/20 bg-orange-50/40' : 'border-slate-200/80 hover:border-orange-300'"
        >
          <div class="flex items-center justify-between mb-1">
            <span class="text-[10px] font-black text-orange-800 uppercase tracking-wider flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-orange-500"></span>
              61–90 Days
            </span>
            <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-800">
              {{ summaryStats.pct61_90.toFixed(0) }}%
            </span>
          </div>
          <div class="text-sm sm:text-base font-black text-slate-900 tracking-tight">
            {{ formatINR(summaryStats.b61_90) }}
          </div>
          <p class="text-[10px] text-slate-400 font-semibold mt-0.5">{{ summaryStats.count61_90 }} Vendors (Aging)</p>
        </div>

        <!-- 90-180 Days -->
        <div
          @click="activeAgingFilter = activeAgingFilter === '90_180' ? 'all' : '90_180'"
          class="bg-white rounded-2xl p-3 sm:p-3.5 border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md active:scale-[0.99] relative overflow-hidden"
          :class="activeAgingFilter === '90_180' ? 'border-rose-500 ring-2 ring-rose-400/20 bg-rose-50/40' : 'border-slate-200/80 hover:border-rose-300'"
        >
          <div class="flex items-center justify-between mb-1">
            <span class="text-[10px] font-black text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-rose-500"></span>
              90–180 Days
            </span>
            <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
              {{ summaryStats.pct90_180.toFixed(0) }}%
            </span>
          </div>
          <div class="text-sm sm:text-base font-black text-slate-900 tracking-tight">
            {{ formatINR(summaryStats.b90_180) }}
          </div>
          <p class="text-[10px] text-slate-400 font-semibold mt-0.5">{{ summaryStats.count90_180 }} Vendors (Overdue)</p>
        </div>

        <!-- 180+ Days -->
        <div
          @click="activeAgingFilter = activeAgingFilter === '180plus' ? 'all' : '180plus'"
          class="bg-white rounded-2xl p-3 sm:p-3.5 border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md active:scale-[0.99] relative overflow-hidden col-span-2 sm:col-span-1"
          :class="activeAgingFilter === '180plus' ? 'border-purple-500 ring-2 ring-purple-400/20 bg-purple-50/40' : 'border-slate-200/80 hover:border-purple-300'"
        >
          <div class="flex items-center justify-between mb-1">
            <span class="text-[10px] font-black text-purple-800 uppercase tracking-wider flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-purple-500"></span>
              180+ Days
            </span>
            <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
              {{ summaryStats.pct180_plus.toFixed(0) }}%
            </span>
          </div>
          <div class="text-sm sm:text-base font-black text-slate-900 tracking-tight">
            {{ formatINR(summaryStats.b180_plus) }}
          </div>
          <p class="text-[10px] text-slate-400 font-semibold mt-0.5">{{ summaryStats.count180_plus }} Vendors (Critical)</p>
        </div>
      </div>

      <!-- ═══ TOTAL PAYABLES BANNER ═══ -->
      <div class="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-4 sm:p-5 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span class="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
            Total Supplier Payables
          </span>
          <div class="text-2xl sm:text-3xl font-black font-['Clash_Display'] mt-2">
            {{ formatINR(summaryStats.totalPayable) }}
          </div>
          <p class="text-xs text-slate-300 mt-1">
            Across {{ summaryStats.vendorCount }} Active Vendors in {{ groupList.length }} Groups (Paragon & Sundry Creditors)
          </p>
        </div>

        <!-- View Switcher (Desktop & Mobile) -->
        <div class="flex items-center gap-2 bg-white/10 p-1.5 rounded-2xl backdrop-blur-md border border-white/10 shrink-0">
          <button
            @click="viewMode = 'Party View'"
            class="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            :class="viewMode === 'Party View' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-300 hover:text-white'"
          >
            <i class="fa-solid fa-user-tie mr-1.5"></i>
            Party View
          </button>
          <button
            @click="viewMode = 'Group View'"
            class="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            :class="viewMode === 'Group View' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-300 hover:text-white'"
          >
            <i class="fa-solid fa-layer-group mr-1.5"></i>
            Group View
          </button>
        </div>
      </div>

      <!-- ═══ SEARCH & CONTROLS BAR ═══ -->
      <div class="bg-white rounded-3xl p-3.5 sm:p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <!-- Search Box -->
          <div class="flex-1 relative">
            <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="`Search ${filteredCreditors.length} vendors by name, brand, city…`"
              class="w-full pl-9 pr-8 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all"
            />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Sort Select -->
          <div class="flex items-center gap-2">
            <select
              v-model="sortBy"
              class="px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="payable_desc">Sort: Highest Payable</option>
              <option value="overdue_desc">Sort: Highest Overdue (90d+)</option>
              <option value="name_asc">Sort: Name (A to Z)</option>
              <option value="name_desc">Sort: Name (Z to A)</option>
            </select>
          </div>
        </div>

        <!-- Active Aging Filter Alert / Reset -->
        <div v-if="activeAgingFilter !== 'all'" class="flex items-center justify-between text-xs bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-2xl text-amber-900">
          <div class="flex items-center gap-2 font-bold">
            <i class="fa-solid fa-filter text-amber-600"></i>
            <span>Filtering by {{ getAgingFilterLabel(activeAgingFilter) }}</span>
          </div>
          <button @click="activeAgingFilter = 'all'" class="text-amber-700 font-extrabold hover:underline cursor-pointer">
            Clear Filter
          </button>
        </div>
      </div>

      <!-- ═══ PARTY VIEW: INDIVIDUAL CREDITORS ═══ -->
      <div v-if="viewMode === 'Party View'" class="space-y-3">
        <div v-if="filteredCreditors.length === 0" class="bg-white rounded-3xl p-12 text-center border border-slate-200/80">
          <i class="fa-solid fa-filter-circle-xmark text-3xl text-slate-300 mb-3"></i>
          <p class="text-sm font-bold text-slate-600">No creditors match the selected criteria</p>
        </div>

        <div
          v-for="party in filteredCreditors"
          :key="party.ledgerName"
          class="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3.5"
        >
          <!-- Vendor Header -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-base sm:text-lg font-black text-slate-900 leading-tight truncate">
                  {{ party.ledgerName }}
                </h3>
                <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider">
                  {{ party.groupName }}
                </span>
                <span v-if="party.city" class="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
                  📍 {{ party.city }}
                </span>
              </div>
              <p class="text-xs text-slate-400 font-semibold mt-0.5">
                {{ party.pendingBills.length }} Unsettled Purchases • Last Voucher: {{ party.lastTransactionDate }}
              </p>
            </div>

            <!-- Total Payable Badge -->
            <div class="text-left sm:text-right shrink-0">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Payable</span>
              <span class="text-lg sm:text-xl font-black text-slate-900 font-['Clash_Display']">
                {{ formatINR(party.totalPayable) }}
              </span>
            </div>
          </div>

          <!-- 5-Bucket Visual Bar -->
          <div class="space-y-1.5">
            <div class="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              <div v-if="party.b0_30 > 0" :style="{ width: (party.b0_30 / party.totalPayable * 100) + '%' }" class="bg-emerald-500 h-full" title="0-30 Days"></div>
              <div v-if="party.b31_60 > 0" :style="{ width: (party.b31_60 / party.totalPayable * 100) + '%' }" class="bg-amber-500 h-full" title="31-60 Days"></div>
              <div v-if="party.b61_90 > 0" :style="{ width: (party.b61_90 / party.totalPayable * 100) + '%' }" class="bg-orange-500 h-full" title="61-90 Days"></div>
              <div v-if="party.b90_180 > 0" :style="{ width: (party.b90_180 / party.totalPayable * 100) + '%' }" class="bg-rose-500 h-full" title="90-180 Days"></div>
              <div v-if="party.b180_plus > 0" :style="{ width: (party.b180_plus / party.totalPayable * 100) + '%' }" class="bg-purple-500 h-full" title="180+ Days"></div>
            </div>

            <!-- Bucket Breakdown Numbers -->
            <div class="flex items-center gap-2 overflow-x-auto no-scrollbar text-[11px] font-bold pt-1">
              <span v-if="party.b0_30 > 0" class="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60 whitespace-nowrap">
                0–30d: {{ formatINR(party.b0_30) }}
              </span>
              <span v-if="party.b31_60 > 0" class="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/60 whitespace-nowrap">
                31–60d: {{ formatINR(party.b31_60) }}
              </span>
              <span v-if="party.b61_90 > 0" class="px-2 py-0.5 rounded-lg bg-orange-50 text-orange-800 border border-orange-200/60 whitespace-nowrap">
                61–90d: {{ formatINR(party.b61_90) }}
              </span>
              <span v-if="party.b90_180 > 0" class="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200/60 whitespace-nowrap">
                90–180d: {{ formatINR(party.b90_180) }}
              </span>
              <span v-if="party.b180_plus > 0" class="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-200/60 whitespace-nowrap">
                180+d: {{ formatINR(party.b180_plus) }}
              </span>
            </div>
          </div>

          <!-- Bill-Wise Pending Invoices Collapsible -->
          <div class="pt-2 border-t border-slate-100">
            <button
              @click="togglePartyExpand(party.ledgerName)"
              class="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center justify-between w-full py-1 cursor-pointer"
            >
              <span class="flex items-center gap-1.5">
                <i :class="['fa-solid text-[10px] transition-transform', isExpanded(party.ledgerName) ? 'fa-chevron-up' : 'fa-chevron-down']"></i>
                {{ isExpanded(party.ledgerName) ? 'Hide' : 'View' }} Pending Purchase Invoices ({{ party.pendingBills.length }})
              </span>
              <span class="text-[11px] text-amber-700 font-bold hover:underline" @click.stop="handleWhatsAppShare(party)">
                <i class="fa-brands fa-whatsapp text-emerald-600 mr-1"></i>
                Share Statement
              </span>
            </button>

            <!-- Bills Table -->
            <div v-if="isExpanded(party.ledgerName)" class="mt-3 overflow-x-auto rounded-2xl border border-slate-200/70">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/60">
                  <tr>
                    <th class="p-2.5">Date</th>
                    <th class="p-2.5">Bill / Voucher</th>
                    <th class="p-2.5">Type</th>
                    <th class="p-2.5 text-right">Unpaid Amount</th>
                    <th class="p-2.5 text-center">Age</th>
                    <th class="p-2.5 text-right">Tenure</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 font-medium">
                  <tr v-for="(bill, bIdx) in party.pendingBills" :key="bIdx" class="hover:bg-slate-50/80">
                    <td class="p-2.5 text-slate-700 font-semibold">{{ bill.date }}</td>
                    <td class="p-2.5 text-slate-900 font-bold font-mono">{{ bill.voucherNo }}</td>
                    <td class="p-2.5 text-slate-500">{{ bill.type }}</td>
                    <td class="p-2.5 text-right font-black text-slate-900">{{ formatINR(bill.amount) }}</td>
                    <td class="p-2.5 text-center font-bold text-slate-600">{{ bill.daysOld }} days</td>
                    <td class="p-2.5 text-right">
                      <span
                        class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        :class="getTenureBadgeClass(bill.bucket)"
                      >
                        {{ bill.bucket }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ GROUP VIEW: BY BRAND / CATEGORY ═══ -->
      <div v-else-if="viewMode === 'Group View'" class="space-y-3">
        <div
          v-for="group in groupSummaries"
          :key="group.groupName"
          class="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3.5"
        >
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-black font-['Clash_Display'] text-slate-900 leading-none">
                {{ group.groupName }}
              </h3>
              <p class="text-xs text-slate-500 font-medium mt-1">
                {{ group.partyCount }} Suppliers Active
              </p>
            </div>
            <div class="text-right">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Group Total</span>
              <span class="text-xl font-black text-slate-900 font-['Clash_Display']">
                {{ formatINR(group.totalPayable) }}
              </span>
            </div>
          </div>

          <!-- Group Visual Bar -->
          <div class="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            <div v-if="group.b0_30 > 0" :style="{ width: (group.b0_30 / group.totalPayable * 100) + '%' }" class="bg-emerald-500 h-full"></div>
            <div v-if="group.b31_60 > 0" :style="{ width: (group.b31_60 / group.totalPayable * 100) + '%' }" class="bg-amber-500 h-full"></div>
            <div v-if="group.b61_90 > 0" :style="{ width: (group.b61_90 / group.totalPayable * 100) + '%' }" class="bg-orange-500 h-full"></div>
            <div v-if="group.b90_180 > 0" :style="{ width: (group.b90_180 / group.totalPayable * 100) + '%' }" class="bg-rose-500 h-full"></div>
            <div v-if="group.b180_plus > 0" :style="{ width: (group.b180_plus / group.totalPayable * 100) + '%' }" class="bg-purple-500 h-full"></div>
          </div>

          <!-- List of Suppliers in this group -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <div
              v-for="p in group.parties"
              :key="p.ledgerName"
              class="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between text-xs"
            >
              <span class="font-bold text-slate-800 truncate mr-2">{{ p.ledgerName }}</span>
              <span class="font-black text-slate-900 shrink-0">{{ formatINR(p.totalPayable) }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useCreditorData } from '@/composables/useCreditorData';

const {
  loading,
  error,
  loadLedgerData,
  viewMode,
  searchQuery,
  selectedGroups,
  activeAgingFilter,
  sortBy,
  groupList,
  filteredCreditors,
  groupSummaries,
  summaryStats,
  formatINR
} = useCreditorData();

onMounted(async () => {
  await loadLedgerData();
});

const expandedParties = ref(new Set());

const togglePartyExpand = (name) => {
  if (expandedParties.value.has(name)) {
    expandedParties.value.delete(name);
  } else {
    expandedParties.value.add(name);
  }
};

const isExpanded = (name) => expandedParties.value.has(name);

const getAgingFilterLabel = (key) => {
  const map = {
    '0_30': '0–30 Days (Current)',
    '31_60': '31–60 Days (Due)',
    '61_90': '61–90 Days (Aging)',
    '90_180': '90–180 Days (Overdue)',
    '180plus': '180+ Days (Critical)'
  };
  return map[key] || key;
};

const getTenureBadgeClass = (bucket) => {
  if (bucket.includes('0–30') || bucket.includes('0-30')) return 'bg-emerald-100 text-emerald-800';
  if (bucket.includes('31–60') || bucket.includes('31-60')) return 'bg-amber-100 text-amber-800';
  if (bucket.includes('61–90') || bucket.includes('61-90')) return 'bg-orange-100 text-orange-800';
  if (bucket.includes('90–180') || bucket.includes('90-180')) return 'bg-rose-100 text-rose-800';
  return 'bg-purple-100 text-purple-800';
};

const handleWhatsAppShare = (party) => {
  if (!party) return;
  
  let msg = `*STATEMENT OF ACCOUNT (PAYABLES)*\n`;
  msg += `*Sri Brundabana Enterprises, Rayagada*\n`;
  msg += `------------------------------------\n`;
  msg += `*Supplier:* ${party.ledgerName}\n`;
  msg += `*Group:* ${party.groupName}\n`;
  msg += `*Total Balance Payable:* Rs. ${Math.round(party.totalPayable).toLocaleString('en-IN')}\n\n`;

  msg += `*Aging Breakdown:*\n`;
  if (party.b0_30 > 0) msg += `• 0-30 Days: Rs. ${Math.round(party.b0_30).toLocaleString('en-IN')}\n`;
  if (party.b31_60 > 0) msg += `• 31-60 Days: Rs. ${Math.round(party.b31_60).toLocaleString('en-IN')}\n`;
  if (party.b61_90 > 0) msg += `• 61-90 Days: Rs. ${Math.round(party.b61_90).toLocaleString('en-IN')}\n`;
  if (party.b90_180 > 0) msg += `• 90-180 Days: Rs. ${Math.round(party.b90_180).toLocaleString('en-IN')}\n`;
  if (party.b180_plus > 0) msg += `• 180+ Days: Rs. ${Math.round(party.b180_plus).toLocaleString('en-IN')}\n`;

  if (party.pendingBills && party.pendingBills.length > 0) {
    msg += `\n*Recent Pending Invoices:*\n`;
    party.pendingBills.slice(0, 10).forEach((b, idx) => {
      msg += `${idx + 1}. Bill #${b.voucherNo} (${b.date}): Rs. ${Math.round(b.amount).toLocaleString('en-IN')} [${b.daysOld}d]\n`;
    });
  }

  msg += `\n_Generated from Sri Brundabana Enterprises SBE Hub_`;

  const encoded = encodeURIComponent(msg);
  window.open(`https://wa.me/?text=${encoded}`, '_blank');
};
</script>
