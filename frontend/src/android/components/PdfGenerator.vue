<template>
  <div
    class="flex flex-col lg:flex-row h-screen w-full bg-slate-50 font-sans text-slate-800 overflow-hidden pt-[74px] lg:pt-[72px]"
  >
    <!-- Sidebar -->
    <aside
      class="border-r border-slate-200 bg-white flex-shrink-0 flex-col h-full z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 w-full lg:w-[480px]"
      :class="[mobileTab === 'brands' ? 'flex' : 'hidden lg:flex']"
    >
      <div
        class="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10"
        style="padding-top: max(env(safe-area-inset-top, 20px), 16px)"
      >
        <div class="flex items-center gap-2">
          <!-- Sidebar Back Button -->
          <button
            @click="$router.back()"
            class="w-8 h-8 flex lg:hidden items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors shadow-sm active:scale-95 border border-slate-200 mr-1"
            title="Back"
          >
            <i class="fa-solid fa-arrow-left text-xs"></i>
          </button>

          <h2 class="text-xl font-black text-slate-800 tracking-tight">Brands</h2>
          <span
            class="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider"
            >{{ brands.length }}</span
          >
        </div>
        <button
          @click="selectedBrands = []"
          class="text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors"
          v-if="selectedBrands.length > 0"
        >
          Clear
        </button>
      </div>

      <div
        class="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar pb-[calc(100px+env(safe-area-inset-bottom))] lg:pb-4 pt-[max(env(safe-area-inset-top),20px)]"
      >
        <!-- Paragon Section -->
        <div
          v-if="groupedSidebar.paragon.length > 0"
          class="p-2 transition-all rounded-2xl bg-red-50/30 hover:bg-red-50/60 border border-transparent hover:border-red-100"
        >
          <div class="flex items-center justify-between px-2 mb-3">
            <div class="flex items-center gap-2">
              <img
                src="https://res.cloudinary.com/dg365ewal/image/upload/paragonLogo_rqk3hu.webp"
                alt="Paragon"
                class="h-6 object-contain"
              />
            </div>
            <input
              type="checkbox"
              :checked="isCategorySelected('paragon')"
              @change="toggleCategory('paragon', $event)"
              class="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
            />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div
              v-for="item in groupedSidebar.paragon"
              :key="item.groupName"
              class="flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer bg-white border border-transparent hover:border-red-200 shadow-sm hover:shadow-md select-none"
              :class="{
                '!bg-red-50 !border-red-200 ring-1 ring-red-200': selectedBrands.includes(
                  item.groupName
                ),
              }"
              @click="toggleBrand(item.groupName)"
            >
              <input
                type="checkbox"
                :checked="selectedBrands.includes(item.groupName)"
                class="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-gray-300 pointer-events-none"
              />
              <span
                class="text-sm font-semibold text-slate-700 leading-tight"
                :class="{ 'text-red-800': selectedBrands.includes(item.groupName) }"
                >{{ formatProductName(item.groupName) }}</span
              >
            </div>
          </div>
        </div>

        <!-- Top Brands Section -->
        <div
          v-if="groupedSidebar.topBrands.length > 0"
          class="p-2 transition-all rounded-2xl bg-amber-50/30 hover:bg-amber-50/60 border border-transparent hover:border-amber-100"
        >
          <div class="flex items-center justify-between px-2 mb-3">
            <span class="text-xs font-black text-amber-600 uppercase tracking-widest pl-1"
              >Top Brands</span
            >
            <input
              type="checkbox"
              :checked="isCategorySelected('topBrands')"
              @change="toggleCategory('topBrands', $event)"
              class="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
            />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div
              v-for="item in groupedSidebar.topBrands"
              :key="item.group.groupName"
              class="flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer bg-white border border-transparent hover:border-amber-200 shadow-sm hover:shadow-md select-none"
              :class="{
                '!bg-amber-50 !border-amber-200 ring-1 ring-amber-200': selectedBrands.includes(
                  item.group.groupName
                ),
              }"
              @click="toggleBrand(item.group.groupName)"
            >
              <input
                type="checkbox"
                :checked="selectedBrands.includes(item.group.groupName)"
                class="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-gray-300 pointer-events-none"
              />
              <div class="flex items-center gap-2 overflow-hidden">
                <div
                  class="w-6 h-6 rounded-full bg-white border border-amber-100 p-0.5 shrink-0 overflow-hidden shadow-sm flex items-center justify-center"
                >
                  <img v-if="item.logo" :src="item.logo" class="w-full h-full object-contain" />
                  <span v-else class="text-[8px] font-bold text-amber-600">{{
                    item.group.groupName[0]
                  }}</span>
                </div>
                <span
                  class="text-sm font-semibold text-slate-700 leading-tight truncate"
                  :class="{ 'text-amber-800': selectedBrands.includes(item.group.groupName) }"
                  >{{ formatProductName(item.group.groupName) }}</span
                >
              </div>
            </div>
          </div>
        </div>

        <!-- General Loose Packing (Teal) -->
        <div
          v-if="groupedSidebar.generalLoosePackingGroups.length > 0"
          class="p-2 transition-all rounded-2xl bg-teal-50/30 hover:bg-teal-50/60 border border-transparent hover:border-teal-100"
        >
          <div class="flex items-center justify-between px-2 mb-3">
            <span class="text-xs font-black text-teal-600 uppercase tracking-widest pl-1"
              >General Loose Packing</span
            >
            <input
              type="checkbox"
              :checked="isCategorySelected('generalLoosePackingGroups')"
              @change="toggleCategory('generalLoosePackingGroups', $event)"
              class="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
            />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div
              v-for="item in groupedSidebar.generalLoosePackingGroups"
              :key="item.groupName"
              class="flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer bg-white border border-transparent hover:border-teal-200 shadow-sm hover:shadow-md select-none"
              :class="{
                '!bg-teal-50 !border-teal-200 ring-1 ring-teal-200': selectedBrands.includes(
                  item.groupName
                ),
              }"
              @click="toggleBrand(item.groupName)"
            >
              <input
                type="checkbox"
                :checked="selectedBrands.includes(item.groupName)"
                class="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-gray-300 pointer-events-none"
              />
              <span
                class="text-sm font-semibold text-slate-700 leading-tight"
                :class="{ 'text-teal-800': selectedBrands.includes(item.groupName) }"
                >{{ formatProductName(item.groupName) }}</span
              >
            </div>
          </div>
        </div>

        <!-- General Box Packing (Indigo) -->
        <div
          v-if="groupedSidebar.generalBoxPackingGroups.length > 0"
          class="p-2 transition-all rounded-2xl bg-indigo-50/30 hover:bg-indigo-50/60 border border-transparent hover:border-indigo-100"
        >
          <div class="flex items-center justify-between px-2 mb-3">
            <span class="text-xs font-black text-indigo-600 uppercase tracking-widest pl-1"
              >General Box Packing</span
            >
            <input
              type="checkbox"
              :checked="isCategorySelected('generalBoxPackingGroups')"
              @change="toggleCategory('generalBoxPackingGroups', $event)"
              class="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
            />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div
              v-for="item in groupedSidebar.generalBoxPackingGroups"
              :key="item.groupName"
              class="flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer bg-white border border-transparent hover:border-indigo-200 shadow-sm hover:shadow-md select-none"
              :class="{
                '!bg-indigo-50 !border-indigo-200 ring-1 ring-indigo-200': selectedBrands.includes(
                  item.groupName
                ),
              }"
              @click="toggleBrand(item.groupName)"
            >
              <input
                type="checkbox"
                :checked="selectedBrands.includes(item.groupName)"
                class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 pointer-events-none"
              />
              <span
                class="text-sm font-semibold text-slate-700 leading-tight"
                :class="{ 'text-indigo-800': selectedBrands.includes(item.groupName) }"
                >{{ formatProductName(item.groupName) }}</span
              >
            </div>
          </div>
        </div>

        <!-- Mid Brands (Purple) -->
        <div
          v-if="groupedSidebar.midBrands.length > 0"
          class="p-2 transition-all rounded-2xl bg-purple-50/30 hover:bg-purple-50/60 border border-transparent hover:border-purple-100"
        >
          <div class="flex items-center justify-between px-2 mb-3">
            <span class="text-xs font-black text-purple-600 uppercase tracking-widest pl-1"
              >Mid Brands</span
            >
            <input
              type="checkbox"
              :checked="isCategorySelected('midBrands')"
              @change="toggleCategory('midBrands', $event)"
              class="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
            />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div
              v-for="item in groupedSidebar.midBrands"
              :key="item.groupName"
              class="flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer bg-white border border-transparent hover:border-purple-200 shadow-sm hover:shadow-md select-none"
              :class="{
                '!bg-purple-50 !border-purple-200 ring-1 ring-purple-200': selectedBrands.includes(
                  item.groupName
                ),
              }"
              @click="toggleBrand(item.groupName)"
            >
              <input
                type="checkbox"
                :checked="selectedBrands.includes(item.groupName)"
                class="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-gray-300 pointer-events-none"
              />
              <span
                class="text-sm font-semibold text-slate-700 leading-tight"
                :class="{ 'text-purple-800': selectedBrands.includes(item.groupName) }"
                >{{ formatProductName(item.groupName) }}</span
              >
            </div>
          </div>
        </div>

        <!-- Socks (Cyan) -->
        <div
          v-if="groupedSidebar.socksGroups.length > 0"
          class="p-2 transition-all rounded-2xl bg-cyan-50/30 hover:bg-cyan-50/60 border border-transparent hover:border-cyan-100"
        >
          <div class="flex items-center justify-between px-2 mb-3">
            <span class="text-xs font-black text-cyan-600 uppercase tracking-widest pl-1"
              >Socks</span
            >
            <input
              type="checkbox"
              :checked="isCategorySelected('socksGroups')"
              @change="toggleCategory('socksGroups', $event)"
              class="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
            />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div
              v-for="item in groupedSidebar.socksGroups"
              :key="item.groupName"
              class="flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer bg-white border border-transparent hover:border-cyan-200 shadow-sm hover:shadow-md select-none"
              :class="{
                '!bg-cyan-50 !border-cyan-200 ring-1 ring-cyan-200': selectedBrands.includes(
                  item.groupName
                ),
              }"
              @click="toggleBrand(item.groupName)"
            >
              <input
                type="checkbox"
                :checked="selectedBrands.includes(item.groupName)"
                class="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-gray-300 pointer-events-none"
              />
              <span
                class="text-sm font-semibold text-slate-700 leading-tight"
                :class="{ 'text-cyan-800': selectedBrands.includes(item.groupName) }"
                >{{ formatProductName(item.groupName) }}</span
              >
            </div>
          </div>
        </div>

        <!-- General & Clubs Wrapper -->
        <div class="p-4 bg-emerald-50/40 border border-emerald-100 rounded-2xl space-y-6">
          <!-- General Items -->
          <div v-if="groupedSidebar.general.length > 0">
            <div class="flex items-center justify-between px-2 mb-3">
              <span class="text-xs font-black text-emerald-600 uppercase tracking-widest pl-1"
                >General</span
              >
              <input
                type="checkbox"
                :checked="isCategorySelected('general')"
                @change="toggleCategory('general', $event)"
                class="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
              />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div
                v-for="item in groupedSidebar.general"
                :key="item.groupName"
                class="flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer bg-white border border-transparent hover:border-emerald-200 shadow-sm hover:shadow-md select-none"
                :class="{
                  '!bg-emerald-50 !border-emerald-200 ring-1 ring-emerald-200':
                    selectedBrands.includes(item.groupName),
                }"
                @click="toggleBrand(item.groupName)"
              >
                <input
                  type="checkbox"
                  :checked="selectedBrands.includes(item.groupName)"
                  class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 pointer-events-none"
                />
                <span
                  class="text-sm font-semibold text-slate-700 leading-tight"
                  :class="{ 'text-emerald-800': selectedBrands.includes(item.groupName) }"
                  >{{ formatProductName(item.groupName) }}</span
                >
              </div>
            </div>
          </div>

          <!-- Bansal Club -->
          <div v-if="groupedSidebar.bansalGroups.length > 0">
            <div class="flex items-center justify-between px-2 mb-3">
              <span class="text-xs font-black text-emerald-600 uppercase tracking-widest pl-1"
                >BANSAL CLUB</span
              >
              <input
                type="checkbox"
                :checked="isCategorySelected('bansalGroups')"
                @change="toggleCategory('bansalGroups', $event)"
                class="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
              />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div
                v-for="item in groupedSidebar.bansalGroups"
                :key="item.groupName"
                class="flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer bg-white border border-transparent hover:border-emerald-200 shadow-sm hover:shadow-md select-none"
                :class="{
                  '!bg-emerald-50 !border-emerald-200 ring-1 ring-emerald-200':
                    selectedBrands.includes(item.groupName),
                }"
                @click="toggleBrand(item.groupName)"
              >
                <input
                  type="checkbox"
                  :checked="selectedBrands.includes(item.groupName)"
                  class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 pointer-events-none"
                />
                <span
                  class="text-sm font-semibold text-slate-700 leading-tight"
                  :class="{ 'text-emerald-800': selectedBrands.includes(item.groupName) }"
                  >{{ formatProductName(item.groupName) }}</span
                >
              </div>
            </div>
          </div>

          <!-- Airson Club -->
          <div v-if="groupedSidebar.airsonGroups.length > 0">
            <div class="flex items-center justify-between px-2 mb-3">
              <span class="text-xs font-black text-emerald-600 uppercase tracking-widest pl-1"
                >AIRSON CLUB</span
              >
              <input
                type="checkbox"
                :checked="isCategorySelected('airsonGroups')"
                @change="toggleCategory('airsonGroups', $event)"
                class="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
              />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div
                v-for="item in groupedSidebar.airsonGroups"
                :key="item.groupName"
                class="flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer bg-white border border-transparent hover:border-emerald-200 shadow-sm hover:shadow-md select-none"
                :class="{
                  '!bg-emerald-50 !border-emerald-200 ring-1 ring-emerald-200':
                    selectedBrands.includes(item.groupName),
                }"
                @click="toggleBrand(item.groupName)"
              >
                <input
                  type="checkbox"
                  :checked="selectedBrands.includes(item.groupName)"
                  class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 pointer-events-none"
                />
                <span
                  class="text-sm font-semibold text-slate-700 leading-tight"
                  :class="{ 'text-emerald-800': selectedBrands.includes(item.groupName) }"
                  >{{ formatProductName(item.groupName) }}</span
                >
              </div>
            </div>
          </div>

          <!-- Kohinoor Club -->
          <div v-if="groupedSidebar.kohinoorGroups.length > 0">
            <div class="flex items-center justify-between px-2 mb-3">
              <span class="text-xs font-black text-emerald-600 uppercase tracking-widest pl-1"
                >KOHINOOR CLUB</span
              >
              <input
                type="checkbox"
                :checked="isCategorySelected('kohinoorGroups')"
                @change="toggleCategory('kohinoorGroups', $event)"
                class="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
              />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div
                v-for="item in groupedSidebar.kohinoorGroups"
                :key="item.groupName"
                class="flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer bg-white border border-transparent hover:border-emerald-200 shadow-sm hover:shadow-md select-none"
                :class="{
                  '!bg-emerald-50 !border-emerald-200 ring-1 ring-emerald-200':
                    selectedBrands.includes(item.groupName),
                }"
                @click="toggleBrand(item.groupName)"
              >
                <input
                  type="checkbox"
                  :checked="selectedBrands.includes(item.groupName)"
                  class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 pointer-events-none"
                />
                <span
                  class="text-sm font-semibold text-slate-700 leading-tight"
                  :class="{ 'text-emerald-800': selectedBrands.includes(item.groupName) }"
                  >{{ formatProductName(item.groupName) }}</span
                >
              </div>
            </div>
          </div>

          <!-- Naresh Club -->
          <div v-if="groupedSidebar.nareshGroups.length > 0">
            <div class="flex items-center justify-between px-2 mb-3">
              <span class="text-xs font-black text-emerald-600 uppercase tracking-widest pl-1"
                >NARESH CLUB</span
              >
              <input
                type="checkbox"
                :checked="isCategorySelected('nareshGroups')"
                @change="toggleCategory('nareshGroups', $event)"
                class="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
              />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div
                v-for="item in groupedSidebar.nareshGroups"
                :key="item.groupName"
                class="flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer bg-white border border-transparent hover:border-emerald-200 shadow-sm hover:shadow-md select-none"
                :class="{
                  '!bg-emerald-50 !border-emerald-200 ring-1 ring-emerald-200':
                    selectedBrands.includes(item.groupName),
                }"
                @click="toggleBrand(item.groupName)"
              >
                <input
                  type="checkbox"
                  :checked="selectedBrands.includes(item.groupName)"
                  class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 pointer-events-none"
                />
                <span
                  class="text-sm font-semibold text-slate-700 leading-tight"
                  :class="{ 'text-emerald-800': selectedBrands.includes(item.groupName) }"
                  >{{ formatProductName(item.groupName) }}</span
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Others -->
        <div
          v-if="groupedSidebar.others.length > 0"
          class="p-2 transition-all rounded-2xl bg-slate-50 border border-transparent hover:border-slate-200"
        >
          <div class="flex items-center justify-between px-2 mb-3">
            <span class="text-xs font-black text-slate-400 uppercase tracking-widest pl-1"
              >Others</span
            >
            <input
              type="checkbox"
              :checked="isCategorySelected('others')"
              @change="toggleCategory('others', $event)"
              class="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
            />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div
              v-for="item in groupedSidebar.others"
              :key="item.groupName"
              class="flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer bg-white border border-transparent hover:border-slate-300 shadow-sm hover:shadow-md select-none"
              :class="{
                '!bg-slate-100 !border-slate-300 ring-1 ring-slate-300': selectedBrands.includes(
                  item.groupName
                ),
              }"
              @click="toggleBrand(item.groupName)"
            >
              <input
                type="checkbox"
                :checked="selectedBrands.includes(item.groupName)"
                class="w-4 h-4 rounded text-slate-600 focus:ring-slate-500 border-gray-300 pointer-events-none"
              />
              <span
                class="text-sm font-semibold text-slate-700 leading-tight"
                :class="{ 'text-slate-900': selectedBrands.includes(item.groupName) }"
                >{{ formatProductName(item.groupName) }}</span
              >
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main
      class="flex-1 flex-col h-full relative overflow-hidden bg-slate-50/50"
      :class="[mobileTab === 'export' ? 'flex' : 'hidden lg:flex']"
    >
      <div class="flex h-full flex-col lg:flex-row w-full">
        <!-- Settings & Actions Area -->
        <div
          class="flex-1 overflow-y-auto p-4 lg:p-10 pb-24 lg:pb-10 w-full"
          style="padding-top: max(env(safe-area-inset-top, 20px), 16px)"
        >
          <header class="mb-8 flex items-center gap-4">
            <button
              @click="$router.push('/')"
              class="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md active:scale-95 border border-white/20"
              title="Home"
            >
              <i class="fa-solid fa-house"></i>
            </button>
            <div>
              <h1 class="text-3xl font-black text-slate-800 tracking-tight">Generate Catalog</h1>
              <p class="text-slate-500 font-medium">Configure your export settings</p>
            </div>
          </header>

          <div class="space-y-6 max-w-2xl">
            <!-- Filters Card -->
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <i class="fa-solid fa-filter text-blue-500"></i> Filters
              </h3>
              <div class="space-y-4">
                <label
                  class="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
                >
                  <input
                    type="checkbox"
                    v-model="onlyWithPhotos"
                    class="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span class="font-medium text-slate-700">Only include products with photos</span>
                </label>

                <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div class="flex items-center justify-between mb-2">
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        v-model="minQtyEnabled"
                        class="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span class="font-medium text-slate-700">Minimum Quantity Filter</span>
                    </label>
                    <div
                      class="flex items-center gap-2"
                      :class="{ 'opacity-50 pointer-events-none': !minQtyEnabled }"
                    >
                      <input
                        type="number"
                        v-model.number="minQty"
                        class="w-16 text-center font-bold bg-white border border-slate-300 rounded-lg py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <span class="text-sm font-semibold text-slate-400">pairs</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- PDF Mode Card -->
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <i class="fa-solid fa-file-pdf text-red-500"></i> PDF Mode
              </h3>
              <div class="grid grid-cols-2 gap-4">
                <label class="cursor-pointer relative">
                  <input type="radio" v-model="pdfMode" value="separate" class="peer sr-only" />
                  <div
                    class="p-4 rounded-xl border-2 border-slate-200 hover:border-blue-400 peer-checked:border-blue-600 peer-checked:bg-blue-50 transition-all text-center"
                  >
                    <span class="block font-bold text-slate-700 peer-checked:text-blue-700 mb-1"
                      >Separate Files</span
                    >
                    <span class="text-xs text-slate-500">One PDF per brand</span>
                  </div>
                </label>
                <label class="cursor-pointer relative">
                  <input type="radio" v-model="pdfMode" value="combined" class="peer sr-only" />
                  <div
                    class="p-4 rounded-xl border-2 border-slate-200 hover:border-blue-400 peer-checked:border-blue-600 peer-checked:bg-blue-50 transition-all text-center"
                  >
                    <span class="block font-bold text-slate-700 peer-checked:text-blue-700 mb-1"
                      >Combined Catalog</span
                    >
                    <span class="text-xs text-slate-500">All brands in one PDF</span>
                  </div>
                </label>
              </div>
            </div>

            <!-- ZIP Mode Card -->
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <i class="fa-solid fa-file-zipper text-yellow-500"></i> ZIP Mode
              </h3>
              <div class="grid grid-cols-2 gap-4">
                <label class="cursor-pointer relative">
                  <input type="radio" v-model="zipMode" value="separate" class="peer sr-only" />
                  <div
                    class="p-4 rounded-xl border-2 border-slate-200 hover:border-emerald-400 peer-checked:border-emerald-600 peer-checked:bg-emerald-50 transition-all text-center"
                  >
                    <span class="block font-bold text-slate-700 peer-checked:text-emerald-700 mb-1"
                      >Separate Folders</span
                    >
                    <span class="text-xs text-slate-500">One folder per brand</span>
                  </div>
                </label>
                <label class="cursor-pointer relative">
                  <input type="radio" v-model="zipMode" value="combined" class="peer sr-only" />
                  <div
                    class="p-4 rounded-xl border-2 border-slate-200 hover:border-emerald-400 peer-checked:border-emerald-600 peer-checked:bg-emerald-50 transition-all text-center"
                  >
                    <span class="block font-bold text-slate-700 peer-checked:text-emerald-700 mb-1"
                      >Combined (Flat)</span
                    >
                    <span class="text-xs text-slate-500">All images in root</span>
                  </div>
                </label>
              </div>
              <!-- Batch checkbox (only when combined) -->
              <div v-if="zipMode === 'combined'" class="mt-3 px-1">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="zipBatchMode"
                    class="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  />
                  <span class="text-sm font-medium text-slate-600"
                    >Split into batches of 99 images per subfolder</span
                  >
                </label>
              </div>
            </div>
            <div class="grid grid-cols-1 gap-3 pt-4">
              <button
                @click="generatePdf"
                :disabled="selectedBrands.length === 0 || isGenerating"
                class="w-full py-4 bg-slate-900 hover:bg-black disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-lg"
              >
                <span v-if="isGenerating && isPdfGenerating" class="flex items-center gap-2">
                  <svg
                    class="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {{
                    pdfMode === 'combined'
                      ? 'Merging PDF...'
                      : `Generating PDF (${completedCount}/${selectedBrands.length})`
                  }}
                </span>
                <span v-else>Download PDF Catalog</span>
              </button>

              <div class="grid grid-cols-2 gap-3">
                <button
                  @click="downloadAsImages"
                  :disabled="selectedBrands.length === 0 || isGenerating"
                  class="py-3 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <span
                    v-if="isGenerating && !isPdfGenerating && !isZipGenerating"
                    class="flex items-center gap-2"
                  >
                    <svg
                      class="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                      ></circle>
                      <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creating Images ({{ completedCount }}/{{ selectedBrands.length }})
                  </span>
                  <span v-else>Download Images</span>
                </button>

                <button
                  @click="downloadAsZip"
                  :disabled="selectedBrands.length === 0 || isGenerating"
                  class="py-3 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <span v-if="isGenerating && isZipGenerating" class="flex items-center gap-2">
                    <svg
                      class="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                      ></circle>
                      <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Zipping ({{ completedCount }}/{{ selectedBrands.length }})
                  </span>
                  <span v-else>Download Images (ZIP)</span>
                </button>
              </div>

              <!-- Native App Share Button (WhatsApp/etc) -->
              <button
                v-if="isNativeApp"
                @click="shareViaNativeApp"
                :disabled="selectedBrands.length === 0 || isGenerating"
                class="w-full mt-3 py-4 bg-[#25D366] hover:bg-[#128C7E] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-lg"
              >
                <span v-if="isGenerating && isSharing" class="flex items-center gap-2">
                  <svg
                    class="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Preparing Share ({{ completedCount }}/{{ selectedBrands.length }})
                </span>
                <span v-else class="flex items-center gap-2">
                  <i class="fa-brands fa-whatsapp text-2xl"></i>
                  Share on WhatsApp
                </span>
              </button>

              <!-- One Touch Mode Button -->
              <button
                @click="openOneTouchModal"
                :disabled="isGenerating"
                class="w-full mt-3 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-lg"
              >
                <i class="fa-solid fa-bolt"></i>
                One Touch Mode
              </button>
              <!-- Progress Bar -->
              <div
                v-if="isGenerating"
                class="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2"
              >
                <div
                  class="flex justify-between text-xs font-bold text-blue-800 uppercase tracking-widest"
                >
                  <span>Processing: {{ currentBrand }}</span>
                  <span>{{ Math.round((completedCount / selectedBrands.length) * 100) }}%</span>
                </div>
                <div class="h-2 w-full bg-blue-100 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-blue-500 rounded-full transition-all duration-300"
                    :style="{ width: `${(completedCount / selectedBrands.length) * 100}%` }"
                  ></div>
                </div>
                <div class="text-[10px] text-blue-600/70 text-center font-medium">
                  Please wait, larger brands may take a minute...
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Summary Sidebar (Right) -->
        <div class="w-80 border-l border-slate-200 bg-white p-6 overflow-y-auto hidden xl:block">
          <div class="mb-6">
            <h2 class="text-lg font-black text-slate-800 uppercase tracking-widest mb-1">
              Summary
            </h2>
            <p class="text-sm text-slate-500 font-medium">
              {{ selectedBrands.length }} brands selected
            </p>
          </div>

          <div v-if="selectedBrands.length === 0" class="text-center py-10 opacity-50">
            <div class="text-4xl mb-2">📋</div>
            <p class="text-sm font-medium">No brands selected</p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="brand in selectedBrands"
              :key="brand"
              class="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 group"
            >
              <span class="text-xs font-bold text-slate-700 truncate pr-2">{{
                formatProductName(brand)
              }}</span>
              <button
                @click="toggleBrand(brand)"
                class="text-slate-400 hover:text-red-500 transition-colors"
              >
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Mobile Bottom Navigation -->
    <div
      class="lg:hidden fixed bottom-0 mb-safe left-0 w-full bg-white border-t border-slate-200 flex justify-around items-center h-16 z-[60] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
    >
      <button
        @click="mobileTab = 'brands'"
        class="flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors outline-none bg-transparent rounded-none hover:bg-transparent shadow-none"
        :class="mobileTab === 'brands' ? 'text-blue-600' : 'text-slate-400'"
      >
        <span class="text-[10px] font-bold uppercase tracking-wide">Brands</span>
      </button>

      <div class="h-8 w-[1px] bg-slate-100"></div>

      <button
        @click="mobileTab = 'export'"
        class="flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors outline-none bg-transparent rounded-none hover:bg-transparent shadow-none"
        :class="mobileTab === 'export' ? 'text-blue-600' : 'text-slate-400'"
      >
        <div class="relative">
          <span
            v-if="selectedBrands.length > 0"
            class="absolute -top-1.5 -right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white"
            >{{ selectedBrands.length }}</span
          >
        </div>
        <span class="text-[10px] font-bold uppercase tracking-wide">Export</span>
      </button>
    </div>

    <!-- Toast -->
    <div v-if="showToast" class="fixed bottom-6 right-6 z-[60] animate-bounce-in">
      <div class="bg-slate-800 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3">
        <i class="fa-solid fa-circle-check text-green-400"></i>
        <span class="font-medium">{{ toastMessage }}</span>
      </div>
    </div>

    <!-- Batch Share Modal -->
    <div
      v-if="showBatchModal"
      class="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
    >
      <div class="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-6">
        <div class="text-center space-y-2">
          <div
            class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <i class="fa-brands fa-whatsapp text-3xl text-green-600"></i>
          </div>
          <h3 class="text-xl font-black text-slate-800">
            Share Batch {{ currentBatchIndex + 1 }} / {{ batchList.length }}
          </h3>
          <p class="text-slate-500 font-medium">
            Sending {{ batchList[currentBatchIndex].length }} images in this batch.
          </p>
        </div>

        <!-- Progress Bar -->
        <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-green-500 rounded-full transition-all duration-300"
            :style="{ width: `${(currentBatchIndex / batchList.length) * 100}%` }"
          ></div>
        </div>

        <button
          @click="executeBatchShare"
          class="w-full py-4 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-xl shadow-xl active:scale-[0.95] transition-all flex items-center justify-center gap-3 text-lg"
        >
          <span>Share Batch {{ currentBatchIndex + 1 }}</span>
          <i class="fa-solid fa-arrow-right"></i>
        </button>

        <button
          @click="
            showBatchModal = false;
            isSharing = false;
          "
          class="w-full py-3 text-slate-400 font-bold hover:text-slate-600"
        >
          Cancel
        </button>
      </div>
    </div>

    <!-- One Touch Mode Modal (Live Dashboard) -->
    <div
      v-if="showOneTouchModal"
      class="fixed inset-0 z-[80] bg-black/80 flex items-end lg:items-center justify-center backdrop-blur-sm"
    >
      <div
        class="bg-white rounded-t-3xl lg:rounded-2xl w-full max-w-lg max-h-[92vh] shadow-2xl flex flex-col overflow-hidden"
      >
        <!-- Header -->
        <div
          class="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg"
            >
              <i class="fa-solid fa-bolt text-white text-lg"></i>
            </div>
            <div>
              <h3 class="text-lg font-black text-slate-800">One Touch Mode</h3>
              <p
                class="text-[10px] uppercase tracking-widest font-bold"
                :class="oneTouchStarted ? 'text-violet-500' : 'text-slate-400'"
              >
                {{ oneTouchStarted ? 'Processing...' : 'Auto-share all groups' }}
              </p>
            </div>
          </div>
          <button
            @click="closeOneTouchModal"
            class="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Global Filters (before start) -->
        <div
          v-if="!oneTouchStarted"
          class="px-6 py-4 border-b border-slate-100 space-y-3 flex-shrink-0 bg-slate-50/50"
        >
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              v-model="oneTouchOnlyWithPhotos"
              class="w-5 h-5 rounded text-violet-600 focus:ring-violet-500 border-gray-300"
            />
            <span class="text-sm font-semibold text-slate-700">Only with photos</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              v-model="oneTouchMinQtyEnabled"
              class="w-5 h-5 rounded text-violet-600 focus:ring-violet-500 border-gray-300"
            />
            <span class="text-sm font-semibold text-slate-700">Minimum quantity filter</span>
          </label>
        </div>

        <!-- Overall Progress Bar (after start) -->
        <div
          v-if="oneTouchStarted"
          class="px-6 py-3 border-b border-slate-100 flex-shrink-0 bg-violet-50/50"
        >
          <div class="flex justify-between text-xs font-bold text-violet-600 mb-1.5">
            <span>{{ oneTouchCompletedGroups }} / {{ oneTouchEnabledCount }} groups</span>
            <span
              >{{
                Math.round((oneTouchCompletedGroups / Math.max(oneTouchEnabledCount, 1)) * 100)
              }}%</span
            >
          </div>
          <div class="h-1.5 w-full bg-violet-100 rounded-full overflow-hidden">
            <div
              class="h-full bg-violet-500 rounded-full transition-all duration-500"
              :style="{
                width: `${(oneTouchCompletedGroups / Math.max(oneTouchEnabledCount, 1)) * 100}%`,
              }"
            ></div>
          </div>
        </div>

        <!-- Group List (scrollable) -->
        <div class="flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar">
          <div
            v-for="(group, idx) in oneTouchGroups"
            :key="idx"
            class="rounded-2xl border-2 transition-all overflow-hidden"
            :class="oneTouchGroupClass(group)"
          >
            <!-- Group Header -->
            <div
              class="px-4 py-3"
              :class="{
                'cursor-pointer hover:bg-slate-50/50': group.batches && group.batches.length > 0,
              }"
              @click="
                group.batches && group.batches.length > 0 && (group.expanded = !group.expanded)
              "
            >
              <!-- Row 1: Checkbox + Icon + Name + Status -->
              <div class="flex items-center gap-2.5">
                <!-- Checkbox (before start) -->
                <input
                  v-if="!oneTouchStarted"
                  type="checkbox"
                  v-model="group.enabled"
                  class="w-5 h-5 rounded text-violet-600 focus:ring-violet-500 border-gray-300 cursor-pointer flex-shrink-0"
                  @click.stop
                />

                <!-- Status Icon -->
                <div
                  class="w-8 h-8 flex items-center justify-center flex-shrink-0 rounded-xl"
                  :class="oneTouchIconBgClass(group)"
                >
                  <svg
                    v-if="group.status === 'generating'"
                    class="animate-spin h-5 w-5 text-violet-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span v-else-if="group.status === 'done'" class="text-lg">✅</span>
                  <span v-else-if="group.status === 'ready'" class="text-lg">🟢</span>
                  <span v-else-if="group.status === 'skipped'" class="text-sm">⏭️</span>
                  <span v-else class="text-lg">{{ group.icon }}</span>
                </div>

                <!-- Label + Status text -->
                <div class="flex-1 min-w-0">
                  <span class="text-[13px] font-bold text-slate-800 leading-tight block">{{
                    group.label
                  }}</span>
                  <span
                    v-if="group.status === 'generating'"
                    class="text-[11px] text-violet-500 font-medium"
                  >
                    Generating {{ group.imageCount }}/{{ group.totalImages || '?' }} images...
                  </span>
                  <span
                    v-if="group.status === 'skipped'"
                    class="text-[11px] text-slate-400 font-medium"
                    >No products found</span
                  >
                </div>

                <!-- Image count badge (after generation) -->
                <span
                  v-if="(group.status === 'ready' || group.status === 'done') && group.imageCount > 0"
                  class="text-[10px] bg-violet-100 text-violet-700 font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                >
                  {{ group.imageCount }} imgs
                </span>

                <!-- Expand chevron -->
                <i
                  v-if="group.batches && group.batches.length > 0"
                  class="fa-solid fa-chevron-down text-xs text-slate-400 transition-transform duration-200 flex-shrink-0"
                  :class="{ 'rotate-180': group.expanded }"
                ></i>
              </div>

              <!-- Row 2: Min/Max Qty (compact, below the name) -->
              <div
                v-if="!oneTouchStarted"
                class="flex items-center gap-3 mt-2 pl-[30px]"
                :class="{
                  'opacity-30 pointer-events-none': !oneTouchMinQtyEnabled || !group.enabled,
                }"
              >
                <div class="flex items-center gap-1.5" @click.stop>
                  <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Min</span>
                  <input
                    type="number"
                    v-model.number="group.minQty"
                    class="w-11 text-center font-bold text-xs bg-slate-50 border border-slate-200 rounded-lg py-1 focus:ring-2 focus:ring-violet-400 focus:border-violet-400 outline-none transition-all"
                    @click.stop
                  />
                </div>
                <div class="flex items-center gap-1.5" @click.stop>
                  <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Max</span>
                  <input
                    type="text"
                    v-model="group.maxQty"
                    placeholder="∞"
                    class="w-11 text-center font-bold text-xs bg-slate-50 border border-slate-200 rounded-lg py-1 focus:ring-2 focus:ring-violet-400 focus:border-violet-400 outline-none placeholder:text-slate-300 transition-all"
                    @click.stop
                  />
                </div>
              </div>
            </div>

            <!-- Generating Progress Bar -->
            <div v-if="group.status === 'generating'" class="px-4 pb-3">
              <div class="h-1.5 w-full bg-violet-100 rounded-full overflow-hidden">
                <div
                  class="h-full bg-violet-500 rounded-full transition-all duration-300"
                  :style="{
                    width: group.totalImages
                      ? `${(group.imageCount / group.totalImages) * 100}%`
                      : '10%',
                  }"
                ></div>
              </div>
            </div>

            <!-- Expanded Batch Buttons (horizontal scroll) -->
            <div
              v-if="group.expanded && group.batches && group.batches.length > 0"
              class="px-4 pb-4 pt-2 border-t border-slate-100/80 bg-slate-50/30"
            >
              <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2.5">
                Share Batches
              </p>
              <div class="flex gap-2.5 overflow-x-auto pb-2 ot-scroll-x">
                <button
                  v-for="(batch, bIdx) in group.batches"
                  :key="bIdx"
                  @click.stop="shareOneTouchBatch(idx, bIdx)"
                  :disabled="group.batchStatuses[bIdx] === 'sharing'"
                  class="flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-sm border-2"
                  :class="oneTouchBatchBtnClass(group.batchStatuses[bIdx])"
                >
                  <i
                    v-if="group.batchStatuses[bIdx] === 'shared'"
                    class="fa-solid fa-circle-check"
                  ></i>
                  <i
                    v-else-if="group.batchStatuses[bIdx] === 'sharing'"
                    class="fa-solid fa-spinner fa-spin"
                  ></i>
                  <i v-else class="fa-brands fa-whatsapp text-lg"></i>
                  <span>Batch {{ bIdx + 1 }}</span>
                  <span class="text-[10px] opacity-60">({{ batch.length }})</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-5 border-t border-slate-100 flex-shrink-0">
          <button
            v-if="!oneTouchStarted"
            @click="startOneTouchShare"
            class="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-xl active:scale-[0.95] transition-all flex items-center justify-center gap-3 text-lg"
          >
            <i class="fa-solid fa-bolt"></i>
            Start One Touch
          </button>
          <p
            v-if="!oneTouchStarted"
            class="text-[10px] text-slate-400 text-center font-medium mt-2"
          >
            {{ oneTouchGroups.filter((g) => g.enabled).length }} groups selected • Batches of 99
            images
          </p>

          <button
            v-else-if="oneTouchStarted && !oneTouchAllDone"
            disabled
            class="w-full py-4 bg-slate-300 text-slate-700 font-bold rounded-xl shadow-inner active:scale-[0.95] transition-all flex items-center justify-center gap-3 text-lg"
          >
            <svg
              class="animate-spin h-5 w-5 text-slate-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Processing... {{ formatElapsedTime(oneTouchElapsedTime) }}
          </button>

          <button
            v-if="oneTouchStarted && oneTouchAllDone"
            @click="closeOneTouchModal"
            class="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-xl active:scale-[0.95] transition-all flex items-center justify-center gap-3 text-lg"
          >
            <i class="fa-solid fa-circle-check"></i>
            Done
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

import { jsPDF } from 'jspdf';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { ref } from 'vue';
import { useBrandGroups } from '../../composables/useBrandGroups';
import { useStockData } from '../../composables/useStockData';
import { useAdmin } from '../../composables/useAdmin';
import { BRAND_LISTS } from '../../utils/constants';

// Separator image: 'Old stock ends here / New stocks start'
const OLD_STOCK_SEPARATOR_URL = 'https://res.cloudinary.com/dg365ewal/image/upload/Old_stock_ends_here_oc3rh7.png';

// One Touch Mode group definitions (SBE-specific brand names)
const ONE_TOUCH_GROUPS = [
  { label: 'Paragon', brands: ['Max', 'PARAGON GENTS', 'Escoute'], icon: '👞', defaultMinQty: 10 },
  { label: 'Paragon Ladies', brands: ['PARAGON LADIES'], icon: '👠', defaultMinQty: 10 },
  { label: 'Eeken', brands: ['EEKEN'], icon: '🏃', defaultMinQty: 10 },
  { label: 'Cubix', brands: ['CUBIX', 'CUBIX 2'], icon: '👟', defaultMinQty: 10 },
  { label: 'Florex', brands: ['Florex (Swastik)'], icon: '🌸', defaultMinQty: 10 },
  { label: 'Action', brands: ['ACTION'], icon: '⚡', defaultMinQty: 10 },
  { label: 'Reliance', brands: ['RELIANCE FOOTWEAR'], icon: '🔷', defaultMinQty: 10 },
  {
    label: 'General Box Packing',
    brands: [...BRAND_LISTS.generalBoxPacking],
    icon: '📥',
    defaultMinQty: 10,
  },
  {
    label: 'General Loose Packing',
    brands: [...BRAND_LISTS.generalLoosePacking],
    icon: '📦',
    defaultMinQty: 10,
  },
  { label: 'P-Toes', brands: ['P-TOES'], icon: '🟠', defaultMinQty: 10 },
  { label: 'Paralite', brands: ['PARALITE'], icon: '🔶', defaultMinQty: 10 },
  {
    label: 'Paragon Ladies 40% Discount',
    brands: ['SOLEA DISC 40% OFFER'],
    icon: '🏷️',
    defaultMinQty: 10,
  },
  {
    label: 'Paragon Gents 40% Discount',
    brands: ['PARAGON GENTS 40%'],
    icon: '🏷️',
    defaultMinQty: 10,
  },
  { label: 'Socks', brands: ['Barun', 'Pareek Soucks', 'LEO'], icon: '🧦', defaultMinQty: 10 },
];

export default {
  setup() {
    const { stockData, loadStockData } = useStockData(ref(false));
    const { groupedSidebar } = useBrandGroups(stockData, ref({}), ref(''));
    const brands = ref([]);
    const { isAdmin, isSuperAdmin } = useAdmin();

    return { stockData, loadStockData, groupedSidebar, brands, isAdmin, isSuperAdmin };
  },
  data() {
    return {
      selectedBrands: [],
      onlyWithPhotos: true,
      minQtyEnabled: false,
      minQty: 5,
      pdfMode: 'separate',
      zipMode: 'separate',
      zipBatchMode: false,
      isGenerating: false,
      isPdfGenerating: false,
      isZipGenerating: false,
      isSharing: false,

      // Batch Sharing State
      showBatchModal: false,
      batchList: [],
      currentBatchIndex: 0,

      mobileTab: 'brands',
      currentBrand: '',
      completedCount: 0,
      showToast: false,
      toastMessage: '',

      // One Touch Mode State
      showOneTouchModal: false,
      oneTouchGroups: ONE_TOUCH_GROUPS.map((g) => ({
        ...g,
        enabled: true,
        minQty: g.defaultMinQty,
        maxQty: '',
        status: 'idle', // 'idle' | 'generating' | 'ready' | 'done' | 'skipped'
        batches: [], // [[uri, ...], [uri, ...]]
        batchStatuses: [], // ['idle' | 'sharing' | 'shared'] per batch
        expanded: false,
        imageCount: 0,
        totalImages: 0,
      })),
      oneTouchOnlyWithPhotos: true,
      oneTouchMinQtyEnabled: true,
      oneTouchStarted: false,
      oneTouchElapsedTime: 0,
      oneTouchTimerInterval: null,
    };
  },

  computed: {
    isNativeApp() {
      return Capacitor.isNativePlatform();
    },
    oneTouchEnabledCount() {
      return this.oneTouchGroups.filter((g) => g.enabled).length;
    },
    oneTouchCompletedGroups() {
      return this.oneTouchGroups.filter(
        (g) => g.enabled && (g.status === 'ready' || g.status === 'done' || g.status === 'skipped')
      ).length;
    },
    oneTouchAllDone() {
      return (
        this.oneTouchStarted &&
        this.oneTouchGroups
          .filter((g) => g.enabled)
          .every((g) => g.status === 'done' || g.status === 'skipped' || g.status === 'ready')
      );
    },
  },

  async mounted() {
    await this.loadStockData();
    this.brands = this.stockData.map((g) => g.groupName).sort();

    // Hardware Back Button Listener
    App.addListener('backButton', () => {
      if (this.$router.currentRoute.value.path === '/pdf-gen') {
        this.$router.push('/');
      }
    });
  },

  beforeUnmount() {
    App.removeAllListeners();
  },

  methods: {
    formatProductName(name) {
      if (!name) return '';
      return name
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    },
    getBrandLogo(brandName) {
      const logos = {
        Paragon:
          'https://res.cloudinary.com/dg365ewal/image/upload/paragonLogo_rqk3hu.webp',
        Reliance:
          'https://res.cloudinary.com/dg365ewal/image/upload/relianceLogo_bvgwwz.png',
        Cubix: 'https://res.cloudinary.com/dg365ewal/image/upload/cubixLogo_bwawj3.jpg',
        Florex:
          'https://res.cloudinary.com/dg365ewal/image/upload/florexLogo_sqgjln.png',
        Eeken:
          'https://res.cloudinary.com/dg365ewal/image/upload/eekenLogo_rg5xwa.webp',
        Escoute:
          'https://res.cloudinary.com/dg365ewal/image/upload/escouteLogo_maieji.jpg',
      };
      const lowerName = brandName.toLowerCase();
      const key = Object.keys(logos).find((k) => lowerName.includes(k.toLowerCase()));
      return key ? logos[key] : null;
    },
    toggleBrand(brandName) {
      if (this.selectedBrands.includes(brandName)) {
        this.selectedBrands = this.selectedBrands.filter((b) => b !== brandName);
      } else {
        this.selectedBrands.push(brandName);
      }
    },
    isCategorySelected(category) {
      const group = this.groupedSidebar[category];
      if (!group || group.length === 0) return false;

      return group.every((item) => {
        // Only topBrands uses { group: { groupName }, logo } structure
        const name = category === 'topBrands' ? item.group.groupName : item.groupName;
        return this.selectedBrands.includes(name);
      });
    },
    toggleCategory(category, event) {
      const isChecked = event.target.checked;
      const group = this.groupedSidebar[category];

      if (!group) return;

      group.forEach((item) => {
        // Only topBrands uses { group: { groupName }, logo } structure
        const name = category === 'topBrands' ? item.group.groupName : item.groupName;
        if (isChecked) {
          if (!this.selectedBrands.includes(name)) this.selectedBrands.push(name);
        } else {
          this.selectedBrands = this.selectedBrands.filter((b) => b !== name);
        }
      });
    },
    scrollToGenerate() {
      this.$nextTick(() => {
        this.$refs.generateSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    },

    async loadBrands() {
      try {
        const res = await axios.get(
          'https://raw.githubusercontent.com/sahilsync07/sbe/main/frontend/public/assets/stock-data.json'
        );
        this.brands = [...new Set(res.data.map((g) => g.groupName))].sort();
      } catch (err) {
        this.showToast = true;
        this.toastMessage = 'Failed to load brands — check internet';
        setTimeout(() => (this.showToast = false), 3000);
      }
    },

    // --- PDF GENERATION LOGIC (Frontend Only) ---
    async generatePdfBlob(targetBrands) {
      // 1. Use Cached Data
      const data = this.stockData;
      const filteredGroups = data.filter((group) => targetBrands.includes(group.groupName));

      // 2. Setup PDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt', // using points to match pdfkit somewhat closer (72 dpi vs pdfkit default)
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      let hasAddedPage = false;

      for (const group of filteredGroups) {
        let isFirstProductInBrand = true;

        for (const product of group.products) {
          if (this.onlyWithPhotos && !product.imageUrl) continue;
          if (this.minQtyEnabled && product.quantity <= this.minQty) continue;

          if (hasAddedPage) {
            doc.addPage();
          }
          hasAddedPage = true;

          // A. Background (Light beige)
          doc.setFillColor('#faf8f6');
          doc.rect(0, 0, pageWidth, pageHeight, 'F');

          // B. Waves
          doc.setDrawColor('#e0e0e0');
          doc.setLineWidth(3);

          // Top Wave
          doc.path([
            { op: 'm', c: [0, 0] },
            { op: 'l', c: [200, 80] },
            { op: 'c', c: [266, 26, 400, 33, 600, 100] },
          ]);
          doc.stroke();

          // Bottom Wave
          const h = pageHeight;
          doc.path([
            { op: 'm', c: [0, h] },
            { op: 'l', c: [250, h - 100] },
            { op: 'c', c: [316, h - 33, 433, h - 16, 600, h - 50] },
          ]);
          doc.stroke();

          // C. Brand Name (First product only)
          if (isFirstProductInBrand) {
            doc.setTextColor(0, 0, 0); // Black
            // doc.setFillOpacity(0.2); // jsPDF doesn't handle fillOpacity easily for text, using light grey instead
            doc.setTextColor(200, 200, 200); // Light Grey to simulate opacity
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(28);
            doc.text(group.groupName, pageWidth / 2, 35, { align: 'center' });
            isFirstProductInBrand = false;
          }

          // D. Product Image
          if (product.imageUrl) {
            try {
              // Fetch image as blobs
              const imgData = await this.fetchImageAsBase64(product.imageUrl);

              // Dimensions
              const maxWidth = pageWidth - 40;
              const maxHeight = pageHeight - 150;

              // We need image dimensions.
              // With Base64, we can load it into a temporary Image object to get dims
              const dims = await this.getImageDimensions(imgData);

              const scale = Math.min(maxWidth / dims.width, maxHeight / dims.height, 1);
              const finalWidth = dims.width * scale;
              const finalHeight = dims.height * scale;

              const x = (pageWidth - finalWidth) / 2;
              const y = 60;

              doc.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight);

              const textY = y + finalHeight + 25;

              // E. Text
              doc.setTextColor(0, 0, 0);
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(16);
              doc.text(product.productName, pageWidth / 2, textY, { align: 'center' });

              doc.setTextColor(212, 0, 0); // #d40000
              doc.setFontSize(18);
              doc.text(`Qty: ${product.quantity}`, pageWidth / 2, textY + 30, { align: 'center' });
            } catch (imgErr) {
              console.error(`Image failed: ${product.productName}`, imgErr);
              doc.setTextColor(0);
              doc.setFontSize(16);
              doc.text('Image Load Failed', pageWidth / 2, pageHeight / 2, { align: 'center' });
            }
          } else {
            doc.setTextColor(0);
            doc.setFontSize(20);
            doc.text(product.productName, pageWidth / 2, pageHeight / 2 - 20, { align: 'center' });
            doc.text(`Qty: ${product.quantity}`, pageWidth / 2, pageHeight / 2 + 20, {
              align: 'center',
            });
          }
        }
      }

      return doc.output('blob');
    },

    async fetchImageAsBase64(url) {
      const res = await axios.get(url, { responseType: 'arraybuffer' });
      const base64 = btoa(
        new Uint8Array(res.data).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      return `data:${res.headers['content-type']};base64,${base64}`;
    },

    async getImageDimensions(base64) {
      return new Promise((resolve) => {
        const i = new Image();
        i.onload = () => resolve({ width: i.width, height: i.height });
        i.src = base64;
      });
    },

    async generatePdf() {
      if (!this.selectedBrands.length) {
        this.showToast = true;
        this.toastMessage = 'Select at least one brand first';
        setTimeout(() => (this.showToast = false), 3000);
        return;
      }

      this.isGenerating = true;
      this.isPdfGenerating = true;
      this.completedCount = 0;

      if (this.pdfMode === 'combined') {
        // COMBINED PDF
        this.currentBrand = 'Merging All Brands...';

        try {
          const blob = await this.generatePdfBlob(this.selectedBrands);

          const today = new Date().toISOString().split('T')[0];
          const filename = `CATALOG_COMBINED_${today}.pdf`;

          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          window.URL.revokeObjectURL(url);

          this.completedCount = this.selectedBrands.length;
          this.showToast = true;
          this.toastMessage = 'Combined PDF downloaded!';
          setTimeout(() => (this.showToast = false), 4000);
        } catch (err) {
          console.error(err);
          this.showToast = true;
          this.toastMessage = 'Failed to generate combined PDF';
          setTimeout(() => (this.showToast = false), 5000);
        } finally {
          this.isGenerating = false;
          this.isPdfGenerating = false;
          this.currentBrand = '';
        }
      } else {
        // SEPARATE PDFs
        let successCount = 0;
        let failCount = 0;

        for (const brand of this.selectedBrands) {
          this.currentBrand = `Generating ${brand}...`;

          try {
            const blob = await this.generatePdfBlob([brand]);

            const today = new Date().toISOString().split('T')[0];
            const safe = brand.replace(/[^a-zA-Z0-9]/g, '_');
            const filename = `${safe}_${today}.pdf`;

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);

            successCount++;
          } catch (e) {
            console.error(`Failed ${brand}`, e);
            failCount++;
          }
          this.completedCount++;
          await new Promise((r) => setTimeout(r, 500)); // Sleep briefly to not freeze UI
        }

        this.showToast = true;
        this.toastMessage = `Done! ${successCount} Success, ${failCount} Failed`;
        setTimeout(() => (this.showToast = false), 4000);

        this.isGenerating = false;
        this.isPdfGenerating = false;
        this.currentBrand = '';
      }
    },

    async downloadAsImages() {
      if (!this.selectedBrands.length) return;

      this.isGenerating = true;
      this.isPdfGenerating = false;
      this.isZipGenerating = false; // Just to be safe
      this.completedCount = 0;
      let totalSuccess = 0;
      let totalFailed = 0;
      let totalImages = 0;

      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      for (const brand of this.selectedBrands) {
        this.currentBrand = `Processing: ${brand}`;
        try {
          const pdfBlob = await this.generatePdfBlob([brand]);
          const pdfUrl = URL.createObjectURL(pdfBlob);

          const loadingTask = pdfjsLib.getDocument(pdfUrl);
          const pdf = await loadingTask.promise;

          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2.5 });

            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const context = canvas.getContext('2d');

            await page.render({ canvasContext: context, viewport }).promise;

            const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 0.95));
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `${brand.replace(/[^a-zA-Z0-9]/g, '_')}_Image_${String(pageNum).padStart(3, '0')}.png`;
            a.click();
            URL.revokeObjectURL(url);

            totalImages++;
          }

          URL.revokeObjectURL(pdfUrl);
          totalSuccess++;
        } catch (err) {
          console.error('Failed for brand:', brand, err);
          totalFailed++;
        }
        this.completedCount++;
      }

      this.isGenerating = false;
      this.currentBrand = '';
      this.showToast = true;
      this.toastMessage = `Downloaded ${totalImages} images (${totalFailed} failed brands)`;
      setTimeout(() => (this.showToast = false), 4000);
    },

    async downloadAsZip() {
      if (!this.selectedBrands.length) return;

      this.isGenerating = true;
      this.isZipGenerating = true;
      this.completedCount = 0;
      const zip = new JSZip();

      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      let totalPages = 0;
      let failedBrands = 0;
      const isCombined = this.zipMode === 'combined';
      let globalPageCounter = 0;

      for (const brand of this.selectedBrands) {
        this.currentBrand = `Zipping: ${brand}`;

        try {
          const blob = await this.generatePdfBlob([brand]);

          const pdfUrl = URL.createObjectURL(blob);
          const loadingTask = pdfjsLib.getDocument(pdfUrl);
          const pdf = await loadingTask.promise;

          const target = isCombined ? zip : zip.folder(brand);

          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2.0 });

            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const context = canvas.getContext('2d');
            await page.render({ canvasContext: context, viewport }).promise;

            const imgBlob = await new Promise((resolve) =>
              canvas.toBlob(resolve, 'image/jpeg', 0.85)
            );
            if (isCombined) {
              globalPageCounter++;
              if (this.zipBatchMode) {
                const batchNum = Math.ceil(globalPageCounter / 99);
                const batchFolder = zip.folder(`Batch ${batchNum}`);
                batchFolder.file(
                  `${brand}_${String(globalPageCounter).padStart(4, '0')}.jpg`,
                  imgBlob
                );
              } else {
                target.file(`${brand}_${String(globalPageCounter).padStart(4, '0')}.jpg`, imgBlob);
              }
            } else {
              target.file(`${brand}_Page_${pageNum}.jpg`, imgBlob);
            }
            totalPages++;
          }
          URL.revokeObjectURL(pdfUrl);
        } catch (e) {
          console.error(`Failed to zip ${brand}`, e);
          failedBrands++;
          this.showToast = true;
          this.toastMessage = `Failed to process ${brand}`;
          setTimeout(() => (this.showToast = false), 2000);
        }
        this.completedCount++;
      }

      this.currentBrand = 'Finalizing ZIP file...';
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `Catalog_Images_${new Date().toISOString().split('T')[0]}.zip`);

      this.isGenerating = false;
      this.isZipGenerating = false;
      this.currentBrand = '';
      this.showToast = true;
      this.toastMessage = `ZIP Ready! ${totalPages} images included.`;
      setTimeout(() => (this.showToast = false), 4000);
    },

    async shareViaNativeApp() {
      if (!this.selectedBrands.length) return;

      this.isGenerating = true;
      this.isSharing = true;
      this.completedCount = 0;

      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

        const fileUris = [];

        // 1. Generate All Images & Save to Temp
        for (const brand of this.selectedBrands) {
          this.currentBrand = `Preparing: ${brand}`;
          try {
            const blob = await this.generatePdfBlob([brand]);
            const pdfUrl = URL.createObjectURL(blob);
            const loadingTask = pdfjsLib.getDocument(pdfUrl);
            const pdf = await loadingTask.promise;

            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
              const page = await pdf.getPage(pageNum);
              // Scale 1.5 is good balance for WhatsApp (lighter than print)
              const viewport = page.getViewport({ scale: 1.5 });

              const canvas = document.createElement('canvas');
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              const context = canvas.getContext('2d');
              await page.render({ canvasContext: context, viewport }).promise;

              // Convert to Base64 (needed for Filesystem.writeFile)
              const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
              const fileName = `${brand.replace(/[^a-zA-Z0-9]/g, '')}_${pageNum}.jpg`;

              // Save to Cache Directory
              const savedFile = await Filesystem.writeFile({
                path: fileName,
                data: base64,
                directory: Directory.Cache,
              });

              fileUris.push(savedFile.uri);
            }
            URL.revokeObjectURL(pdfUrl);
          } catch (e) {
            console.error('Native Gen Error', e);
          }
          this.completedCount++;
        }

        // Prepend 'Old stock ends here' separator as first image
        try {
          const separatorUri = await this.saveSeparatorImage('share_native');
          if (separatorUri) {
            fileUris.unshift(separatorUri);
          }
        } catch (e) {
          console.error('Failed to prepend separator:', e);
        }

        // 2. Chunking Logic (Max 99 per batch to stay under WhatsApp 100 limit)
        const chunkSize = 99;
        const batches = [];
        for (let i = 0; i < fileUris.length; i += chunkSize) {
          batches.push(fileUris.slice(i, i + chunkSize));
        }

        if (batches.length === 0) {
          this.showToast = true;
          this.toastMessage = 'No images generated';
          setTimeout(() => (this.showToast = false), 3000);
          this.isSharing = false;
          this.isGenerating = false;
          return;
        }

        // 3. Decide: Direct Share or Batch Mode
        if (batches.length === 1) {
          await Share.share({ files: batches[0] });
          this.isSharing = false;
          this.isGenerating = false;
        } else {
          this.batchList = batches;
          this.currentBatchIndex = 0;
          this.showBatchModal = true;
          // Don't turn off isGenerating yet, modal handles it
        }
      } catch (err) {
        console.error('Native Share Failed', err);
        this.showToast = true;
        this.toastMessage = 'Sharing cancelled or failed.';
        setTimeout(() => (this.showToast = false), 3000);
        this.isGenerating = false;
        this.isSharing = false;
      } finally {
        this.currentBrand = '';
      }
    },

    // ─── ONE TOUCH MODE METHODS ─────────────────────────────────────────
    openOneTouchModal() {
      // Reset all groups to defaults with per-group state
      this.oneTouchGroups = ONE_TOUCH_GROUPS.map((g) => ({
        ...g,
        enabled: true,
        minQty: g.defaultMinQty,
        maxQty: '',
        status: 'idle',
        batches: [],
        batchStatuses: [],
        expanded: false,
        imageCount: 0,
        totalImages: 0,
      }));
      this.oneTouchOnlyWithPhotos = true;
      this.oneTouchMinQtyEnabled = true;
      this.oneTouchStarted = false;
      this.oneTouchElapsedTime = 0;
      if (this.oneTouchTimerInterval) {
        clearInterval(this.oneTouchTimerInterval);
        this.oneTouchTimerInterval = null;
      }
      this.showOneTouchModal = true;
    },

    closeOneTouchModal() {
      this.showOneTouchModal = false;
      this.oneTouchStarted = false;
      this.isGenerating = false;
      if (this.oneTouchTimerInterval) {
        clearInterval(this.oneTouchTimerInterval);
        this.oneTouchTimerInterval = null;
      }
    },

    // UI helper methods for template classes
    oneTouchGroupClass(group) {
      if (group.status === 'generating') return 'bg-violet-50/60 border-violet-300 shadow-md';
      if (group.status === 'ready') return 'bg-green-50/40 border-green-300';
      if (group.status === 'done') return 'bg-slate-50 border-green-200 opacity-80';
      if (group.status === 'skipped') return 'bg-slate-50 border-slate-200 opacity-60';
      if (!this.oneTouchStarted && group.enabled) return 'bg-violet-50/30 border-violet-200';
      return 'bg-slate-50 border-slate-100 opacity-60';
    },

    oneTouchIconBgClass(group) {
      if (group.status === 'generating') return 'bg-violet-100';
      if (group.status === 'ready') return 'bg-green-100';
      if (group.status === 'done') return 'bg-green-50';
      return 'bg-slate-100';
    },

    oneTouchBatchBtnClass(status) {
      if (status === 'sharing')
        return 'bg-blue-100 border-blue-200 text-blue-700 cursor-not-allowed';
      if (status === 'shared') return 'bg-emerald-100 border-emerald-200 text-emerald-800';
      return 'bg-slate-100 border-slate-200 text-slate-500';
    },

    formatElapsedTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    parseMaxQty(val) {
      if (val === '' || val === null || val === undefined) return Infinity;
      const s = String(val).trim().toLowerCase();
      if (s === '' || s === 'x' || s === '∞') return Infinity;
      const n = parseInt(s, 10);
      return isNaN(n) || n <= 0 ? Infinity : n;
    },

    async saveSeparatorImage(prefix) {
      try {
        const imgData = await this.fetchImageAsBase64(OLD_STOCK_SEPARATOR_URL);
        // Draw on canvas to convert to JPEG
        const dims = await this.getImageDimensions(imgData);
        const canvas = document.createElement('canvas');
        canvas.width = dims.width;
        canvas.height = dims.height;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imgData;
        });
        ctx.drawImage(img, 0, 0);
        const b64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
        const fileName = `${prefix}_old_stock_separator.jpg`;
        const saved = await Filesystem.writeFile({
          path: fileName,
          data: b64,
          directory: Directory.Cache,
        });
        // Cleanup
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = 0;
        canvas.height = 0;
        canvas.remove();
        return saved.uri;
      } catch (e) {
        console.error('Failed to save separator image:', e);
        return null;
      }
    },

    async generatePdfBlobForOneTouch(targetBrands, onlyWithPhotos, minQty, maxQty) {
      const data = this.stockData;
      const normalize = (s) => (s ? s.toLowerCase().trim() : '');
      const filteredGroups = data.filter((g) =>
        targetBrands.some((b) => normalize(b) === normalize(g.groupName))
      );

      if (filteredGroups.length === 0) return { blob: null, pageCount: 0 };

      const { jsPDF } = await import('jspdf');
      const { clashDisplayBoldBase64 } = await import('../../utils/fonts.js');

      const PAGE_W = 1080;
      const PAGE_H = 2400;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [PAGE_W, PAGE_H] });

      doc.addFileToVFS('ClashDisplay-Bold.ttf', clashDisplayBoldBase64);
      doc.addFont('ClashDisplay-Bold.ttf', 'Clash Display', 'bold');

      let hasAddedPage = false;
      let pageCount = 0;
      const dateStr = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      for (const group of filteredGroups) {
        for (const product of group.products) {
          if (onlyWithPhotos && !product.imageUrl) continue;
          if (minQty > 0 && product.quantity < minQty) continue;
          if (maxQty > 0 && product.quantity > maxQty) continue;

          if (hasAddedPage) {
            doc.addPage([PAGE_W, PAGE_H]);
          }
          hasAddedPage = true;
          pageCount++;

          doc.setFillColor('#000000');
          doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

          if (product.imageUrl) {
            try {
              const imgData = await this.fetchImageAsBase64(product.imageUrl);
              const dims = await this.getImageDimensions(imgData);

              const finalWidth = PAGE_W;
              const finalHeight = dims.height * (PAGE_W / dims.width);
              const x = 0;
              const y = (PAGE_H - finalHeight) / 2;

              doc.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight);
            } catch (imgErr) {
              doc.setTextColor(255);
              doc.setFont('Clash Display', 'bold');
              doc.setFontSize(24);
              doc.text('Image Load Failed', PAGE_W / 2, PAGE_H / 2, { align: 'center' });
            }
          } else {
            doc.setTextColor(255);
            doc.setFont('Clash Display', 'bold');
            doc.setFontSize(36);
            doc.text('No Photo Available', PAGE_W / 2, PAGE_H / 2, { align: 'center' });
          }

          // HEADER
          doc.setTextColor(180, 180, 180);
          doc.setFont('Clash Display', 'bold');
          doc.setFontSize(38);
          doc.text(dateStr, 50, 80, { align: 'left' });
          doc.text(group.groupName, PAGE_W - 50, 80, { align: 'right' });

          doc.setTextColor(255, 255, 255);
          doc.setFontSize(90);
          doc.text('SBE Rayagada', PAGE_W / 2, 200, { align: 'center' });

          // FOOTER
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(40);
          doc.text(product.productName, PAGE_W / 2, PAGE_H - 160, { align: 'center' });

          doc.setTextColor(255, 215, 0); // Muted gold
          doc.setFontSize(54);
          doc.text(`Qty: ${product.quantity}`, PAGE_W / 2, PAGE_H - 80, { align: 'center' });
        }
      }
      return { blob: pageCount > 0 ? doc.output('blob') : null, pageCount };
    },

    async startOneTouchShare() {
      const checkedGroups = this.oneTouchGroups.filter((g) => g.enabled);
      if (checkedGroups.length === 0) {
        this.showToast = true;
        this.toastMessage = 'Select at least one group';
        setTimeout(() => (this.showToast = false), 3000);
        return;
      }

      if (this.oneTouchTimerInterval) {
        clearInterval(this.oneTouchTimerInterval);
        this.oneTouchTimerInterval = null;
      }
      this.oneTouchElapsedTime = 0;
      this.oneTouchTimerInterval = setInterval(() => {
        this.oneTouchElapsedTime += 1;
      }, 1000);

      // Switch modal to live dashboard mode
      this.oneTouchStarted = true;
      this.isGenerating = true;

      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      // Process all groups — generation runs continuously, sharing is decoupled
      for (const group of checkedGroups) {
        // Check if modal was closed (cancelled)
        if (!this.showOneTouchModal) break;

        group.status = 'generating';
        group.expanded = false;

        try {
          const effectiveMinQty = this.oneTouchMinQtyEnabled ? group.minQty : 0;
          const effectiveMaxQty = this.oneTouchMinQtyEnabled ? this.parseMaxQty(group.maxQty) : Infinity;
          const { blob, pageCount } = await this.generatePdfBlobForOneTouch(
            group.brands,
            this.oneTouchOnlyWithPhotos,
            effectiveMinQty,
            effectiveMaxQty
          );

          if (!blob || pageCount === 0) {
            group.status = 'skipped';
            continue;
          }

          // Render PDF to images
          group.totalImages = pageCount;
          const pdfUrl = URL.createObjectURL(blob);
          const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
          const fileUris = [];

          for (let p = 1; p <= pdf.numPages; p++) {
            if (!this.showOneTouchModal) break; // cancelled
            const page = await pdf.getPage(p);
            const viewport = page.getViewport({ scale: 1.0 });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');
            await page.render({ canvasContext: ctx, viewport }).promise;
            const b64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
            const fileName = `ot_${group.label.replace(/[^a-zA-Z0-9]/g, '')}_${p}.jpg`;
            const saved = await Filesystem.writeFile({
              path: fileName,
              data: b64,
              directory: Directory.Cache,
            });
            fileUris.push(saved.uri);
            group.imageCount = p;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.width = 0;
            canvas.height = 0;
            canvas.remove();
            page.cleanup();
            if (p % 5 === 0) {
              await new Promise((resolve) => setTimeout(resolve, 0));
            }
          }
          URL.revokeObjectURL(pdfUrl);
          pdf.destroy();

          // Prepend 'Old stock ends here' separator as first image
          const separatorUri = await this.saveSeparatorImage(`ot_${group.label.replace(/[^a-zA-Z0-9]/g, '')}`);
          if (separatorUri) {
            fileUris.unshift(separatorUri);
          }

          // Chunk into batches of 99
          const batches = [];
          for (let i = 0; i < fileUris.length; i += 99) {
            batches.push(fileUris.slice(i, i + 99));
          }

          // Populate group's batch data — UI will reactively show batch buttons
          group.batches = batches;
          group.batchStatuses = batches.map(() => 'idle');
          group.status = 'ready';
          group.expanded = true;

          // Yield to event loop between group processing to prevent memory buildup
          await new Promise((resolve) => setTimeout(resolve, 100));

          // DON'T wait for user to share — immediately continue to next group
        } catch (err) {
          console.error(`One Touch failed for ${group.label}:`, err);
          group.status = 'skipped';
        }
      }

      if (this.oneTouchTimerInterval) {
        clearInterval(this.oneTouchTimerInterval);
        this.oneTouchTimerInterval = null;
      }
      this.isGenerating = false;
      this.showToast = true;
      this.toastMessage = `All groups processed! Share at your pace.`;
      setTimeout(() => (this.showToast = false), 4000);
    },

    async shareOneTouchBatch(groupIdx, batchIdx) {
      const group = this.oneTouchGroups[groupIdx];
      if (!group || !group.batches[batchIdx]) return;
      if (group.batchStatuses[batchIdx] === 'sharing') return;

      // Use Vue.set-style for array reactivity (Vue 3 handles this natively)
      group.batchStatuses[batchIdx] = 'sharing';
      // Force reactivity update
      group.batchStatuses = [...group.batchStatuses];

      try {
        await Share.share({ files: group.batches[batchIdx] });
        group.batchStatuses[batchIdx] = 'shared';
      } catch (e) {
        console.error('One touch batch share error:', e);
        // Reset to idle if not already marked shared (user might have cancelled)
        if (group.batchStatuses[batchIdx] !== 'shared') {
          group.batchStatuses[batchIdx] = 'idle';
        }
      }

      // Force reactivity update
      group.batchStatuses = [...group.batchStatuses];

      // Check if all batches are shared
      if (group.batchStatuses.every((s) => s === 'shared')) {
        group.status = 'done';
        group.expanded = false;
      }
    },

    async executeBatchShare() {
      try {
        const currentFiles = this.batchList[this.currentBatchIndex];
        await Share.share({ files: currentFiles });

        // Move to next batch
        this.currentBatchIndex++;

        // Check if done
        if (this.currentBatchIndex >= this.batchList.length) {
          this.showBatchModal = false;
          this.isGenerating = false;
          this.isSharing = false;
          this.showToast = true;
          this.toastMessage = 'All batches shared successfully!';
          setTimeout(() => (this.showToast = false), 4000);
        }
      } catch (e) {
        console.error(e);
        // Don't advance index if failed, let them retry
      }
    },
  },
};
</script>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 20px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background-color: #94a3b8;
}

/* Horizontal scroll for batch buttons */
.ot-scroll-x::-webkit-scrollbar {
  height: 4px;
}
.ot-scroll-x::-webkit-scrollbar-track {
  background: transparent;
}
.ot-scroll-x::-webkit-scrollbar-thumb {
  background-color: #c4b5fd;
  border-radius: 20px;
}
.ot-scroll-x {
  scrollbar-width: thin;
  scrollbar-color: #c4b5fd transparent;
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3) translateY(20px);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.05);
  }
  80% {
    opacity: 1;
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
.animate-bounce-in {
  animation: bounceIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
</style>
