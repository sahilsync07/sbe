<template>
  <div class="min-h-screen bg-slate-50 relative pb-28 text-slate-800 antialiased selection:bg-violet-500 selection:text-white">
    <!-- Ambient Glow Orbs -->
    <div class="fixed top-0 left-0 w-96 h-96 bg-gradient-to-tr from-violet-200/30 to-indigo-400/20 rounded-full blur-[90px] -z-10 pointer-events-none mix-blend-multiply opacity-75"></div>
    <div class="fixed top-48 right-0 w-[450px] h-[450px] bg-gradient-to-bl from-rose-200/25 to-amber-300/20 rounded-full blur-[100px] -z-10 pointer-events-none mix-blend-multiply opacity-65"></div>

    <!-- ═══ TOP BAR (Sticky Safe Area) ═══ -->
    <header class="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 shadow-xs px-4 sm:px-6 py-3.5 transition-all">
      <div class="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <!-- Left: Back Button & Title -->
        <div class="flex items-center gap-3 min-w-0">
          <button
            type="button"
            @click="handleBack"
            class="w-10 h-10 rounded-2xl bg-slate-100/90 hover:bg-slate-200/90 active:scale-95 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all shadow-xs flex-shrink-0"
            title="Back to Hub"
          >
            <i class="fa-solid fa-arrow-left text-sm"></i>
          </button>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h1 class="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none truncate">
                Aging & Recovery
              </h1>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                :class="activeTab === 'Debtors' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'">
                {{ activeTab }}
              </span>
            </div>
            <p v-if="!loading && !error && summaryStats" class="text-[11px] text-slate-400 font-semibold truncate mt-0.5">
              {{ summaryStats.totalCount }} Accounts • Market Balance: {{ formatShortINR(summaryStats.totalOutstanding) }}
            </p>
            <p v-else class="text-[11px] text-slate-400 font-semibold truncate mt-0.5">
              Loading data…
            </p>
          </div>
        </div>

        <!-- Right: Sort & View Controls -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <!-- View Toggle: Party vs Group -->
          <div class="hidden sm:flex items-center p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60">
            <button
              v-for="mode in ['Party View', 'Group View']"
              :key="mode"
              @click="viewMode = mode"
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              :class="viewMode === mode ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'"
            >
              <i :class="['fa-solid mr-1', mode === 'Party View' ? 'fa-user' : 'fa-layer-group']"></i>
              {{ mode.split(' ')[0] }}
            </button>
          </div>

          <!-- Sort Button -->
          <div class="relative" ref="sortMenuRef">
            <button
              @click="showSortDropdown = !showSortDropdown"
              class="h-10 px-3 rounded-2xl bg-slate-100/90 hover:bg-slate-200/90 active:scale-95 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <i class="fa-solid fa-arrow-down-wide-short text-slate-500"></i>
              <span class="hidden md:inline">Sort</span>
            </button>

            <!-- Sort Dropdown -->
            <Transition name="fade-pop">
              <div
                v-if="showSortDropdown"
                class="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 overflow-hidden"
              >
                <div class="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Sort Accounts By
                </div>
                <button
                  v-for="opt in sortOptions"
                  :key="opt.key"
                  @click="sortBy = opt.key; showSortDropdown = false"
                  class="w-full text-left px-3.5 py-2 text-xs font-bold flex items-center justify-between hover:bg-slate-50 transition-colors"
                  :class="sortBy === opt.key ? 'text-violet-600 bg-violet-50/50' : 'text-slate-700'"
                >
                  <span class="flex items-center gap-2">
                    <i :class="[opt.icon, 'text-xs', sortBy === opt.key ? 'text-violet-600' : 'text-slate-400']"></i>
                    {{ opt.label }}
                  </span>
                  <i v-if="sortBy === opt.key" class="fa-solid fa-check text-violet-600 text-xs"></i>
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-3.5 sm:px-6 pt-4 space-y-4">
      <!-- ═══ LOADING & ERROR STATES ═══ -->
      <div v-if="loading" class="py-20 flex flex-col items-center justify-center space-y-4">
        <div class="w-12 h-12 rounded-full border-3 border-violet-200 border-t-violet-600 animate-spin"></div>
        <p class="text-sm font-bold text-slate-600">Calculating aging breakdown from ledger records…</p>
      </div>

      <div v-else-if="error" class="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-2">
        <i class="fa-solid fa-circle-exclamation text-rose-500 text-2xl"></i>
        <h3 class="text-base font-bold text-rose-900">Unable to load ledger data</h3>
        <p class="text-xs text-rose-700 max-w-md mx-auto">{{ error }}</p>
      </div>

      <template v-else>
      <!-- ═══ TABS (Debtors vs Creditors) ═══ -->
      <div class="flex items-center justify-between gap-3">
        <!-- Dual Tab Switcher -->
        <div class="flex p-1 bg-slate-200/70 rounded-2xl border border-slate-300/60 shadow-inner w-full sm:w-auto">
          <button
            @click="activeTab = 'Debtors'"
            class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all"
            :class="activeTab === 'Debtors' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
          >
            <i class="fa-solid fa-arrow-trend-down text-blue-600"></i>
            <span>Debtors (Receivables)</span>
          </button>
          <button
            @click="activeTab = 'Creditors'"
            class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all"
            :class="activeTab === 'Creditors' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
          >
            <i class="fa-solid fa-arrow-trend-up text-amber-600"></i>
            <span>Creditors (Payables)</span>
          </button>
        </div>

        <!-- Mobile View Toggle -->
        <div class="sm:hidden flex items-center p-1 bg-slate-200/70 rounded-2xl">
          <button
            v-for="mode in ['Party View', 'Group View']"
            :key="mode"
            @click="viewMode = mode"
            class="p-2 rounded-xl text-xs font-bold transition-all"
            :class="viewMode === mode ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'"
            :title="mode"
          >
            <i :class="['fa-solid', mode === 'Party View' ? 'fa-user' : 'fa-layer-group']"></i>
          </button>
        </div>
      </div>

      <!-- ═══ KPI SUMMARY DASHBOARD (4 AGING CARDS) ═══ -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <!-- 0-30 Days: Fresh / Current -->
        <div
          @click="activeAgingFilter = activeAgingFilter === 'current' ? 'all' : 'current'"
          class="bg-white/90 rounded-2xl p-3.5 sm:p-4 border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md active:scale-[0.99] relative overflow-hidden"
          :class="activeAgingFilter === 'current' ? 'border-emerald-500 ring-2 ring-emerald-400/20 bg-emerald-50/30' : 'border-slate-200/80 hover:border-emerald-300'"
        >
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[11px] font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              0–30 Days
            </span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {{ summaryStats.pct0_30.toFixed(0) }}%
            </span>
          </div>
          <div class="text-base sm:text-xl font-black text-slate-900 tracking-tight">
            {{ formatINR(summaryStats.b0_30) }}
          </div>
          <p class="text-[10px] text-slate-400 font-semibold mt-0.5">Fresh / Current Cycle</p>
        </div>

        <!-- 31-60 Days: Due -->
        <div
          @click="activeAgingFilter = activeAgingFilter === '30plus' ? 'all' : '30plus'"
          class="bg-white/90 rounded-2xl p-3.5 sm:p-4 border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md active:scale-[0.99] relative overflow-hidden"
          :class="activeAgingFilter === '30plus' ? 'border-amber-500 ring-2 ring-amber-400/20 bg-amber-50/30' : 'border-slate-200/80 hover:border-amber-300'"
        >
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[11px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-amber-500"></span>
              31–60 Days
            </span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {{ summaryStats.pct31_60.toFixed(0) }}%
            </span>
          </div>
          <div class="text-base sm:text-xl font-black text-slate-900 tracking-tight">
            {{ formatINR(summaryStats.b31_60) }}
          </div>
          <p class="text-[10px] text-slate-400 font-semibold mt-0.5">Payment Due / Follow-up</p>
        </div>

        <!-- 61-90 Days: Overdue -->
        <div
          @click="activeAgingFilter = activeAgingFilter === '60plus' ? 'all' : '60plus'"
          class="bg-white/90 rounded-2xl p-3.5 sm:p-4 border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md active:scale-[0.99] relative overflow-hidden"
          :class="activeAgingFilter === '60plus' ? 'border-orange-500 ring-2 ring-orange-400/20 bg-orange-50/30' : 'border-slate-200/80 hover:border-orange-300'"
        >
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[11px] font-black text-orange-800 uppercase tracking-wider flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-orange-500"></span>
              61–90 Days
            </span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
              {{ summaryStats.pct61_90.toFixed(0) }}%
            </span>
          </div>
          <div class="text-base sm:text-xl font-black text-slate-900 tracking-tight">
            {{ formatINR(summaryStats.b61_90) }}
          </div>
          <p class="text-[10px] text-slate-400 font-semibold mt-0.5">Overdue / Priority Call</p>
        </div>

        <!-- 90+ Days: Critical Alert -->
        <div
          @click="activeAgingFilter = activeAgingFilter === '90plus' ? 'all' : '90plus'"
          class="bg-white/90 rounded-2xl p-3.5 sm:p-4 border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md active:scale-[0.99] relative overflow-hidden"
          :class="activeAgingFilter === '90plus' ? 'border-rose-500 ring-2 ring-rose-400/20 bg-rose-50/40' : 'border-slate-200/80 hover:border-rose-300'"
        >
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[11px] font-black text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              90+ Days
            </span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
              {{ summaryStats.pct90_plus.toFixed(0) }}%
            </span>
          </div>
          <div class="text-base sm:text-xl font-black text-rose-900 tracking-tight">
            {{ formatINR(summaryStats.b90_plus) }}
          </div>
          <p class="text-[10px] text-rose-600 font-bold mt-0.5 flex items-center gap-1">
            <i class="fa-solid fa-triangle-exclamation"></i>
            {{ summaryStats.criticalCount }} High-Risk Accounts
          </p>
        </div>
      </div>

      <!-- ═══ SEARCH & SMART RISK FILTERS ═══ -->
      <div class="space-y-2.5">
        <!-- Search Input Bar -->
        <div class="relative flex items-center">
          <i class="fa-solid fa-magnifying-glass absolute left-4 text-slate-400 text-sm pointer-events-none"></i>
          <input
            v-model="searchQuery"
            type="search"
            autocomplete="off"
            :placeholder="`Search in ${filteredParties.length} ${activeTab.toLowerCase()} by party or city…`"
            class="w-full h-12 rounded-2xl bg-white border border-slate-200/90 pl-11 pr-10 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 shadow-xs transition-all"
          />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="absolute right-3 w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center text-xs"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Filter Pills Row -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
          <button
            @click="activeAgingFilter = 'all'"
            class="px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border"
            :class="activeAgingFilter === 'all' ? 'bg-slate-900 text-white border-slate-900 shadow-xs' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'"
          >
            All Accounts ({{ currentList.length }})
          </button>

          <button
            @click="activeAgingFilter = '90plus'"
            class="px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5"
            :class="activeAgingFilter === '90plus' ? 'bg-rose-600 text-white border-rose-600 shadow-xs' : 'bg-rose-50 text-rose-800 border-rose-200 hover:border-rose-300'"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-rose-500" :class="activeAgingFilter === '90plus' ? 'bg-white' : ''"></span>
            Critical 90+ Days ({{ summaryStats.criticalCount }})
          </button>

          <button
            @click="activeAgingFilter = '60plus'"
            class="px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5"
            :class="activeAgingFilter === '60plus' ? 'bg-orange-600 text-white border-orange-600 shadow-xs' : 'bg-orange-50 text-orange-800 border-orange-200 hover:border-orange-300'"
          >
            Overdue 60+ Days
          </button>

          <button
            @click="activeAgingFilter = 'current'"
            class="px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5"
            :class="activeAgingFilter === 'current' ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:border-emerald-300'"
          >
            Current (0-30d)
          </button>
        </div>
      </div>

      <!-- ═══ PARTY VIEW (Individual Accounts) ═══ -->
      <div v-if="viewMode === 'Party View'" class="space-y-3">
        <!-- Empty Results -->
        <div v-if="filteredParties.length === 0" class="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <div class="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 text-xl">
            <i class="fa-solid fa-magnifying-glass"></i>
          </div>
          <h3 class="text-base font-bold text-slate-800">No accounts match your criteria</h3>
          <p class="text-xs text-slate-400 max-w-sm mx-auto">Try clearing your search query or switching aging filters.</p>
          <button @click="searchQuery = ''; activeAgingFilter = 'all'" class="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">
            Reset Filters
          </button>
        </div>

        <!-- Party Card List -->
        <div
          v-for="party in filteredParties"
          :key="party.ledgerName"
          class="bg-white/95 rounded-2xl p-4 sm:p-5 border transition-all duration-200 shadow-xs hover:shadow-md space-y-3.5"
          :class="party.aging.b90_plus > 500 ? 'border-rose-200/90 ring-1 ring-rose-500/10' : 'border-slate-200/80'"
        >
          <!-- Card Header -->
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-sm sm:text-base font-black text-slate-900 leading-snug">
                  {{ party.ledgerName }}
                </h3>
                <!-- Critical 90+ Badge -->
                <span
                  v-if="party.aging.b90_plus > 100"
                  class="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
                >
                  <i class="fa-solid fa-triangle-exclamation text-[9px]"></i>
                  90+d Overdue
                </span>
              </div>
              <p class="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5 mt-0.5">
                <i class="fa-solid fa-location-dot text-[10px]"></i>
                {{ party.groupName }}
              </p>
            </div>

            <!-- Total Outstanding Amount -->
            <div class="text-right flex-shrink-0">
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Balance</span>
              <span class="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {{ formatINR(party.totalOutstanding) }}
              </span>
            </div>
          </div>

          <!-- Proportional Aging Color Bar -->
          <div class="space-y-1">
            <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              <div
                class="h-full bg-emerald-500 transition-all duration-500"
                :style="{ width: `${party.aging.pct0_30}%` }"
                :title="`0-30d: ${formatINR(party.aging.b0_30)}`"
              ></div>
              <div
                class="h-full bg-amber-400 transition-all duration-500"
                :style="{ width: `${party.aging.pct31_60}%` }"
                :title="`31-60d: ${formatINR(party.aging.b31_60)}`"
              ></div>
              <div
                class="h-full bg-orange-500 transition-all duration-500"
                :style="{ width: `${party.aging.pct61_90}%` }"
                :title="`61-90d: ${formatINR(party.aging.b61_90)}`"
              ></div>
              <div
                class="h-full bg-rose-500 transition-all duration-500"
                :style="{ width: `${party.aging.pct90_plus}%` }"
                :title="`90+d: ${formatINR(party.aging.b90_plus)}`"
              ></div>
            </div>
          </div>

          <!-- 4-Pill Aging Grid Matrix -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <!-- 0-30d -->
            <div class="p-2 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
              <span class="text-[10px] font-bold text-slate-400">0–30d</span>
              <span class="text-xs font-black text-emerald-700">{{ formatINR(party.aging.b0_30) }}</span>
            </div>
            <!-- 31-60d -->
            <div class="p-2 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
              <span class="text-[10px] font-bold text-slate-400">31–60d</span>
              <span class="text-xs font-black text-amber-700">{{ formatINR(party.aging.b31_60) }}</span>
            </div>
            <!-- 61-90d -->
            <div class="p-2 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
              <span class="text-[10px] font-bold text-slate-400">61–90d</span>
              <span class="text-xs font-black text-orange-700">{{ formatINR(party.aging.b61_90) }}</span>
            </div>
            <!-- 90+d -->
            <div class="p-2 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between"
              :class="party.aging.b90_plus > 0 ? 'bg-rose-50/80 border-rose-200' : ''">
              <span class="text-[10px] font-bold" :class="party.aging.b90_plus > 0 ? 'text-rose-600' : 'text-slate-400'">90+d</span>
              <span class="text-xs font-black" :class="party.aging.b90_plus > 0 ? 'text-rose-700' : 'text-slate-800'">
                {{ formatINR(party.aging.b90_plus) }}
              </span>
            </div>
          </div>

          <!-- Action Bar: WhatsApp Follow-up & Ledger Preview -->
          <div class="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <!-- Ledger Entries Dropdown Toggle -->
            <button
              @click="party.showHistory = !party.showHistory"
              class="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors"
            >
              <i class="fa-solid fa-receipt text-slate-400"></i>
              <span>{{ party.totalEntriesCount }} Recent Vouchers</span>
              <i class="fa-solid fa-chevron-down text-[10px] transition-transform duration-200" :class="{ 'rotate-180': party.showHistory }"></i>
            </button>

            <!-- WhatsApp 1-Tap Reminder -->
            <a
              :href="getWhatsAppFollowupLink(party)"
              target="_blank"
              class="px-3.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#128C7E] active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              title="Send WhatsApp Payment Follow-up"
            >
              <i class="fa-brands fa-whatsapp text-sm"></i>
              <span>Follow-up</span>
            </a>
          </div>

          <!-- Expandable Transaction History Drawer -->
          <div
            v-if="party.showHistory"
            class="mt-2.5 pt-2.5 border-t border-slate-100 bg-slate-50/70 rounded-xl p-3 space-y-2 text-xs animate-fade-in"
          >
            <div class="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider">
              <span>Date / Vch</span>
              <span>Type</span>
              <span class="text-right">Amount</span>
            </div>

            <div v-for="(entry, eIdx) in party.entries" :key="eIdx" class="flex items-center justify-between py-1 border-b border-slate-200/40 last:border-0 font-medium">
              <span class="font-mono text-slate-600 text-[11px]">{{ entry.date }} ({{ entry.voucherNo }})</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-bold"
                :class="entry.drCr === 'Dr' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'">
                {{ entry.type || entry.drCr }}
              </span>
              <span class="font-mono font-bold text-slate-900">{{ formatINR(entry.amount) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ GROUP / AREA VIEW ═══ -->
      <div v-else class="space-y-3">
        <div
          v-for="group in groupedViewData"
          :key="group.groupName"
          class="bg-white/95 rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3"
        >
          <!-- Group Header -->
          <div
            class="flex items-start justify-between gap-3 cursor-pointer select-none"
            @click="group.isExpanded = !group.isExpanded"
          >
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <h3 class="text-sm sm:text-base font-black text-slate-900 leading-tight">
                  {{ group.groupName }}
                </h3>
                <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                  {{ group.parties.length }} Accounts
                </span>
              </div>
              <p class="text-[11px] text-slate-400 font-semibold mt-0.5">
                Area Outstanding Total
              </p>
            </div>

            <div class="text-right flex items-center gap-3">
              <div>
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Balance</span>
                <span class="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  {{ formatINR(group.totalOutstanding) }}
                </span>
              </div>
              <button class="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all">
                <i class="fa-solid fa-chevron-down text-xs transition-transform duration-200" :class="{ 'rotate-180': group.isExpanded }"></i>
              </button>
            </div>
          </div>

          <!-- Group Proportional Aging Bar -->
          <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            <div class="h-full bg-emerald-500" :style="{ width: `${group.pct0_30}%` }"></div>
            <div class="h-full bg-amber-400" :style="{ width: `${group.pct31_60}%` }"></div>
            <div class="h-full bg-orange-500" :style="{ width: `${group.pct61_90}%` }"></div>
            <div class="h-full bg-rose-500" :style="{ width: `${group.pct90_plus}%` }"></div>
          </div>

          <!-- Group Aging Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div class="p-2 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs">
              <span class="text-slate-400 font-bold text-[10px]">0–30d</span>
              <span class="font-black text-emerald-700">{{ formatINR(group.b0_30) }}</span>
            </div>
            <div class="p-2 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs">
              <span class="text-slate-400 font-bold text-[10px]">31–60d</span>
              <span class="font-black text-amber-700">{{ formatINR(group.b31_60) }}</span>
            </div>
            <div class="p-2 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs">
              <span class="text-slate-400 font-bold text-[10px]">61–90d</span>
              <span class="font-black text-orange-700">{{ formatINR(group.b61_90) }}</span>
            </div>
            <div class="p-2 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs"
              :class="group.b90_plus > 0 ? 'bg-rose-50 border-rose-200' : ''">
              <span class="text-[10px] font-bold" :class="group.b90_plus > 0 ? 'text-rose-600' : 'text-slate-400'">90+d</span>
              <span class="font-black" :class="group.b90_plus > 0 ? 'text-rose-700' : 'text-slate-900'">{{ formatINR(group.b90_plus) }}</span>
            </div>
          </div>

          <!-- Group Parties List (When Expanded) -->
          <div v-if="group.isExpanded" class="pt-3 border-t border-slate-100 space-y-2 animate-fade-in">
            <div
              v-for="party in group.parties"
              :key="party.ledgerName"
              class="p-3 bg-slate-50/80 rounded-xl flex items-center justify-between gap-2 text-xs"
            >
              <div class="min-w-0 flex-1">
                <span class="font-bold text-slate-800 block truncate">{{ party.ledgerName }}</span>
                <span class="text-[10px] text-slate-400 font-semibold">
                  90+d: <b :class="party.aging.b90_plus > 0 ? 'text-rose-600' : 'text-slate-500'">{{ formatINR(party.aging.b90_plus) }}</b>
                </span>
              </div>
              <div class="flex items-center gap-3">
                <span class="font-black text-slate-900 font-mono">{{ formatINR(party.totalOutstanding) }}</span>
                <a
                  :href="getWhatsAppFollowupLink(party)"
                  target="_blank"
                  class="w-7 h-7 rounded-lg bg-[#25D366] text-white flex items-center justify-center hover:bg-[#128C7E]"
                  title="WhatsApp"
                >
                  <i class="fa-brands fa-whatsapp text-xs"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      </template>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useAnalyzerData } from '@/composables/useAnalyzerData';

const router = useRouter();

const {
  loading,
  error,
  loadLedgerData,
  activeTab,
  viewMode,
  searchQuery,
  activeAgingFilter,
  sortBy,
  summaryStats,
  filteredParties,
  groupedViewData,
  currentList,
  formatINR,
  formatShortINR,
  getWhatsAppFollowupLink
} = useAnalyzerData();

const showSortDropdown = ref(false);
const sortMenuRef = ref(null);

const sortOptions = [
  { key: 'overdue_desc', label: 'Highest 90+ Overdue', icon: 'fa-solid fa-triangle-exclamation' },
  { key: 'balance_desc', label: 'Highest Total Balance', icon: 'fa-solid fa-arrow-down-wide-short' },
  { key: 'balance_asc', label: 'Lowest Total Balance', icon: 'fa-solid fa-arrow-up-short-wide' },
  { key: 'name_asc', label: 'Party Name (A to Z)', icon: 'fa-solid fa-arrow-down-a-z' },
  { key: 'name_desc', label: 'Party Name (Z to A)', icon: 'fa-solid fa-arrow-up-z-a' },
];

const handleBack = () => {
  router.push('/');
};

// Close dropdown on outside click
const handleClickOutside = (e) => {
  if (sortMenuRef.value && !sortMenuRef.value.contains(e.target)) {
    showSortDropdown.value = false;
  }
};

onMounted(async () => {
  window.addEventListener('click', handleClickOutside);
  await loadLedgerData();
});

onBeforeUnmount(() => {
  window.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

@keyframes fadePop {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(-4px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.fade-pop-enter-active {
  animation: fadePop 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-pop-leave-active {
  animation: fadePop 0.1s cubic-bezier(0.16, 1, 0.3, 1) reverse;
}
</style>