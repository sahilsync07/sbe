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
      <!-- ═══ EXECUTIVE SPOTLIGHT DASHBOARD: OVERDUE (90d+) & DUE (31-90d) ═══ -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <!-- 🚨 Overdue 90+ Days (Critical / Urgent Action) -->
        <div
          @click="activeAgingFilter = activeAgingFilter === 'overdue_90plus' ? 'all' : 'overdue_90plus'"
          class="bg-gradient-to-br from-rose-500 to-rose-700 text-white rounded-3xl p-4 sm:p-5 shadow-lg shadow-rose-500/20 cursor-pointer transition-all duration-200 active:scale-[0.99] relative overflow-hidden group"
          :class="activeAgingFilter === 'overdue_90plus' ? 'ring-4 ring-rose-300' : 'hover:shadow-xl'"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-[10px] font-black uppercase tracking-widest bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <i class="fa-solid fa-triangle-exclamation text-xs"></i>
              Overdue (>90 Days)
            </span>
            <span class="text-xs font-black bg-white/20 px-2 py-0.5 rounded-full">
              {{ summaryStats.pctOverdue90Plus.toFixed(0) }}%
            </span>
          </div>
          <div class="text-2xl sm:text-3xl font-black font-['Clash_Display'] tracking-tight">
            {{ formatINR(summaryStats.overdue90PlusAmount) }}
          </div>
          <div class="flex items-center justify-between mt-2 pt-2 border-t border-white/15 text-xs text-rose-100 font-bold">
            <span>{{ summaryStats.countOverdue90Plus }} Vendors Urgent</span>
            <span class="text-[11px] underline opacity-90 group-hover:opacity-100">
              {{ activeAgingFilter === 'overdue_90plus' ? 'Showing Overdue ✕' : 'Tap to View ➔' }}
            </span>
          </div>
        </div>

        <!-- ⚠️ Due 31–90 Days (Upcoming Due Clearance) -->
        <div
          @click="activeAgingFilter = activeAgingFilter === 'due_31_90' ? 'all' : 'due_31_90'"
          class="bg-gradient-to-br from-amber-500 to-amber-700 text-white rounded-3xl p-4 sm:p-5 shadow-lg shadow-amber-500/20 cursor-pointer transition-all duration-200 active:scale-[0.99] relative overflow-hidden group"
          :class="activeAgingFilter === 'due_31_90' ? 'ring-4 ring-amber-300' : 'hover:shadow-xl'"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-[10px] font-black uppercase tracking-widest bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <i class="fa-solid fa-clock text-xs"></i>
              Due (31–90 Days)
            </span>
            <span class="text-xs font-black bg-white/20 px-2 py-0.5 rounded-full">
              {{ summaryStats.pctDue31_90.toFixed(0) }}%
            </span>
          </div>
          <div class="text-2xl sm:text-3xl font-black font-['Clash_Display'] tracking-tight">
            {{ formatINR(summaryStats.due31_90Amount) }}
          </div>
          <div class="flex items-center justify-between mt-2 pt-2 border-t border-white/15 text-xs text-amber-100 font-bold">
            <span>{{ summaryStats.countDue31_90 }} Vendors Due</span>
            <span class="text-[11px] underline opacity-90 group-hover:opacity-100">
              {{ activeAgingFilter === 'due_31_90' ? 'Showing Due ✕' : 'Tap to View ➔' }}
            </span>
          </div>
        </div>

        <!-- 🟢 Current 0–30 Days (Within Normal Terms) -->
        <div
          @click="activeAgingFilter = activeAgingFilter === '0_30' ? 'all' : '0_30'"
          class="bg-gradient-to-br from-emerald-600 to-teal-800 text-white rounded-3xl p-4 sm:p-5 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all duration-200 active:scale-[0.99] relative overflow-hidden group"
          :class="activeAgingFilter === '0_30' ? 'ring-4 ring-emerald-300' : 'hover:shadow-xl'"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-[10px] font-black uppercase tracking-widest bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <i class="fa-solid fa-circle-check text-xs"></i>
              Current (0–30 Days)
            </span>
            <span class="text-xs font-black bg-white/20 px-2 py-0.5 rounded-full">
              {{ summaryStats.pct0_30.toFixed(0) }}%
            </span>
          </div>
          <div class="text-2xl sm:text-3xl font-black font-['Clash_Display'] tracking-tight">
            {{ formatINR(summaryStats.b0_30) }}
          </div>
          <div class="flex items-center justify-between mt-2 pt-2 border-t border-white/15 text-xs text-emerald-100 font-bold">
            <span>{{ summaryStats.count0_30 }} Vendors Prompt</span>
            <span class="text-[11px] underline opacity-90 group-hover:opacity-100">
              {{ activeAgingFilter === '0_30' ? 'Showing Current ✕' : 'Tap to View ➔' }}
            </span>
          </div>
        </div>
      </div>

      <!-- ═══ 5 AGING BREAKDOWN MINI KPI CHIPS ═══ -->
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <button
          @click="activeAgingFilter = activeAgingFilter === '0_30' ? 'all' : '0_30'"
          class="p-2.5 rounded-2xl bg-white border text-left transition-all cursor-pointer shadow-xs"
          :class="activeAgingFilter === '0_30' ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-400/20' : 'border-slate-200 hover:border-emerald-300'"
        >
          <div class="text-[9px] font-black text-emerald-800 uppercase">0–30 Days</div>
          <div class="text-xs sm:text-sm font-black text-slate-900">{{ formatINR(summaryStats.b0_30) }}</div>
          <div class="text-[9px] text-slate-400 font-semibold">{{ summaryStats.count0_30 }} vendors</div>
        </button>

        <button
          @click="activeAgingFilter = activeAgingFilter === '31_60' ? 'all' : '31_60'"
          class="p-2.5 rounded-2xl bg-white border text-left transition-all cursor-pointer shadow-xs"
          :class="activeAgingFilter === '31_60' ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-400/20' : 'border-slate-200 hover:border-amber-300'"
        >
          <div class="text-[9px] font-black text-amber-800 uppercase">31–60 Days</div>
          <div class="text-xs sm:text-sm font-black text-slate-900">{{ formatINR(summaryStats.b31_60) }}</div>
          <div class="text-[9px] text-slate-400 font-semibold">{{ summaryStats.count31_60 }} vendors</div>
        </button>

        <button
          @click="activeAgingFilter = activeAgingFilter === '61_90' ? 'all' : '61_90'"
          class="p-2.5 rounded-2xl bg-white border text-left transition-all cursor-pointer shadow-xs"
          :class="activeAgingFilter === '61_90' ? 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-400/20' : 'border-slate-200 hover:border-orange-300'"
        >
          <div class="text-[9px] font-black text-orange-800 uppercase">61–90 Days</div>
          <div class="text-xs sm:text-sm font-black text-slate-900">{{ formatINR(summaryStats.b61_90) }}</div>
          <div class="text-[9px] text-slate-400 font-semibold">{{ summaryStats.count61_90 }} vendors</div>
        </button>

        <button
          @click="activeAgingFilter = activeAgingFilter === '90_180' ? 'all' : '90_180'"
          class="p-2.5 rounded-2xl bg-white border text-left transition-all cursor-pointer shadow-xs"
          :class="activeAgingFilter === '90_180' ? 'border-rose-500 bg-rose-50/50 ring-2 ring-rose-400/20' : 'border-slate-200 hover:border-rose-300'"
        >
          <div class="text-[9px] font-black text-rose-800 uppercase">90–180 Days</div>
          <div class="text-xs sm:text-sm font-black text-slate-900">{{ formatINR(summaryStats.b90_180) }}</div>
          <div class="text-[9px] text-slate-400 font-semibold">{{ summaryStats.count90_180 }} vendors</div>
        </button>

        <button
          @click="activeAgingFilter = activeAgingFilter === '180plus' ? 'all' : '180plus'"
          class="p-2.5 rounded-2xl bg-white border text-left transition-all cursor-pointer shadow-xs col-span-2 sm:col-span-1"
          :class="activeAgingFilter === '180plus' ? 'border-purple-500 bg-purple-50/50 ring-2 ring-purple-400/20' : 'border-slate-200 hover:border-purple-300'"
        >
          <div class="text-[9px] font-black text-purple-800 uppercase">180+ Days</div>
          <div class="text-xs sm:text-sm font-black text-slate-900">{{ formatINR(summaryStats.b180_plus) }}</div>
          <div class="text-[9px] text-slate-400 font-semibold">{{ summaryStats.count180_plus }} vendors</div>
        </button>
      </div>

      <!-- ═══ TOTAL PAYABLES & CONTROLS HEADER ═══ -->
      <div class="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-3xl p-4 sm:p-5 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800">
        <div>
          <span class="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
            Total Outstanding Payables
          </span>
          <div class="text-2xl sm:text-3xl font-black font-['Clash_Display'] mt-1.5">
            {{ formatINR(summaryStats.totalPayable) }}
          </div>
          <p class="text-xs text-slate-400 mt-1">
            {{ summaryStats.vendorCount }} Suppliers Across {{ groupList.length }} Groups (Paragon & Sundry Creditors)
          </p>
        </div>

        <!-- View Mode Switcher -->
        <div class="flex items-center gap-1.5 bg-white/10 p-1.5 rounded-2xl backdrop-blur-md border border-white/10 shrink-0">
          <button
            @click="viewMode = 'Party View'"
            class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            :class="viewMode === 'Party View' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-300 hover:text-white'"
          >
            <i class="fa-solid fa-user-tie mr-1.5"></i>
            Party View ({{ filteredCreditors.length }})
          </button>
          <button
            @click="viewMode = 'Group View'"
            class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            :class="viewMode === 'Group View' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-300 hover:text-white'"
          >
            <i class="fa-solid fa-layer-group mr-1.5"></i>
            Group View ({{ groupSummaries.length }})
          </button>
        </div>
      </div>

      <!-- ═══ SEARCH & SORT CONTROLS ═══ -->
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
              class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
            >
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Sort Select -->
          <div class="flex items-center gap-2">
            <select
              v-model="sortBy"
              class="w-full sm:w-auto px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="overdue_desc">Sort: 🚨 Overdue & Priority First</option>
              <option value="payable_desc">Sort: 💰 Highest Balance</option>
              <option value="name_asc">Sort: 🔤 Name (A to Z)</option>
              <option value="name_desc">Sort: 🔤 Name (Z to A)</option>
            </select>
          </div>
        </div>

        <!-- Active Aging Filter Bar -->
        <div v-if="activeAgingFilter !== 'all'" class="flex items-center justify-between text-xs bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-2xl text-amber-900">
          <div class="flex items-center gap-2 font-bold">
            <i class="fa-solid fa-filter text-amber-600"></i>
            <span>Filtering by {{ getAgingFilterLabel(activeAgingFilter) }} ({{ filteredCreditors.length }} Vendors)</span>
          </div>
          <button @click="activeAgingFilter = 'all'" class="text-amber-700 font-black hover:underline cursor-pointer">
            Show All
          </button>
        </div>
      </div>

      <!-- ═══ PARTY VIEW: INDIVIDUAL CREDITORS (MOBILE & DESKTOP OPTIMIZED) ═══ -->
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
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
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
                {{ party.pendingBills.length }} Purchases Pending • Last: {{ party.lastTransactionDate }}
              </p>
            </div>

            <!-- Priority Badge & Total Payable Balance -->
            <div class="flex items-center justify-between sm:justify-end gap-3 shrink-0">
              <!-- Urgent Status Pill -->
              <span
                class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                :class="getDominantRiskBadgeClass(party)"
              >
                {{ getDominantRiskLabel(party) }}
              </span>

              <div class="text-right">
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Payable</span>
                <span class="text-base sm:text-xl font-black text-slate-900 font-['Clash_Display']">
                  {{ formatINR(party.totalPayable) }}
                </span>
              </div>
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
            <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[10px] sm:text-[11px] font-bold pt-1">
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

          <!-- Bottom Actions: Bill-Wise Collapsible + WhatsApp + PDF (Mobile Optimized) -->
          <div class="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
            <button
              @click="togglePartyExpand(party.ledgerName)"
              class="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer select-none py-1"
            >
              <i :class="['fa-solid text-[10px] transition-transform', isExpanded(party.ledgerName) ? 'fa-chevron-up' : 'fa-chevron-down']"></i>
              <span>{{ isExpanded(party.ledgerName) ? 'Hide' : 'View' }} Invoices ({{ party.pendingBills.length }})</span>
            </button>

            <div class="flex items-center gap-2">
              <!-- View / Download PDF Statement -->
              <button
                @click="downloadPartyPDF(party)"
                class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Download 6-Month Ledger PDF"
              >
                <i class="fa-solid fa-file-pdf text-rose-600 text-xs"></i>
                <span>PDF</span>
              </button>

              <!-- WhatsApp Statement + Auto-Copy Text + PDF Share -->
              <button
                @click="sendWhatsAppStatementWithPDF(party)"
                class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                title="Share Statement via WhatsApp with PDF"
              >
                <i class="fa-brands fa-whatsapp text-sm"></i>
                <span>Share WhatsApp</span>
              </button>
            </div>
          </div>

          <!-- Bills Table (Mobile Optimized with Horizontal Scroll) -->
          <div v-if="isExpanded(party.ledgerName)" class="mt-3 overflow-x-auto rounded-2xl border border-slate-200/70">
            <table class="w-full text-left text-xs min-w-[500px]">
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
                  <td class="p-2.5 text-slate-700 font-semibold whitespace-nowrap">{{ bill.date }}</td>
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

      <!-- ═══ GROUP VIEW: BY BRAND / CATEGORY ═══ -->
      <div v-else-if="viewMode === 'Group View'" class="space-y-3">
        <div
          v-for="group in groupSummaries"
          :key="group.groupName"
          class="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3.5"
        >
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-base sm:text-lg font-black font-['Clash_Display'] text-slate-900 leading-none">
                {{ group.groupName }}
              </h3>
              <p class="text-xs text-slate-500 font-medium mt-1">
                {{ group.partyCount }} Suppliers Active
              </p>
            </div>
            <div class="text-right">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Group Total</span>
              <span class="text-lg sm:text-xl font-black text-slate-900 font-['Clash_Display']">
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
import { generateLedgerPDF } from '@/utils/pdfLedgerGenerator';
import { toast } from 'vue3-toastify';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

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
  formatINR,
  getWhatsAppFollowupText
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
    'overdue_90plus': '🚨 Overdue (90+ Days)',
    'due_31_90': '⚠️ Due (31–90 Days)',
    '0_30': '0–30 Days (Current)',
    '31_60': '31–60 Days (Due)',
    '61_90': '61–90 Days (Aging)',
    '90_180': '90–180 Days (Overdue)',
    '180plus': '180+ Days (Critical)'
  };
  return map[key] || key;
};

const getDominantRiskLabel = (party) => {
  if (party.b180_plus > 0) return '🚨 Critical (>180d)';
  if (party.b90_180 > 0) return '🔴 Overdue (90-180d)';
  if (party.b61_90 > 0) return '🟠 Aging (61-90d)';
  if (party.b31_60 > 0) return '🟡 Due (31-60d)';
  return '🟢 Current (0-30d)';
};

const getDominantRiskBadgeClass = (party) => {
  if (party.b180_plus > 0) return 'bg-purple-100 text-purple-800 border border-purple-200';
  if (party.b90_180 > 0) return 'bg-rose-100 text-rose-800 border border-rose-200';
  if (party.b61_90 > 0) return 'bg-orange-100 text-orange-800 border border-orange-200';
  if (party.b31_60 > 0) return 'bg-amber-100 text-amber-800 border border-amber-200';
  return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
};

const getTenureBadgeClass = (bucket) => {
  if (bucket.includes('0–30') || bucket.includes('0-30')) return 'bg-emerald-100 text-emerald-800';
  if (bucket.includes('31–60') || bucket.includes('31-60')) return 'bg-amber-100 text-amber-800';
  if (bucket.includes('61–90') || bucket.includes('61-90')) return 'bg-orange-100 text-orange-800';
  if (bucket.includes('90–180') || bucket.includes('90-180')) return 'bg-rose-100 text-rose-800';
  return 'bg-purple-100 text-purple-800';
};

const buildLedgerPayload = (party) => {
  const raw = party.rawLedger || party;
  return {
    ledgerName: party.ledgerName,
    groupName: party.groupName || raw.groupName,
    openingBalance: raw.openingBalance || 0,
    closingBalance: party.closingBalance !== undefined ? party.closingBalance : (raw.closingBalance || 0),
    entries: raw.entries || party.entries || []
  };
};

const downloadPartyPDF = (party) => {
  if (!party) return;
  try {
    const payload = buildLedgerPayload(party);
    generateLedgerPDF(payload, { monthsLimit: 6 });
    toast.success(`Generated 6-month statement for ${party.ledgerName}`, { autoClose: 2000 });
  } catch (err) {
    console.error('PDF error:', err);
    toast.error('Failed to generate PDF', { autoClose: 3000 });
  }
};

const sendWhatsAppStatementWithPDF = async (party) => {
  if (!party) return;

  const text = getWhatsAppFollowupText(party);

  // 1. Automatically copy short, elegant summary text to clipboard
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    }
  } catch (e) {
    console.warn('Clipboard write failed:', e);
  }

  // 2. Prepare Ledger Payload & Generate Detailed PDF
  const payload = buildLedgerPayload(party);

  try {
    if (Capacitor.isNativePlatform() || Capacitor.getPlatform() === 'android') {
      const pdfDataUri = generateLedgerPDF(payload, {
        monthsLimit: 6,
        returnBase64: true
      });

      const base64Data = pdfDataUri.includes(',') ? pdfDataUri.split(',')[1] : pdfDataUri;
      const fileName = `Statement_${party.ledgerName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;

      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache
      });

      await Share.share({
        title: `Ledger Statement - ${party.ledgerName}`,
        files: [savedFile.uri]
      });

      toast.success('PDF attached & message copied! Paste into WhatsApp.', { autoClose: 3000 });
    } else {
      generateLedgerPDF(payload, { monthsLimit: 6 });
      window.open('https://wa.me/', '_blank');
      toast.success('PDF downloaded & message copied to clipboard!', { autoClose: 3000 });
    }
  } catch (err) {
    console.error('WhatsApp follow-up error:', err);
    toast.error('Could not share PDF. Please try downloading directly.', { autoClose: 3000 });
  }
};
</script>
