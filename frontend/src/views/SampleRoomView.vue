<template>
  <div class="sr-shell min-h-screen w-full font-sans text-slate-800">
    <main class="w-full pt-[54px] lg:pt-[72px] min-h-screen flex flex-col">
      <!-- Header -->
      <div class="sr-header-sticky sticky top-[54px] lg:top-[72px] z-40 px-2.5 pt-2 pb-1.5 sm:px-5 sm:pt-4 sm:pb-2 lg:px-6 xl:px-10 transition-all duration-300">
        <div class="sr-header-card mx-auto flex w-full max-w-7xl flex-col gap-2.5 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:p-5 lg:mx-0 lg:max-w-none">
          <div class="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
            <button type="button" @click="handleBack" class="sr-back-btn flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-slate-600 transition-all duration-300 active:scale-95 sm:h-12 sm:w-12 hover:-translate-x-1" title="Back">
              <i class="fa-solid fa-arrow-left text-sm sm:text-[15px]"></i>
            </button>
            <div class="min-w-0 flex-1">
              <span class="mb-0.5 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-500/15 to-violet-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 ring-1 ring-indigo-500/20 sm:mb-1 sm:px-3 sm:py-1 sm:text-[11px]">
                <i class="fa-solid fa-box-open text-[9px] sm:text-[10px]"></i>
                Sample Room
              </span>
              <h1 class="mt-0.5 truncate text-lg font-bold tracking-tight text-slate-900 sm:mt-1 sm:text-2xl lg:text-3xl drop-shadow-sm">
                {{ selectedGroup ? toTitleCase(selectedGroup.groupName) : (searchQuery ? 'Search Results' : 'Select Brand') }}
              </h1>
              <div v-if="selectedGroup" class="mt-1 flex items-center gap-3">
                <p class="text-xs text-slate-500 font-medium sm:text-sm">
                  <span class="font-bold text-indigo-600">{{ checkedCount }}</span> / {{ selectedGroup?.products?.length || 0 }} present
                </p>
                <!-- Mini Progress Bar -->
                <div class="h-1.5 w-24 rounded-full bg-slate-200 overflow-hidden sm:w-32 shadow-inner">
                  <div class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500 ease-out"
                       :style="{ width: `${(checkedCount / (selectedGroup?.products?.length || 1)) * 100}%` }">
                  </div>
                </div>
              </div>
              <p v-else-if="searchQuery && globalSearchResults.length > 0" class="mt-0.5 text-xs font-medium text-slate-500 sm:text-sm">
                <span class="font-bold text-indigo-600">{{ globalSearchResults.length }}</span> products found
              </p>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <!-- Brand Actions -->
            <template v-if="selectedGroup">
              <!-- View Mode Toggle -->
              <div class="sr-action-group flex items-center rounded-full p-1 shadow-sm">
                <button @click="viewMode = 'list'" :class="viewMode === 'list' ? 'bg-white text-indigo-600 shadow' : 'text-slate-500 hover:text-slate-700'" class="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full transition-all">
                  <i class="fa-solid fa-list text-[11px] sm:text-xs"></i>
                </button>
                <button @click="viewMode = 'grid'" :class="viewMode === 'grid' ? 'bg-white text-indigo-600 shadow' : 'text-slate-500 hover:text-slate-700'" class="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full transition-all">
                  <i class="fa-solid fa-border-all text-[11px] sm:text-xs"></i>
                </button>
              </div>
              
              <!-- Select Actions -->
              <div class="hidden sm:flex items-center gap-1">
                <button @click="selectAll" class="sr-action-btn rounded-full px-3 py-1.5 text-xs font-semibold sm:px-4 sm:py-2 sm:text-sm">All</button>
                <button @click="selectNone" class="sr-action-btn rounded-full px-3 py-1.5 text-xs font-semibold sm:px-4 sm:py-2 sm:text-sm">None</button>
              </div>

              <!-- Sort by Qty -->
              <button @click="sortByQty = !sortByQty" class="sr-action-btn flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold sm:px-4 sm:py-2 sm:text-sm active:scale-[0.97]" :class="sortByQty ? 'ring-2 ring-indigo-500 ring-offset-1 text-indigo-700' : ''">
                <i class="fa-solid" :class="sortByQty ? 'fa-arrow-down-9-1' : 'fa-sort'"></i> <span class="hidden sm:inline">Sort Qty</span>
              </button>
              
              <!-- Print -->
              <button @click="printPDF" class="sr-print-btn flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white sm:px-5 sm:py-2 sm:text-sm active:scale-[0.97] transition-all hover:shadow-lg hover:shadow-indigo-500/30">
                <i class="fa-solid fa-print text-[11px] sm:text-xs"></i> <span class="hidden sm:inline">Print</span>
              </button>
            </template>
          </div>
        </div>
      </div>

      <div class="flex-1 px-2.5 pb-28 pt-1.5 sm:px-5 sm:pb-32 sm:pt-2 lg:px-6 xl:px-10 lg:pt-3 transition-all duration-300">
        <div class="mx-auto h-full w-full max-w-7xl relative lg:mx-0 lg:max-w-none">

          <!-- Loading -->
          <div v-if="loading" class="sr-state-card absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[2rem] transition-all">
            <div class="relative mb-8">
              <div class="absolute inset-0 scale-150 rounded-full bg-gradient-to-tr from-indigo-400 to-violet-400 opacity-25 blur-3xl animate-pulse"></div>
              <div class="relative flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-slate-200/80 border-t-indigo-600 animate-spin shadow-lg"></div>
            </div>
            <p class="text-lg font-bold text-slate-800 tracking-wide">Loading</p>
          </div>

          <!-- Filters (when brand selected) -->
          <div v-if="!loading && selectedGroup" class="mb-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div class="flex p-1 bg-white/60 backdrop-blur-md rounded-full shadow-sm ring-1 ring-slate-200/50 w-full sm:w-auto overflow-x-auto hide-scrollbar">
              <button @click="filterMode = 'all'" :class="filterMode === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'" class="flex-1 sm:flex-none px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap">
                All ({{ selectedGroup.products.length }})
              </button>
              <button @click="filterMode = 'present'" :class="filterMode === 'present' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'" class="flex-1 sm:flex-none px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap">
                Present ({{ checkedCount }})
              </button>
              <button @click="filterMode = 'missing'" :class="filterMode === 'missing' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'" class="flex-1 sm:flex-none px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap">
                Missing ({{ selectedGroup.products.length - checkedCount }})
              </button>
            </div>
            <!-- Global Search within brand -->
            <div class="group relative w-full sm:w-64">
              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <i class="fa-solid fa-magnifying-glass text-slate-400 group-focus-within:text-indigo-500 text-xs"></i>
              </div>
              <input type="search" v-model="searchQuery" autocomplete="off"
                class="sr-search-small h-9 w-full rounded-full border-0 pl-8 pr-8 text-xs font-medium text-slate-900 outline-none placeholder:text-slate-400 transition-all shadow-sm"
                :placeholder="'Search in ' + toTitleCase(selectedGroup.groupName) + '…'" />
              <button v-if="searchQuery" type="button" @click="searchQuery = ''" class="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-indigo-600 transition-colors">
                <i class="fa-solid fa-circle-xmark text-sm"></i>
              </button>
            </div>
          </div>

          <!-- Global Product Search (when no brand selected) -->
          <div v-if="!loading && !selectedGroup" class="mb-4 sm:mb-6">
            <div class="group relative">
              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 sm:pl-5">
                <i class="fa-solid fa-magnifying-glass text-slate-400 group-focus-within:text-indigo-500 text-sm sm:text-base transition-colors"></i>
              </div>
              <input type="search" v-model="searchQuery" autocomplete="off" ref="globalSearchRef"
                class="sr-search h-12 w-full rounded-full border-0 pl-11 pr-11 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 sm:h-14 sm:pl-12 sm:text-base shadow-md transition-all"
                placeholder="Search all products or select a brand…" />
              <button v-if="searchQuery" type="button" @click="searchQuery = ''" class="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-indigo-600 transition-colors">
                <i class="fa-solid fa-circle-xmark text-lg"></i>
              </button>
            </div>
          </div>

          <!-- Brand Selection (no group selected, no global search) -->
          <div v-if="!selectedGroup && !searchQuery && !loading">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
              <div v-for="group in filteredGroups" :key="group.groupName" @click="selectGroup(group)"
                class="sr-float-card group/card flex cursor-pointer flex-col gap-3 rounded-[1.25rem] p-4 sm:rounded-[1.5rem] sm:p-5 lg:p-6 transition-all hover:-translate-y-1 hover:shadow-xl relative overflow-hidden">
                <div class="absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-violet-500/5 rounded-full blur-2xl group-hover/card:scale-150 transition-transform duration-700"></div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30 sm:h-12 sm:w-12 transition-transform group-hover/card:scale-105 group-hover/card:rotate-3">
                      <i class="fa-solid fa-tag text-sm sm:text-base"></i>
                    </div>
                    <div class="min-w-0">
                      <h3 class="text-base font-bold text-slate-900 sm:text-lg truncate tracking-tight group-hover/card:text-indigo-700 transition-colors">{{ toTitleCase(group?.groupName || '') }}</h3>
                      <p class="mt-0.5 text-[11px] font-medium text-slate-500 sm:text-xs">
                        {{ group?.products?.length || 0 }} products
                      </p>
                    </div>
                  </div>
                  <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 group-hover/card:bg-indigo-50 group-hover/card:text-indigo-600 transition-all sm:h-9 sm:w-9">
                    <i class="fa-solid fa-chevron-right text-[10px] sm:text-xs transition-transform group-hover/card:translate-x-0.5"></i>
                  </div>
                </div>
                <!-- Brand Progress Bar -->
                <div class="mt-2 flex flex-col gap-1.5">
                  <div class="flex justify-between items-end text-[10px] sm:text-xs font-semibold">
                    <span class="text-indigo-600">{{ countCheckedInGroup(group) }} Present</span>
                    <span class="text-slate-400">{{ Math.round((countCheckedInGroup(group) / (group?.products?.length || 1)) * 100) }}%</span>
                  </div>
                  <div class="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden shadow-inner">
                    <div class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500 ease-out"
                         :style="{ width: `${(countCheckedInGroup(group) / (group?.products?.length || 1)) * 100}%` }">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Global Search Results (flat product list across all brands) -->
          <div v-else-if="!selectedGroup && searchQuery && !loading">
            <!-- Empty search state -->
            <div v-if="globalSearchResults.length === 0" class="sr-state-card flex flex-col items-center justify-center rounded-[2rem] px-6 py-16 text-center animate-fade-in">
              <div class="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-slate-50 to-indigo-50/50 text-4xl text-slate-300 shadow-inner ring-1 ring-slate-200/50">
                <i class="fa-solid fa-magnifying-glass"></i>
              </div>
              <h3 class="mb-2 text-xl font-bold text-slate-800 tracking-tight">No products found</h3>
              <p class="max-w-sm text-sm font-medium text-slate-500">We couldn't find any products matching your search.</p>
            </div>

            <!-- Search results list -->
            <div v-else class="space-y-2 sm:space-y-3 animate-fade-in">
              <label v-for="(item, idx) in globalSearchResults" :key="idx"
                class="sr-check-card group/item flex cursor-pointer items-center gap-3 rounded-[1.25rem] p-3 transition-all duration-200 hover:-translate-y-0.5 sm:p-4"
                :class="checkedMap[item.product.productName] ? 'sr-check-active' : ''">
                <div class="relative flex-shrink-0">
                  <input type="checkbox" :checked="checkedMap[item.product.productName]" @change="toggleCheck(item.product.productName)"
                    class="peer sr-only" />
                  <div class="flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-all duration-300 sm:h-7 sm:w-7 sm:rounded-xl"
                    :class="checkedMap[item.product.productName] ? 'border-indigo-500 bg-indigo-500 text-white scale-110 shadow-md shadow-indigo-500/20' : 'border-slate-300 bg-white text-transparent group-hover/item:border-indigo-400'">
                    <i class="fa-solid fa-check text-[10px] sm:text-xs" :class="checkedMap[item.product.productName] ? 'animate-check-pop' : ''"></i>
                  </div>
                </div>
                <!-- Image thumbnail -->
                <div
                  class="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-slate-50 ring-1 ring-slate-200 cursor-pointer sm:w-16 sm:h-16 sm:rounded-2xl transition-transform hover:scale-105 shadow-sm"
                  @click.prevent.stop="openLightbox(item.product)"
                >
                  <CachedImage
                    v-if="item.product.imageUrl"
                    :src="getOptimizedImageUrl(item.product.imageUrl)"
                    alt="Product"
                    class="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center text-slate-300">
                    <i class="fa-solid fa-image text-lg"></i>
                  </div>
                </div>
                <div class="min-w-0 flex-1">
                  <h4 class="text-[13px] font-bold leading-snug text-slate-900 sm:text-[15px] group-hover/item:text-indigo-700 transition-colors">{{ toTitleCase(item.product.productName) }}</h4>
                  <div class="mt-1 flex items-center gap-2">
                    <span class="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600 ring-1 ring-indigo-200/50">
                      <i class="fa-solid fa-tag text-[8px]"></i>
                      {{ toTitleCase(item.groupName) }}
                    </span>
                  </div>
                </div>
                <span class="flex-shrink-0 flex flex-col items-end gap-1">
                  <span class="font-mono text-xs font-bold tabular-nums text-slate-500 sm:text-sm bg-slate-100 px-2 py-0.5 rounded-md">{{ item.product.quantity || 0 }} pcs</span>
                </span>
              </label>
            </div>
          </div>

          <!-- Product Checklist (brand selected) -->
          <div v-else-if="selectedGroup">
            <!-- Empty search state within brand -->
            <div v-if="sortedGroupProducts.length === 0" class="sr-state-card flex flex-col items-center justify-center rounded-[2rem] px-6 py-16 text-center animate-fade-in">
              <div class="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-slate-50 to-indigo-50/50 text-4xl text-slate-300 shadow-inner ring-1 ring-slate-200/50">
                <i class="fa-solid fa-ghost"></i>
              </div>
              <h3 class="mb-2 text-xl font-bold text-slate-800 tracking-tight">No products found</h3>
              <p class="max-w-sm text-sm font-medium text-slate-500">Try adjusting your filters or search term.</p>
            </div>

            <!-- List View -->
            <div v-else-if="viewMode === 'list'" class="space-y-2 sm:space-y-3 animate-fade-in">
              <label v-for="(product, idx) in sortedGroupProducts" :key="product.productName"
                class="sr-check-card group/item flex cursor-pointer items-center gap-3 rounded-[1.25rem] p-3 transition-all duration-200 hover:-translate-y-0.5 sm:p-4"
                :class="checkedMap[product.productName] ? 'sr-check-active' : ''">
                <div class="relative flex-shrink-0">
                  <input type="checkbox" :checked="checkedMap[product.productName]" @change="toggleCheck(product.productName)"
                    class="peer sr-only" />
                  <div class="flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-all duration-300 sm:h-7 sm:w-7 sm:rounded-xl"
                    :class="checkedMap[product.productName] ? 'border-indigo-500 bg-indigo-500 text-white scale-110 shadow-md shadow-indigo-500/20' : 'border-slate-300 bg-white text-transparent group-hover/item:border-indigo-400'">
                    <i class="fa-solid fa-check text-[10px] sm:text-xs" :class="checkedMap[product.productName] ? 'animate-check-pop' : ''"></i>
                  </div>
                </div>
                <!-- Image thumbnail -->
                <div
                  class="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-slate-50 ring-1 ring-slate-200 cursor-pointer sm:w-16 sm:h-16 sm:rounded-2xl transition-transform hover:scale-105 shadow-sm"
                  @click.prevent.stop="openLightbox(product)"
                >
                  <CachedImage
                    v-if="product.imageUrl"
                    :src="getOptimizedImageUrl(product.imageUrl)"
                    alt="Product"
                    class="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center text-slate-300">
                    <i class="fa-solid fa-image text-lg"></i>
                  </div>
                </div>
                <div class="min-w-0 flex-1">
                  <h4 class="text-[13px] font-bold leading-snug text-slate-900 sm:text-[15px] group-hover/item:text-indigo-700 transition-colors">{{ toTitleCase(product.productName) }}</h4>
                </div>
                <span class="flex-shrink-0 flex flex-col items-end gap-1">
                   <span class="font-mono text-xs font-bold tabular-nums text-slate-500 sm:text-sm bg-slate-100 px-2 py-0.5 rounded-md">{{ product.quantity || 0 }} pcs</span>
                </span>
              </label>
            </div>

            <!-- Grid View -->
            <div v-else-if="viewMode === 'grid'" class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:gap-4 lg:gap-5 animate-fade-in">
              <div v-for="(product, idx) in sortedGroupProducts" :key="product.productName"
                class="sr-grid-card group/item relative cursor-pointer flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                :class="checkedMap[product.productName] ? 'sr-grid-active' : ''"
                @click="toggleCheck(product.productName)">
                <!-- Checkbox overlay top right -->
                <div class="absolute top-2 right-2 z-10 transition-transform duration-300 group-hover/item:scale-110">
                   <div class="flex h-6 w-6 items-center justify-center rounded-lg border-2 backdrop-blur-md shadow-sm sm:h-7 sm:w-7 transition-all duration-300"
                    :class="checkedMap[product.productName] ? 'border-indigo-500 bg-indigo-500 text-white shadow-indigo-500/40' : 'border-slate-300 bg-white/70 text-transparent'">
                    <i class="fa-solid fa-check text-[10px] sm:text-xs" :class="checkedMap[product.productName] ? 'animate-check-pop' : ''"></i>
                  </div>
                </div>
                <!-- Image -->
                <div class="aspect-square w-full bg-slate-50 relative overflow-hidden" @click.prevent.stop="openLightbox(product)">
                  <CachedImage
                    v-if="product.imageUrl"
                    :src="getOptimizedImageUrl(product.imageUrl)"
                    alt="Product"
                    class="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-110"
                    :class="checkedMap[product.productName] ? 'opacity-100' : 'opacity-90 grayscale-[20%]'"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100/50">
                    <i class="fa-solid fa-image text-3xl"></i>
                  </div>
                  <!-- Overlay gradient -->
                  <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover/item:opacity-100 pointer-events-none"></div>
                  <!-- Zoom icon on hover -->
                  <div class="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover/item:opacity-100 pointer-events-none">
                     <div class="bg-white/20 backdrop-blur-md p-2 rounded-full text-white shadow-lg transform translate-y-4 group-hover/item:translate-y-0 transition-all duration-300">
                        <i class="fa-solid fa-magnifying-glass-plus"></i>
                     </div>
                  </div>
                </div>
                <!-- Details -->
                <div class="p-3 bg-white flex flex-col flex-1 border-t border-slate-100/50">
                  <h4 class="text-xs sm:text-sm font-bold leading-tight text-slate-900 line-clamp-2 mb-1 group-hover/item:text-indigo-700 transition-colors flex-1">{{ toTitleCase(product.productName) }}</h4>
                  <div class="flex items-center justify-between mt-auto pt-1">
                    <span class="font-mono text-[10px] sm:text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{{ product.quantity || 0 }} pcs</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>

    <!-- Image Lightbox -->
    <ImageLightbox
      :show="lightboxOpen"
      :src="lightboxSrc"
      :title="lightboxTitle"
      :subtitle="lightboxSubtitle"
      @close="lightboxOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '../stores/appStore';
import { storeToRefs } from 'pinia';
import { useStockData } from '../composables/useStockData';
import { generateSampleRoomPDF } from '../utils/pdfSampleRoom';
import { getOptimizedImageUrl } from '../utils/formatters';
import axios from 'axios';
import { toast } from 'vue3-toastify';
import CachedImage from '../components/StockTable/CachedImage.vue';
import ImageLightbox from '../components/ImageLightbox.vue';

const router = useRouter();
const appStore = useAppStore();
const { stockData } = storeToRefs(appStore);
const { loadStockData } = useStockData();

const loading = ref(true);
const saving = ref(false);
const selectedGroup = ref(null);
const checkedMap = ref({});
const searchQuery = ref('');
const sortByQty = ref(false);
const viewMode = ref('list'); // 'list' | 'grid'
const filterMode = ref('all'); // 'all' | 'present' | 'missing'

const sortedGroupProducts = computed(() => {
  if (!selectedGroup.value) return [];
  let arr = [...selectedGroup.value.products];
  
  // Apply Search
  if (searchQuery.value) {
    const qParts = searchQuery.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    arr = arr.filter(p => {
      const name = p.productName.toLowerCase();
      return qParts.every(part => name.includes(part));
    });
  }
  
  // Apply Filter
  if (filterMode.value === 'present') {
    arr = arr.filter(p => checkedMap.value[p.productName]);
  } else if (filterMode.value === 'missing') {
    arr = arr.filter(p => !checkedMap.value[p.productName]);
  }

  // Apply Sort
  if (sortByQty.value) {
    arr.sort((a, b) => (b.quantity || 0) - (a.quantity || 0));
  } else {
    // Default alphabetical sort for consistency
    arr.sort((a,b) => a.productName.localeCompare(b.productName));
  }
  return arr;
});

// Lightbox state
const lightboxOpen = ref(false);
const lightboxSrc = ref(null);
const lightboxTitle = ref('');
const lightboxSubtitle = ref('');

const openLightbox = (product) => {
  if (!product.imageUrl) return;
  lightboxSrc.value = product.imageUrl;
  lightboxTitle.value = toTitleCase(product.productName);
  lightboxSubtitle.value = product.quantity ? `${product.quantity} pcs in stock` : '';
  lightboxOpen.value = true;
};

// Build checkedMap from inSampleRoom flags in stockData
const initCheckedMap = () => {
  const map = {};
  if (!stockData.value) return map;
  stockData.value.forEach(group => {
    if (!group.products) return;
    group.products.forEach(p => {
      if (p.inSampleRoom) map[p.productName] = true;
    });
  });
  checkedMap.value = map;
};

onMounted(async () => {
  if (!stockData.value || stockData.value.length === 0) {
    await loadStockData();
  }
  initCheckedMap();
  loading.value = false;
});

// Re-init if stockData changes (e.g. after a sync)
watch(stockData, () => { initCheckedMap(); }, { deep: false });

// Reset filter mode when group changes
watch(selectedGroup, () => { filterMode.value = 'all'; });

const groups = computed(() => {
  if (!stockData.value) return [];
  return stockData.value
    .filter(g => g.groupName !== '_META_DATA_' && g.products && g.products.length > 0)
    .sort((a, b) => a.groupName.localeCompare(b.groupName));
});

const filteredGroups = computed(() => {
  return groups.value;
});

// Global search: flat list of products across all groups
const globalSearchResults = computed(() => {
  if (!searchQuery.value) return [];
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return [];
  const queryParts = q.split(/\s+/).filter(Boolean);
  const results = [];
  for (const group of groups.value) {
    for (const product of group.products) {
      const name = product.productName.toLowerCase();
      if (queryParts.every(part => name.includes(part))) {
        results.push({ product, groupName: group.groupName });
      }
    }
  }
  return results;
});

const countCheckedInGroup = (group) => {
  if (!group || !group.products) return 0;
  return group.products.filter(p => checkedMap.value[p.productName]).length;
};

const checkedCount = computed(() => {
  if (!selectedGroup.value) return 0;
  return selectedGroup.value.products.filter(p => checkedMap.value[p.productName]).length;
});

const selectGroup = (group) => { 
  selectedGroup.value = group; 
  searchQuery.value = '';
};

const handleBack = () => {
  if (selectedGroup.value) {
    selectedGroup.value = null;
    searchQuery.value = '';
  } else if (searchQuery.value) {
    searchQuery.value = '';
  } else {
    router.push('/');
  }
};

// Persist changes to backend -> stock-data.json
const persistToBackend = async (updates) => {
  try {
    saving.value = true;
    await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/updateSampleRoom`, { updates });
  } catch (err) {
    toast.error('Server not running — changes won\'t be saved', { autoClose: 3000, toastId: 'sr-offline' });
  } finally {
    saving.value = false;
  }
};

const toggleCheck = (name) => {
  const newVal = !checkedMap.value[name];
  checkedMap.value[name] = newVal;
  // Also update the reactive stockData so it stays in sync
  stockData.value.forEach(g => {
    if (!g.products) return;
    g.products.forEach(p => {
      if (p.productName === name) p.inSampleRoom = newVal;
    });
  });
  persistToBackend({ [name]: newVal });
};

const selectAll = () => {
  const updates = {};
  selectedGroup.value.products.forEach(p => {
    // only select filtered items if filtered? 
    // let's select all visible items
    sortedGroupProducts.value.forEach(p => {
      checkedMap.value[p.productName] = true;
      p.inSampleRoom = true;
      updates[p.productName] = true;
    });
  });
  persistToBackend(updates);
};

const selectNone = () => {
  const updates = {};
  sortedGroupProducts.value.forEach(p => {
    checkedMap.value[p.productName] = false;
    p.inSampleRoom = false;
    updates[p.productName] = false;
  });
  persistToBackend(updates);
};

const printPDF = async () => {
  const products = sortedGroupProducts.value.map(p => ({
    productName: p.productName,
    quantity: p.quantity || 0,
    present: !!checkedMap.value[p.productName],
  }));
  await generateSampleRoomPDF(selectedGroup.value.groupName, products);
};

const toTitleCase = (str) => {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};
</script>

<style scoped>
.sr-shell {
  background-color: #f8fafc; /* Slate 50 for lighter base */
  background-image:
    radial-gradient(1200px 800px at 80% -10%, rgba(129, 140, 248, 0.18), transparent 60%),
    radial-gradient(1000px 600px at -10% 40%, rgba(167, 139, 250, 0.12), transparent 50%),
    radial-gradient(800px 500px at 50% 110%, rgba(99, 102, 241, 0.1), transparent 50%);
}
.sr-header-sticky { pointer-events: none; }
.sr-header-sticky > * { pointer-events: auto; }
.sr-header-card {
  border-radius: 1.75rem;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(24px) saturate(1.5);
  -webkit-backdrop-filter: blur(24px) saturate(1.5);
  box-shadow: 0 1px 0 rgba(255,255,255,1) inset, 0 12px 36px -12px rgba(15,23,42,0.15), 0 0 0 1px rgba(226,232,240,0.8);
}
.sr-back-btn {
  background: #fff;
  box-shadow: 0 4px 12px rgba(15,23,42,0.06), 0 0 0 1px rgba(226,232,240,0.8);
}
.sr-back-btn:hover { color: rgb(67 56 202); box-shadow: 0 8px 20px rgba(99,102,241,0.15), 0 0 0 1px rgba(165,180,252,0.5); }
.sr-action-group {
  background: rgba(241, 245, 249, 0.7);
}
.sr-action-btn {
  background: rgba(255,255,255,0.95);
  color: #475569;
  box-shadow: 0 2px 6px rgba(15,23,42,0.04), 0 0 0 1px rgba(226,232,240,0.6);
}
.sr-action-btn:hover { color: rgb(79 70 229); box-shadow: 0 4px 12px rgba(99,102,241,0.1), 0 0 0 1px rgba(165,180,252,0.4); }
.sr-print-btn {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  box-shadow: 0 4px 14px rgba(99,102,241,0.25);
}
.sr-print-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
.sr-state-card {
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 20px 40px -16px rgba(15,23,42,0.1), 0 0 0 1px rgba(255,255,255,0.8);
}
.sr-search {
  background: rgba(255,255,255,0.98);
  box-shadow: 0 4px 16px rgba(15,23,42,0.05), 0 0 0 1px rgba(226,232,240,0.8);
}
.sr-search:focus { box-shadow: 0 8px 24px rgba(99,102,241,0.1), 0 0 0 2px rgba(129,140,248,0.4); }
.sr-search-small {
  background: rgba(255,255,255,0.9);
  box-shadow: 0 2px 8px rgba(15,23,42,0.04), 0 0 0 1px rgba(226,232,240,0.6);
}
.sr-search-small:focus { box-shadow: 0 4px 16px rgba(99,102,241,0.08), 0 0 0 2px rgba(129,140,248,0.4); }
.sr-float-card {
  background: rgba(255,255,255,0.95);
  box-shadow: 0 12px 24px -12px rgba(15,23,42,0.1), 0 0 0 1px rgba(255,255,255,1) inset, 0 1px 0 rgba(15,23,42,0.02);
  border: 1px solid rgba(226,232,240,0.5);
}
.sr-float-card:hover { border-color: rgba(165,180,252,0.4); box-shadow: 0 20px 40px -16px rgba(99,102,241,0.15), 0 0 0 1px rgba(255,255,255,1) inset; }
.sr-check-card {
  background: rgba(255,255,255,0.9);
  box-shadow: 0 4px 12px -6px rgba(15,23,42,0.06), 0 0 0 1px rgba(226,232,240,0.6);
}
.sr-check-active {
  background: rgba(238,242,255,0.7);
  box-shadow: 0 6px 16px -8px rgba(99,102,241,0.15), 0 0 0 1px rgba(165,180,252,0.3);
}
.sr-grid-card {
  background: rgba(255,255,255,0.95);
  box-shadow: 0 4px 12px -6px rgba(15,23,42,0.08), 0 0 0 1px rgba(226,232,240,0.6);
}
.sr-grid-active {
  background: rgba(238,242,255,0.8);
  box-shadow: 0 8px 20px -10px rgba(99,102,241,0.2), 0 0 0 1px rgba(165,180,252,0.4);
}

/* Hide scrollbar for filter chips */
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

/* Animations */
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

@keyframes checkPop { 0% { transform: scale(0.5); opacity: 0; } 50% { transform: scale(1.2); } 100% { transform: scale(1); opacity: 1; } }
.animate-check-pop { animation: checkPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
</style>
