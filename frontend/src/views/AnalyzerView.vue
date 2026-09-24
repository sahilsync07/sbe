<template>
  <div class="min-h-screen bg-slate-50 relative pb-28 text-slate-800 antialiased selection:bg-teal-500 selection:text-white">
    <!-- Ambient Background Glow -->
    <div class="fixed top-0 left-0 w-full h-full pointer-events-none -z-10" style="background: radial-gradient(circle at 85% 10%, rgba(20, 184, 166, 0.12) 0%, transparent 50%), radial-gradient(circle at 10% 80%, rgba(139, 92, 246, 0.10) 0%, transparent 50%), #f8fafc;"></div>

    <!-- ═══ TOP BAR (Sticky Safe Area) ═══ -->
    <header class="az-topbar sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-xs px-4 sm:px-6 transition-all" style="padding-top: max(env(safe-area-inset-top, 32px), 24px); padding-bottom: 12px;">
      <div class="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <!-- Left: Back Button & Title -->
        <div class="flex items-center gap-3 min-w-0">
          <button
            type="button"
            @click="handleBack"
            class="w-10 h-10 rounded-2xl bg-slate-100/90 hover:bg-slate-200/90 active:scale-95 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all shadow-xs flex-shrink-0 cursor-pointer"
            title="Back to Home"
          >
            <i class="fa-solid fa-arrow-left text-sm"></i>
          </button>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h1 class="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none truncate">
                Line Debtors Analyzer
              </h1>
              <VersionBadge />
            </div>
            <p class="text-[11px] text-slate-400 font-semibold truncate mt-0.5">
              {{ filteredParties.length }} Parties • {{ groupList.length }} Lines Active
            </p>
          </div>
        </div>

        <!-- Right: View Mode Toggle & Sort -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <!-- View Switcher (Party vs Group) -->
          <div class="hidden sm:flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200/60">
            <button
              v-for="mode in ['Party View', 'Group View']"
              :key="mode"
              @click="viewMode = mode"
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              :class="viewMode === mode ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'"
            >
              {{ mode }}
            </button>
          </div>

          <!-- Sort Button -->
          <div class="relative">
            <button
              @click="showSortDropdown = !showSortDropdown"
              class="h-10 px-3 rounded-2xl bg-white border border-slate-200/80 hover:bg-slate-50 active:scale-95 text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
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
                  class="w-full text-left px-3.5 py-2 text-xs font-bold flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                  :class="sortBy === opt.key ? 'text-teal-600 bg-teal-50/50' : 'text-slate-700'"
                >
                  <span class="flex items-center gap-2">
                    <i :class="[opt.icon, 'text-xs', sortBy === opt.key ? 'text-teal-600' : 'text-slate-400']"></i>
                    {{ opt.label }}
                  </span>
                  <i v-if="sortBy === opt.key" class="fa-solid fa-check text-teal-600 text-xs"></i>
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
        <div class="w-12 h-12 rounded-full border-3 border-teal-200 border-t-teal-600 animate-spin"></div>
        <p class="text-sm font-bold text-slate-600">Calculating Line Debtors aging breakdown…</p>
      </div>

      <div v-else-if="error" class="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-2">
        <i class="fa-solid fa-circle-exclamation text-rose-500 text-2xl"></i>
        <h3 class="text-base font-bold text-rose-900">Unable to load ledger data</h3>
        <p class="text-xs text-rose-700 max-w-md mx-auto">{{ error }}</p>
      </div>

      <template v-else>
      <!-- Mobile View Mode Toggle -->
      <div class="sm:hidden flex items-center justify-between p-1 bg-slate-200/70 rounded-2xl">
        <button
          v-for="mode in ['Party View', 'Group View']"
          :key="mode"
          @click="viewMode = mode"
          class="flex-1 py-2 rounded-xl text-xs font-bold transition-all text-center"
          :class="viewMode === mode ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'"
        >
          <i :class="['fa-solid mr-1', mode === 'Party View' ? 'fa-user' : 'fa-layer-group']"></i>
          {{ mode }}
        </button>
      </div>

      <!-- ═══ 5 KPI SUMMARY DASHBOARD (0-30, 31-60, 61-90, 90-180, 180+ DAYS) ═══ -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        <!-- 0-30 Days: Fresh / Current -->
        <div
          @click="activeAgingFilter = activeAgingFilter === '0_30' ? 'all' : '0_30'"
          class="bg-white/90 rounded-2xl p-3 sm:p-3.5 border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md active:scale-[0.99] relative overflow-hidden"
          :class="activeAgingFilter === '0_30' ? 'border-emerald-500 ring-2 ring-emerald-400/20 bg-emerald-50/40' : 'border-slate-200/80 hover:border-emerald-300'"
        >
          <div class="flex items-center justify-between mb-1">
            <span class="text-[10px] font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              0–30 Days
            </span>
            <span class="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
              {{ summaryStats.pct0_30.toFixed(0) }}%
            </span>
          </div>
          <div class="text-sm sm:text-base font-black text-slate-900 tracking-tight">
            {{ formatINR(summaryStats.b0_30) }}
          </div>
          <p class="text-[10px] text-slate-400 font-semibold mt-0.5">{{ summaryStats.count0_30 }} Prompt Parties</p>
        </div>

        <!-- 31-60 Days: Due -->
        <div
          @click="activeAgingFilter = activeAgingFilter === '31_60' ? 'all' : '31_60'"
          class="bg-white/90 rounded-2xl p-3 sm:p-3.5 border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md active:scale-[0.99] relative overflow-hidden"
          :class="activeAgingFilter === '31_60' ? 'border-amber-500 ring-2 ring-amber-400/20 bg-amber-50/40' : 'border-slate-200/80 hover:border-amber-300'"
        >
          <div class="flex items-center justify-between mb-1">
            <span class="text-[10px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-amber-500"></span>
              31–60 Days
            </span>
            <span class="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800">
              {{ summaryStats.pct31_60.toFixed(0) }}%
            </span>
          </div>
          <div class="text-sm sm:text-base font-black text-slate-900 tracking-tight">
            {{ formatINR(summaryStats.b31_60) }}
          </div>
          <p class="text-[10px] text-slate-400 font-semibold mt-0.5">{{ summaryStats.count31_60 }} Due Parties</p>
        </div>

        <!-- 61-90 Days: Overdue -->
        <div
          @click="activeAgingFilter = activeAgingFilter === '61_90' ? 'all' : '61_90'"
          class="bg-white/90 rounded-2xl p-3 sm:p-3.5 border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md active:scale-[0.99] relative overflow-hidden"
          :class="activeAgingFilter === '61_90' ? 'border-orange-500 ring-2 ring-orange-400/20 bg-orange-50/40' : 'border-slate-200/80 hover:border-orange-300'"
        >
          <div class="flex items-center justify-between mb-1">
            <span class="text-[10px] font-black text-orange-800 uppercase tracking-wider flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-orange-500"></span>
              61–90 Days
            </span>
            <span class="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-orange-100 text-orange-800">
              {{ summaryStats.pct61_90.toFixed(0) }}%
            </span>
          </div>
          <div class="text-sm sm:text-base font-black text-slate-900 tracking-tight">
            {{ formatINR(summaryStats.b61_90) }}
          </div>
          <p class="text-[10px] text-slate-400 font-semibold mt-0.5">{{ summaryStats.count61_90 }} Overdue Parties</p>
        </div>

        <!-- 90-180 Days: High Risk -->
        <div
          @click="activeAgingFilter = activeAgingFilter === '90_180' ? 'all' : '90_180'"
          class="bg-white/90 rounded-2xl p-3 sm:p-3.5 border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md active:scale-[0.99] relative overflow-hidden"
          :class="activeAgingFilter === '90_180' ? 'border-rose-500 ring-2 ring-rose-400/20 bg-rose-50/40' : 'border-slate-200/80 hover:border-rose-300'"
        >
          <div class="flex items-center justify-between mb-1">
            <span class="text-[10px] font-black text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-rose-500"></span>
              90–180 Days
            </span>
            <span class="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800">
              {{ summaryStats.pct90_180.toFixed(0) }}%
            </span>
          </div>
          <div class="text-sm sm:text-base font-black text-rose-900 tracking-tight">
            {{ formatINR(summaryStats.b90_180) }}
          </div>
          <p class="text-[10px] text-rose-600 font-bold mt-0.5">{{ summaryStats.count90_180 }} High-Risk Parties</p>
        </div>

        <!-- 180+ Days: Critical -->
        <div
          @click="activeAgingFilter = activeAgingFilter === '180plus' ? 'all' : '180plus'"
          class="bg-white/90 rounded-2xl p-3 sm:p-3.5 border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md active:scale-[0.99] relative overflow-hidden col-span-2 sm:col-span-1"
          :class="activeAgingFilter === '180plus' ? 'border-purple-600 ring-2 ring-purple-400/30 bg-purple-50/50' : 'border-slate-200/80 hover:border-purple-300'"
        >
          <div class="flex items-center justify-between mb-1">
            <span class="text-[10px] font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-purple-600 animate-ping"></span>
              180+ Days
            </span>
            <span class="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800">
              {{ summaryStats.pct180_plus.toFixed(0) }}%
            </span>
          </div>
          <div class="text-sm sm:text-base font-black text-purple-950 tracking-tight">
            {{ formatINR(summaryStats.b180_plus) }}
          </div>
          <p class="text-[10px] text-purple-700 font-bold mt-0.5 flex items-center gap-1">
            <i class="fa-solid fa-triangle-exclamation"></i>
            {{ summaryStats.count180_plus }} Critical Parties
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
            :placeholder="`Search in ${filteredParties.length} line debtors by party or line…`"
            class="w-full h-12 rounded-2xl bg-white border border-slate-200/90 pl-11 pr-10 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-xs transition-all"
          />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="absolute right-3 w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center text-xs cursor-pointer"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Filter Pills Row (Mutually Exclusive Buckets) -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
          <button
            @click="activeAgingFilter = 'all'"
            class="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer"
            :class="activeAgingFilter === 'all' ? 'bg-slate-900 text-white border-slate-900 shadow-xs' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'"
          >
            All Parties ({{ currentList.length }})
          </button>

          <button
            @click="activeAgingFilter = '180plus'"
            class="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer"
            :class="activeAgingFilter === '180plus' ? 'bg-purple-700 text-white border-purple-700 shadow-xs' : 'bg-purple-50 text-purple-900 border-purple-200 hover:border-purple-300'"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-purple-500" :class="activeAgingFilter === '180plus' ? 'bg-white' : ''"></span>
            180+ Days ({{ summaryStats.count180_plus }})
          </button>

          <button
            @click="activeAgingFilter = '90_180'"
            class="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer"
            :class="activeAgingFilter === '90_180' ? 'bg-rose-600 text-white border-rose-600 shadow-xs' : 'bg-rose-50 text-rose-800 border-rose-200 hover:border-rose-300'"
          >
            90–180 Days ({{ summaryStats.count90_180 }})
          </button>

          <button
            @click="activeAgingFilter = '61_90'"
            class="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer"
            :class="activeAgingFilter === '61_90' ? 'bg-orange-600 text-white border-orange-600 shadow-xs' : 'bg-orange-50 text-orange-800 border-orange-200 hover:border-orange-300'"
          >
            61–90 Days ({{ summaryStats.count61_90 }})
          </button>

          <button
            @click="activeAgingFilter = '31_60'"
            class="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer"
            :class="activeAgingFilter === '31_60' ? 'bg-amber-600 text-white border-amber-600 shadow-xs' : 'bg-amber-50 text-amber-800 border-amber-200 hover:border-amber-300'"
          >
            31–60 Days ({{ summaryStats.count31_60 }})
          </button>

          <button
            @click="activeAgingFilter = '0_30'"
            class="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer"
            :class="activeAgingFilter === '0_30' ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:border-emerald-300'"
          >
            0–30 Days ({{ summaryStats.count0_30 }})
          </button>
        </div>
      </div>

      <!-- ═══ PARTY VIEW (Individual Line Debtors) ═══ -->
      <div v-if="viewMode === 'Party View'" class="space-y-3">
        <!-- Empty Results -->
        <div v-if="filteredParties.length === 0" class="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <div class="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 text-xl">
            <i class="fa-solid fa-magnifying-glass"></i>
          </div>
          <h3 class="text-base font-bold text-slate-800">No parties match your criteria</h3>
          <p class="text-xs text-slate-400 max-w-sm mx-auto">Try clearing your search query or switching aging filters.</p>
          <button @click="searchQuery = ''; activeAgingFilter = 'all'" class="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer">
            Reset Filters
          </button>
        </div>

        <!-- Party Card List -->
        <div
          v-for="party in visibleParties"
          :key="party.ledgerName"
          class="bg-white/95 rounded-2xl p-4 sm:p-5 border transition-all duration-200 shadow-xs hover:shadow-md space-y-3.5"
          :class="party.primaryBucket === '180plus' ? 'border-purple-200/90 ring-1 ring-purple-500/20' : party.primaryBucket === '90_180' ? 'border-rose-200/90 ring-1 ring-rose-500/10' : 'border-slate-200/80'"
        >
          <!-- Card Header -->
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-sm sm:text-base font-black text-slate-900 leading-snug">
                  {{ party.ledgerName }}
                </h3>
                <!-- Dedicated Bucket Status Badge -->
                <span
                  v-if="party.primaryBucket === '180plus'"
                  class="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
                >
                  <i class="fa-solid fa-skull-crossbones text-[9px]"></i>
                  180+d Critical
                </span>
                <span
                  v-else-if="party.primaryBucket === '90_180'"
                  class="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
                >
                  <i class="fa-solid fa-triangle-exclamation text-[9px]"></i>
                  90–180d High Risk
                </span>
                <span
                  v-else-if="party.primaryBucket === '61_90'"
                  class="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
                >
                  <i class="fa-solid fa-clock text-[9px]"></i>
                  61–90d Overdue
                </span>
                <span
                  v-else-if="party.primaryBucket === '31_60'"
                  class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
                >
                  <i class="fa-solid fa-calendar-days text-[9px]"></i>
                  31–60d Due
                </span>
                <span
                  v-else
                  class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
                >
                  <i class="fa-solid fa-circle-check text-[9px]"></i>
                  0–30d Current
                </span>
              </div>
              <p class="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5 mt-0.5">
                <i class="fa-solid fa-location-dot text-[10px] text-teal-600"></i>
                <span>{{ party.groupName }}</span>
              </p>
            </div>

            <!-- Total Outstanding Balance -->
            <div class="text-right flex-shrink-0">
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Balance</span>
              <span class="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {{ formatINR(party.totalOutstanding) }}
              </span>
            </div>
          </div>

          <!-- ═══ 2-ROW DYNAMIC AESTHETIC ROUNDED AGING TABLE (ONLY ACTIVE COLUMNS) ═══ -->
          <div class="overflow-x-auto rounded-2xl border border-slate-200/80 bg-slate-50/50 shadow-2xs">
            <table class="w-full text-center text-xs border-collapse">
              <thead>
                <tr class="text-[10px] font-black uppercase tracking-wider divide-x divide-slate-200/70 border-b border-slate-200/70">
                  <th
                    v-for="bucket in getActiveAgingBuckets(party)"
                    :key="bucket.key"
                    class="py-1.5 px-2.5 transition-colors"
                    :class="bucket.headerBg"
                  >
                    <span class="inline-flex items-center gap-1.5">
                      <span class="w-1.5 h-1.5 rounded-full" :class="bucket.dot"></span>
                      {{ bucket.label }}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr class="divide-x divide-slate-200/70 text-xs sm:text-sm font-black">
                  <td
                    v-for="bucket in getActiveAgingBuckets(party)"
                    :key="bucket.key"
                    class="py-2.5 px-2 transition-colors font-black"
                    :class="bucket.valueBg"
                  >
                    {{ formatINR(bucket.amount) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Bottom Action Buttons: 6-Month Ledger PDF & Polite WhatsApp Follow-up -->
          <div class="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <button
              @click="openLedgerDetail(party)"
              class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <i class="fa-solid fa-file-invoice text-teal-600"></i>
              <span>View Ledger</span>
            </button>

            <div class="flex items-center gap-2">
              <!-- Generate & Share 6M Ledger PDF -->
              <button
                @click="sharePartyLedgerPDF(party)"
                class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                title="Download 6-Month Statement PDF"
              >
                <i class="fa-solid fa-file-pdf text-rose-400"></i>
                <span class="hidden sm:inline">6M PDF</span>
              </button>

              <!-- Polite WhatsApp Payment Follow-up -->
              <button
                @click="sendWhatsAppReminderWithPDF(party)"
                class="px-3.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#128C7E] active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <i class="fa-brands fa-whatsapp text-sm"></i>
                <span>Follow Up</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Load More Pagination Button -->
        <div v-if="visibleCount < filteredParties.length" class="text-center pt-4 pb-8">
          <button
            @click="visibleCount += 30"
            class="px-6 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-800 font-bold text-xs hover:bg-slate-50 shadow-xs cursor-pointer"
          >
            Show More Parties ({{ filteredParties.length - visibleCount }} remaining)
          </button>
        </div>
      </div>

      <!-- ═══ GROUP VIEW (Line Summary Breakdown) ═══ -->
      <div v-else class="space-y-3">
        <div
          v-for="group in groupedViewData"
          :key="group.groupName"
          class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3"
        >
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <i class="fa-solid fa-map-location-dot text-teal-600"></i>
                <span>{{ group.groupName }}</span>
              </h3>
              <p class="text-xs text-slate-400 font-semibold mt-0.5">
                {{ group.parties.length }} Line Parties
              </p>
            </div>
            <div class="text-right">
              <span class="text-base sm:text-lg font-black text-slate-900">
                {{ formatINR(group.totalOutstanding) }}
              </span>
            </div>
          </div>

          <!-- Group 5-Segment Aging Bar -->
          <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            <div class="h-full bg-emerald-500" :style="{ width: `${group.pct0_30}%` }"></div>
            <div class="h-full bg-amber-500" :style="{ width: `${group.pct31_60}%` }"></div>
            <div class="h-full bg-orange-500" :style="{ width: `${group.pct61_90}%` }"></div>
            <div class="h-full bg-rose-500" :style="{ width: `${group.pct90_180}%` }"></div>
            <div class="h-full bg-purple-600" :style="{ width: `${group.pct180_plus}%` }"></div>
          </div>

          <div class="grid grid-cols-5 gap-1 text-center text-[10px] pt-1">
            <div class="bg-emerald-50 p-1 rounded-lg">
              <span class="text-emerald-800 font-bold block">0-30d</span>
              <span class="font-extrabold text-emerald-950 block truncate">{{ formatINR(group.b0_30) }}</span>
            </div>
            <div class="bg-amber-50 p-1 rounded-lg">
              <span class="text-amber-800 font-bold block">31-60d</span>
              <span class="font-extrabold text-amber-950 block truncate">{{ formatINR(group.b31_60) }}</span>
            </div>
            <div class="bg-orange-50 p-1 rounded-lg">
              <span class="text-orange-800 font-bold block">61-90d</span>
              <span class="font-extrabold text-orange-950 block truncate">{{ formatINR(group.b61_90) }}</span>
            </div>
            <div class="bg-rose-50 p-1 rounded-lg">
              <span class="text-rose-800 font-bold block">90-180d</span>
              <span class="font-extrabold text-rose-950 block truncate">{{ formatINR(group.b90_180) }}</span>
            </div>
            <div class="bg-purple-50 p-1 rounded-lg">
              <span class="text-purple-800 font-bold block">180+d</span>
              <span class="font-extrabold text-purple-950 block truncate">{{ formatINR(group.b180_plus) }}</span>
            </div>
          </div>
        </div>
      </div>
      </template>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAnalyzerData } from '../composables/useAnalyzerData';
import { generateLedgerPDF } from '../utils/pdfLedgerGenerator';
import VersionBadge from '../components/VersionBadge.vue';
import { toast } from 'vue3-toastify';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

const router = useRouter();
const {
  loading,
  error,
  loadLedgerData,
  viewMode,
  searchQuery,
  selectedGroups,
  activeAgingFilter,
  sortBy,
  currentList,
  groupList,
  summaryStats,
  filteredParties,
  groupedViewData,
  formatINR,
  formatCompactINR,
  getWhatsAppFollowupText,
  getWhatsAppFollowupLink,
  getActiveAgingBuckets
} = useAnalyzerData();

const showSortDropdown = ref(false);
const visibleCount = ref(40);

const visibleParties = computed(() => {
  return filteredParties.value.slice(0, visibleCount.value);
});

const sortOptions = [
  { key: 'overdue_desc', label: 'Most Overdue (180+d first)', icon: 'fa-triangle-exclamation' },
  { key: 'balance_desc', label: 'Highest Balance First', icon: 'fa-arrow-down-wide-short' },
  { key: 'balance_asc', label: 'Lowest Balance First', icon: 'fa-arrow-up-short-wide' },
  { key: 'name_asc', label: 'Party Name (A to Z)', icon: 'fa-arrow-down-a-z' },
  { key: 'name_desc', label: 'Party Name (Z to A)', icon: 'fa-arrow-up-z-a' }
];

const handleBack = () => {
  router.push('/home');
};

const openLedgerDetail = (party) => {
  router.push({ path: '/ledger', query: { party: party.ledgerName } });
};

// 6-Month Ledger PDF Export
const sharePartyLedgerPDF = async (party) => {
  if (!party) return;

  try {
    const raw = party.rawLedger || party;
    const ledgerPayload = {
      ledgerName: party.ledgerName,
      groupName: party.groupName || raw.groupName,
      openingBalance: raw.openingBalance || 0,
      closingBalance: party.closingBalance !== undefined ? party.closingBalance : (raw.closingBalance || 0),
      entries: raw.entries || party.entries || []
    };

    if (Capacitor.isNativePlatform() || Capacitor.getPlatform() === 'android') {
      const pdfDataUri = generateLedgerPDF(ledgerPayload, {
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

      toast.success('6-Month Ledger PDF ready to share!', { autoClose: 2500 });
    } else {
      generateLedgerPDF(ledgerPayload, {
        monthsLimit: 6
      });
      toast.success('6-Month Ledger PDF downloaded successfully!', { autoClose: 2500 });
    }
  } catch (err) {
    console.error('PDF export error:', err);
    toast.error('Failed to generate PDF statement.');
  }
};

// WhatsApp Follow-up: Attach PDF + Copy text to clipboard
const sendWhatsAppReminderWithPDF = async (party) => {
  if (!party) return;

  const text = getWhatsAppFollowupText(party);

  // 1. Copy formatted text message to clipboard
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    }
  } catch (e) {
    console.warn('Clipboard write failed:', e);
  }

  // 2. Prepare Ledger Payload
  const raw = party.rawLedger || party;
  const ledgerPayload = {
    ledgerName: party.ledgerName,
    groupName: party.groupName || raw.groupName,
    openingBalance: raw.openingBalance || 0,
    closingBalance: party.closingBalance !== undefined ? party.closingBalance : (raw.closingBalance || 0),
    entries: raw.entries || party.entries || []
  };

  try {
    if (Capacitor.isNativePlatform() || Capacitor.getPlatform() === 'android') {
      const pdfDataUri = generateLedgerPDF(ledgerPayload, {
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
      generateLedgerPDF(ledgerPayload, { monthsLimit: 6 });
      window.open('https://wa.me/', '_blank');
      toast.success('PDF downloaded & message copied to clipboard!', { autoClose: 3000 });
    }
  } catch (err) {
    console.error('Follow-up PDF error:', err);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    toast.success('Message copied to clipboard!', { autoClose: 2500 });
  }
};

onMounted(async () => {
  await loadLedgerData();
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

.fade-pop-enter-active,
.fade-pop-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-pop-enter-from,
.fade-pop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.96);
}
</style>
