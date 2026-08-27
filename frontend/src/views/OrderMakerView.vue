<template>
  <div class="h-screen h-[100dvh] max-h-[100dvh] flex flex-col bg-[#f8f9fa] relative text-slate-800 antialiased selection:bg-rose-500 selection:text-white overflow-hidden font-sans">
    
    <!-- ═══════════════════════════════════════════════════════════
         1. FIXED TOP 20%: LOCATION, SEARCH, CATEGORIES & FILTERS
         ═══════════════════════════════════════════════════════════ -->
    <div class="flex-shrink-0 bg-white border-b border-slate-200/80 shadow-2xs z-30">
      
      <!-- Row 1: Location & Order Basket -->
      <header class="px-3.5 sm:px-5 py-2 flex items-center justify-between gap-2" style="padding-top: max(env(safe-area-inset-top, 24px), 10px);">
        <div class="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            @click="handleBack"
            class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 flex items-center justify-center transition-all flex-shrink-0 cursor-pointer shadow-2xs"
            title="Back to Home"
          >
            <i class="fa-solid fa-arrow-left text-xs"></i>
          </button>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 cursor-pointer">
              <i class="fa-solid fa-location-dot text-rose-600 text-sm"></i>
              <h1 class="text-xs sm:text-sm font-black text-slate-900 leading-tight truncate flex items-center gap-1">
                <span>Sri Brundabana</span>
                <i class="fa-solid fa-chevron-down text-[10px] text-slate-400"></i>
              </h1>
              <VersionBadge />
            </div>
            <p class="text-[10px] text-slate-400 font-semibold truncate leading-none mt-0.5">
              Rayagada Wholesale Hub • {{ filteredCatalogProducts.length }} Articles
            </p>
          </div>
        </div>

        <!-- Basket Pill (Zomato Cart Style) -->
        <button
          @click="showOrderModal = true"
          class="h-8 px-3 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition-all flex-shrink-0 cursor-pointer"
        >
          <i class="fa-solid fa-bag-shopping text-xs"></i>
          <span>Basket</span>
          <span
            v-if="orderItems.length > 0"
            class="px-1.5 py-0.2 rounded-full bg-white text-rose-700 font-black text-[10px]"
          >
            {{ totalOrderSets }}
          </span>
        </button>
      </header>

      <!-- Row 2: Search Input + Photo Mode Toggle (Zomato Veg-Mode Style) -->
      <div class="px-3.5 py-1.5 flex items-center gap-2.5">
        <div class="flex-1 flex items-center bg-slate-100 rounded-2xl px-3 py-1.5 border border-slate-200/70 shadow-inner">
          <i class="fa-solid fa-magnifying-glass text-rose-500 text-xs mr-2"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder='Search "Cushion, Hawai, Paralite, Sparx..."'
            class="w-full bg-transparent text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none"
          />
          <button v-if="searchQuery" @click="searchQuery = ''" class="text-slate-400 hover:text-slate-600 ml-1">
            <i class="fa-solid fa-xmark text-xs"></i>
          </button>
        </div>

        <div
          @click="photoOnlyMode = !photoOnlyMode"
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl cursor-pointer border select-none transition-all flex-shrink-0 shadow-2xs"
          :class="photoOnlyMode ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400/20' : 'bg-slate-50 border-slate-200'"
        >
          <span class="text-[9px] font-black uppercase tracking-wider" :class="photoOnlyMode ? 'text-emerald-800' : 'text-slate-500'">
            Photos
          </span>
          <div
            class="w-7 h-4 rounded-full relative transition-colors duration-200"
            :class="photoOnlyMode ? 'bg-emerald-500' : 'bg-slate-300'"
          >
            <div
              class="absolute top-[2px] w-3 h-3 rounded-full bg-white shadow-xs transition-all duration-200"
              :class="photoOnlyMode ? 'left-[14px]' : 'left-[2px]'"
            ></div>
          </div>
        </div>
      </div>

      <!-- Row 3: Circular Story Avatars (Zomato Dish Avatars) -->
      <div class="px-3 py-1.5 flex items-center gap-3 overflow-x-auto hide-scrollbar">
        <div
          v-for="cat in categoryList"
          :key="cat.id"
          @click="selectCategory(cat.id)"
          class="flex flex-col items-center flex-shrink-0 cursor-pointer group"
        >
          <div
            class="w-11 h-11 rounded-full p-0.5 border-2 transition-all flex items-center justify-center overflow-hidden bg-slate-50 relative"
            :class="activeCategoryId === cat.id
              ? 'border-rose-500 shadow-xs scale-105 bg-rose-50/50'
              : 'border-slate-200 group-hover:border-slate-300'"
          >
            <img
              v-if="cat.sampleImg"
              :src="cat.sampleImg"
              :alt="cat.label"
              class="w-full h-full object-cover rounded-full"
              loading="lazy"
            />
            <span v-else class="text-lg">{{ cat.icon }}</span>
          </div>

          <span
            class="text-[10px] font-black mt-1 whitespace-nowrap transition-colors"
            :class="activeCategoryId === cat.id ? 'text-rose-600' : 'text-slate-600'"
          >
            {{ cat.label }}
          </span>

          <div
            class="h-0.5 w-6 rounded-full mt-0.5 transition-all"
            :class="activeCategoryId === cat.id ? 'bg-rose-500' : 'bg-transparent'"
          ></div>
        </div>
      </div>

      <!-- Row 4: Quick Filter Chips -->
      <div class="px-3 py-1.5 bg-slate-50 border-t border-slate-200/60 flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
        <button
          @click="activeFilter = (activeFilter === 'core' ? 'all' : 'core')"
          class="px-2.5 py-1 rounded-xl text-[10px] font-black whitespace-nowrap flex items-center gap-1 transition-all flex-shrink-0 border cursor-pointer shadow-2xs"
          :class="activeFilter === 'core'
            ? 'bg-rose-600 text-white border-rose-600'
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'"
        >
          <i class="fa-solid fa-bolt text-[9px]"></i>
          <span>Core Compulsory</span>
        </button>

        <button
          @click="activeFilter = (activeFilter === 'instock' ? 'all' : 'instock')"
          class="px-2.5 py-1 rounded-xl text-[10px] font-black whitespace-nowrap flex items-center gap-1 transition-all flex-shrink-0 border cursor-pointer shadow-2xs"
          :class="activeFilter === 'instock'
            ? 'bg-emerald-600 text-white border-emerald-600'
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'"
        >
          <i class="fa-solid fa-boxes-stacked text-[9px]"></i>
          <span>In Stock (10+ Prs)</span>
        </button>

        <button
          @click="activeFilter = (activeFilter === 'under200' ? 'all' : 'under200')"
          class="px-2.5 py-1 rounded-xl text-[10px] font-black whitespace-nowrap flex items-center gap-1 transition-all flex-shrink-0 border cursor-pointer shadow-2xs"
          :class="activeFilter === 'under200'
            ? 'bg-amber-600 text-white border-amber-600'
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'"
        >
          <i class="fa-solid fa-tag text-[9px]"></i>
          <span>Under ₹200</span>
        </button>

        <span class="text-[10px] text-slate-400 font-bold ml-auto flex-shrink-0">
          {{ currentIndex + 1 }} of {{ filteredCatalogProducts.length }}
        </span>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         2. SCROLLABLE 80%: PRODUCT HERO CARD & SIZE OPTIONS
         ═══════════════════════════════════════════════════════════ -->
    <main class="flex-1 overflow-y-auto min-h-0 p-3 sm:p-4 max-w-md mx-auto w-full custom-scrollbar space-y-3">
      
      <!-- Loading State -->
      <div v-if="stockLoading" class="py-16 flex flex-col items-center justify-center space-y-2">
        <div class="w-8 h-8 rounded-full border-2 border-rose-300 border-t-rose-600 animate-spin"></div>
        <p class="text-xs font-bold text-slate-500">Loading catalog items…</p>
      </div>

      <!-- No Products -->
      <div v-else-if="filteredCatalogProducts.length === 0" class="py-16 flex flex-col items-center justify-center text-center p-4 bg-white rounded-3xl border border-slate-200">
        <i class="fa-solid fa-box-open text-3xl text-slate-300 mb-2"></i>
        <p class="text-xs font-bold text-slate-600">No items match current filters</p>
        <button @click="searchQuery = ''; activeFilter = 'all'; selectCategory('general')" class="mt-3 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs">
          Reset Filters
        </button>
      </div>

      <!-- Category Completed -->
      <div v-else-if="currentIndex >= filteredCatalogProducts.length" class="py-12 flex flex-col items-center justify-center text-center p-6 bg-white rounded-3xl border border-slate-200 space-y-3">
        <div class="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl mx-auto shadow-inner">
          <i class="fa-solid fa-check"></i>
        </div>
        <h3 class="text-sm font-black text-slate-900">All {{ filteredCatalogProducts.length }} items reviewed!</h3>
        <p class="text-xs text-slate-400 font-medium">You can restart this group or review items in your basket.</p>
        <div class="flex items-center gap-2 pt-2">
          <button @click="jumpToPhoto(0)" class="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">
            Restart Group
          </button>
          <button @click="showOrderModal = true" class="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer">
            View Basket ({{ orderItems.length }})
          </button>
        </div>
      </div>

      <!-- Zomato Restaurant-Style Hero Product Card -->
      <div v-else class="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden p-3.5 space-y-3">
        
        <!-- Large Photo Preview Box -->
        <div class="relative w-full h-52 sm:h-64 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden p-2 border border-slate-100 shadow-inner">
          <img
            v-if="currentProduct.imageUrl"
            :src="currentProduct.imageUrl"
            :alt="currentProduct.productName"
            class="w-full h-full object-contain select-none"
            loading="eager"
          />
          <div v-else class="text-slate-300 text-3xl flex flex-col items-center">
            <i class="fa-solid fa-shoe-prints"></i>
            <span class="text-[10px] font-bold text-slate-400 mt-1">No Photo Available</span>
          </div>

          <!-- Top-Left Brand / Group Tag -->
          <div class="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            <span class="px-2.5 py-1 rounded-xl bg-slate-900/85 backdrop-blur-xs text-white text-[9px] font-black uppercase tracking-wider shadow-xs">
              {{ currentProduct.groupName }}
            </span>
            <span v-if="currentProduct.isCompulsory" class="px-2 py-1 rounded-xl bg-rose-600 text-white text-[9px] font-black uppercase shadow-xs">
              ★ Core
            </span>
          </div>

          <!-- Top-Right Rating / Stock Badge (Zomato Style) -->
          <div class="absolute top-2.5 right-2.5">
            <span
              class="px-2.5 py-1 rounded-xl text-[10px] font-black text-white flex items-center gap-1 shadow-xs"
              :class="currentProduct.closingBalance > 0 ? 'bg-emerald-600' : 'bg-slate-700'"
            >
              <i class="fa-solid fa-star text-[9px] text-amber-300"></i>
              <span>{{ currentProduct.closingBalance || currentProduct.quantity || 0 }} Prs In Stock</span>
            </span>
          </div>

          <!-- Bottom Pagination Indicator Dots -->
          <div class="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 bg-black/50 backdrop-blur-xs px-2.5 py-0.5 rounded-full shadow-2xs">
            <span class="text-[10px] font-mono font-black text-white">
              {{ currentIndex + 1 }} / {{ filteredCatalogProducts.length }}
            </span>
          </div>
        </div>

        <!-- Article Title, Rate & Stepper Row -->
        <div class="flex items-start justify-between gap-2 pt-1">
          <div class="min-w-0 flex-1">
            <h2 class="text-sm sm:text-base font-black text-slate-900 truncate leading-snug">
              {{ currentProduct.productName }}
            </h2>
            <div class="flex items-center gap-2 mt-1">
              <span v-if="currentProduct.rate" class="text-sm font-black text-rose-600">
                ₹{{ currentProduct.rate }} / pair
              </span>
              <span class="text-[11px] text-slate-400 font-semibold truncate">
                • Wholesale Best Margin
              </span>
            </div>
          </div>

          <!-- Quantity Stepper -->
          <div class="flex items-center bg-slate-100 rounded-2xl p-1 border border-slate-200/80 flex-shrink-0 shadow-2xs">
            <button
              @click="currentQty = Math.max(1, currentQty - 1)"
              class="w-7 h-7 rounded-xl bg-white text-slate-800 flex items-center justify-center font-black text-sm active:scale-95 shadow-2xs cursor-pointer"
            >-</button>
            <span class="w-9 text-center font-black text-xs text-slate-900">
              {{ currentQty }}
              <span class="text-[8px] font-normal block -mt-1 text-slate-400">Sets</span>
            </span>
            <button
              @click="currentQty++"
              class="w-7 h-7 rounded-xl bg-white text-slate-800 flex items-center justify-center font-black text-sm active:scale-95 shadow-2xs cursor-pointer"
            >+</button>
          </div>
        </div>

        <!-- Customer Requirement / Suggested Sizes Chips -->
        <div v-if="currentProduct.suggestedSizes && currentProduct.suggestedSizes.length > 0" class="p-2.5 bg-amber-50/90 rounded-2xl border border-amber-200 space-y-1.5 shadow-2xs">
          <div class="text-[10px] font-black text-amber-900 uppercase flex items-center justify-between">
            <span>Customer size requirement:</span>
            <span class="text-[9px] font-normal text-amber-700">1-tap pick</span>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="sizeOpt in currentProduct.suggestedSizes"
              :key="sizeOpt"
              type="button"
              @click="appendSuggestedSize(sizeOpt)"
              class="px-2.5 py-1 rounded-xl text-[11px] font-black transition-all active:scale-95 border cursor-pointer"
              :class="currentComment.includes(sizeOpt)
                ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                : 'bg-white text-amber-950 border-amber-300 hover:bg-amber-100'"
            >
              {{ sizeOpt }}
            </button>
          </div>
        </div>

        <!-- Quick Size Shortcut Pills -->
        <div class="space-y-1.5 pt-1">
          <div class="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Quick Sizes</span>
            <button v-if="currentComment" @click="currentComment = ''" class="text-[10px] text-rose-500 font-bold hover:underline cursor-pointer">
              Clear ({{ currentComment }})
            </button>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="size in quickSizes"
              :key="size"
              type="button"
              @click="appendSizeShortcut(size)"
              class="px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all border cursor-pointer active:scale-95"
              :class="currentComment.includes(size) ? 'bg-rose-600 text-white border-rose-600 shadow-2xs' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'"
            >
              {{ size }}
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- ═══════════════════════════════════════════════════════════
         3. FIXED BOTTOM ACTION DOCK: SKIP & ADD & NEXT
         ═══════════════════════════════════════════════════════════ -->
    <footer class="flex-shrink-0 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 p-3 shadow-lg z-30" style="padding-bottom: max(env(safe-area-inset-bottom, 24px), 12px);">
      <div class="grid grid-cols-2 gap-2.5 max-w-md mx-auto w-full">
        <button
          type="button"
          @click="handleSkip"
          class="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-slate-200 transition-all cursor-pointer shadow-2xs"
        >
          <i class="fa-solid fa-forward-step text-xs text-slate-400"></i>
          <span>Skip Article</span>
        </button>

        <button
          type="button"
          @click="handleAddAndNext"
          class="py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white active:scale-95 font-black text-xs sm:text-sm flex items-center justify-center gap-2 border border-rose-700 transition-all shadow-md cursor-pointer"
        >
          <i class="fa-solid fa-plus text-xs"></i>
          <span>Add {{ currentQty }} Set{{ currentQty > 1 ? 's' : '' }} & Next</span>
        </button>
      </div>
    </footer>

    <!-- ═══ ORDER BASKET MODAL (ZOMATO CART STYLE) ═══ -->
    <Transition name="fade">
      <div
        v-if="showOrderModal"
        class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        @click.self="showOrderModal = false"
      >
        <div class="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up">
          <div class="p-3.5 border-b border-slate-100 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-sm font-black">
                🛒
              </div>
              <div>
                <h3 class="text-sm font-black text-slate-900">Your Order Basket</h3>
                <p class="text-[10px] text-slate-400 font-semibold">
                  {{ orderItems.length }} Articles • {{ totalOrderSets }} Total Sets
                </p>
              </div>
            </div>
            <button
              @click="showOrderModal = false"
              class="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
            >
              <i class="fa-solid fa-xmark text-xs"></i>
            </button>
          </div>

          <!-- Customer Input -->
          <div class="p-3 bg-slate-50 border-b border-slate-100 grid grid-cols-2 gap-2">
            <div>
              <label class="text-[9px] font-black text-slate-400 uppercase block mb-0.5">Party / Customer Name</label>
              <input
                v-model="customerName"
                type="text"
                placeholder="Customer Name"
                class="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              />
            </div>
            <div>
              <label class="text-[9px] font-black text-slate-400 uppercase block mb-0.5">WhatsApp / Phone</label>
              <input
                v-model="customerPhone"
                type="tel"
                placeholder="e.g. 9876543210"
                class="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              />
            </div>
          </div>

          <!-- Items List -->
          <div class="flex-1 overflow-y-auto p-3 divide-y divide-slate-100">
            <div v-if="orderItems.length === 0" class="py-8 text-center text-slate-400 text-xs font-bold">
              Your order basket is currently empty.
            </div>

            <div
              v-for="(item, idx) in orderItems"
              :key="idx"
              class="py-2.5 flex items-center justify-between gap-2.5 text-xs"
            >
              <div class="w-10 h-10 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                <img v-if="item.product.imageUrl" :src="item.product.imageUrl" class="w-full h-full object-contain" />
                <i v-else class="fa-solid fa-shoe-prints text-slate-300 text-[10px]"></i>
              </div>

              <div class="flex-1 min-w-0">
                <h4 class="font-bold text-slate-900 text-xs truncate">{{ item.product.productName }}</h4>
                <div v-if="item.comment" class="text-[10px] text-amber-800 font-semibold truncate">
                  💬 {{ item.comment }}
                </div>
              </div>

              <div class="flex items-center gap-1.5 flex-shrink-0">
                <div class="flex items-center bg-slate-100 rounded-xl p-0.5">
                  <button @click="updateOrderItemQty(idx, -1)" class="w-5 h-5 rounded-lg bg-white flex items-center justify-center font-bold text-xs cursor-pointer">-</button>
                  <span class="w-5 text-center font-bold text-xs">{{ item.quantity }}</span>
                  <button @click="updateOrderItemQty(idx, 1)" class="w-5 h-5 rounded-lg bg-white flex items-center justify-center font-bold text-xs cursor-pointer">+</button>
                </div>
                <button
                  @click="removeOrderItem(idx)"
                  class="w-6 h-6 text-rose-500 hover:bg-rose-50 rounded-lg flex items-center justify-center cursor-pointer"
                >
                  <i class="fa-solid fa-trash-can text-[10px]"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              v-if="orderItems.length > 0"
              @click="clearAllOrderItems"
              class="px-2.5 py-1.5 text-rose-600 font-bold text-xs hover:underline cursor-pointer"
            >
              Clear
            </button>

            <div class="flex items-center gap-2 ml-auto">
              <button
                @click="handleExportPDF"
                :disabled="orderItems.length === 0 || isExporting"
                class="px-3 py-2 rounded-2xl bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-bold text-xs flex items-center gap-1 disabled:opacity-40 cursor-pointer"
              >
                <i class="fa-solid fa-file-pdf text-rose-400 text-xs"></i>
                <span>PDF</span>
              </button>

              <button
                @click="handleExportWhatsApp"
                :disabled="orderItems.length === 0 || isExporting"
                class="px-3.5 py-2 rounded-2xl bg-[#25D366] hover:bg-[#128C7E] active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-40 cursor-pointer"
              >
                <i class="fa-brands fa-whatsapp text-sm"></i>
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStockData } from '../composables/useStockData';
import { BRAND_LISTS } from '../utils/constants';
import { generateOrderPDF } from '../utils/pdfGenerator';
import VersionBadge from '../components/VersionBadge.vue';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { toast } from 'vue3-toastify';

const router = useRouter();
const { stockData, loadStockData, loading: stockLoading } = useStockData(ref(false));

const searchQuery = ref('');
const photoOnlyMode = ref(true);
const activeFilter = ref('all');

const categoryList = [
  { id: 'general', label: 'All', icon: '✨', sampleImg: 'https://res.cloudinary.com/dg365ewal/image/upload/v1773125726/CUSHION_NEW.jpg', brands: [] },
  { id: 'hawai', label: 'Hawai', icon: '🩴', sampleImg: 'https://res.cloudinary.com/dg365ewal/image/upload/v1773125726/CUSHION_NEW.jpg', brands: ['Hawai Chappal', 'CUSHION'] },
  { id: 'paragon_gents', label: 'Paragon Gents', icon: '👞', sampleImg: 'https://res.cloudinary.com/dg365ewal/image/upload/v1770909765/1251_BKR.jpg', brands: ['Max', 'PARAGON GENTS', 'Escoute'] },
  { id: 'paragon_ladies', label: 'Paragon Ladies', icon: '👠', sampleImg: 'https://res.cloudinary.com/dg365ewal/image/upload/v1770548064/16048_MIG.jpg', brands: ['PARAGON LADIES'] },
  { id: 'paralite', label: 'Paralite', icon: '🔶', sampleImg: 'https://res.cloudinary.com/dg365ewal/image/upload/v1770919216/16048_BLK.jpg', brands: ['PARALITE'] },
  { id: 'eeken', label: 'Eeken', icon: '🏃', sampleImg: '', brands: ['EEKEN'] },
  { id: 'cubix', label: 'Cubix', icon: '👟', sampleImg: '', brands: ['CUBIX', 'CUBIX 2'] },
  { id: 'florex', label: 'Florex', icon: '🌸', sampleImg: '', brands: ['Florex (Swastik)'] },
  { id: 'action', label: 'Action', icon: '⚡', sampleImg: '', brands: ['ACTION'] },
  { id: 'reliance', label: 'Reliance', icon: '🔷', sampleImg: '', brands: ['RELIANCE FOOTWEAR'] },
  { id: 'ajanta', label: 'Ajanta', icon: '👡', sampleImg: '', brands: ['AJANTA'] },
  { id: 'box_packing', label: 'Box Packing', icon: '📥', sampleImg: '', brands: [...BRAND_LISTS.generalBoxPacking] },
  { id: 'loose_packing', label: 'Loose Packing', icon: '📦', sampleImg: '', brands: [...BRAND_LISTS.generalLoosePacking] },
  { id: 'ptos', label: 'P-Toes', icon: '🟠', sampleImg: '', brands: ['P-TOES'] },
  { id: 'socks', label: 'Socks', icon: '🧦', sampleImg: '', brands: ['Barun', 'Pareek Soucks', 'LEO'] }
];

const activeCategoryId = ref('general');
const activeCategoryObj = computed(() => {
  return categoryList.find(c => c.id === activeCategoryId.value) || categoryList[0];
});

// Hardcoded Compulsory Core Articles for General
const COMPULSORY_CORE_ITEMS = [
  {
    matchKey: 'cushion',
    productName: 'CUSHION HAWAI (ALL SIZES)',
    groupName: 'Hawai Chappal',
    imageUrl: 'https://res.cloudinary.com/dg365ewal/image/upload/v1773125726/CUSHION_NEW.jpg',
    rate: 133,
    suggestedSizes: ['6 to 9 (6x9)', '4 to 5 (4x5)', '5 to 10 (5x10)', '1 to 3 (1x3)', '9 to 13 (9x13)'],
    isCompulsory: true
  },
  {
    matchKey: '1251',
    productName: 'PARALITE 1251 GENTS BKR',
    groupName: 'PARALITE',
    imageUrl: 'https://res.cloudinary.com/dg365ewal/image/upload/v1770909765/1251_BKR.jpg',
    rate: 245,
    suggestedSizes: ['6 to 10 (6x10)', '7 to 10 (7x10)', '6 to 9 (6x9)'],
    isCompulsory: true
  },
  {
    matchKey: '16048_blk',
    productName: 'PARALITE 16048 GENTS BLACK',
    groupName: 'PARALITE',
    imageUrl: 'https://res.cloudinary.com/dg365ewal/image/upload/v1770919216/16048_BLK.jpg',
    rate: 299.5,
    suggestedSizes: ['6 to 9 (6x9)', '6 to 10 (6x10)', '7 to 10 (7x10)', '2 to 5 (2x5)'],
    isCompulsory: true
  },
  {
    matchKey: '16048_mig',
    productName: 'PARALITE 16048 GENTS GREEN (MIG)',
    groupName: 'PARALITE',
    imageUrl: 'https://res.cloudinary.com/dg365ewal/image/upload/v1770548064/16048_MIG.jpg',
    rate: 335,
    suggestedSizes: ['6 to 10 (6x10)', '6 to 9 (6x9)', '7 to 10 (7x10)', '2 to 5 (2x5)'],
    isCompulsory: true
  },
  {
    matchKey: '16048_blu',
    productName: 'PARALITE 16048 GENTS BLUE',
    groupName: 'PARALITE',
    imageUrl: 'https://res.cloudinary.com/dg365ewal/image/upload/v1770919216/16048_BLK.jpg',
    rate: 335,
    suggestedSizes: ['6 to 9 (6x9)', '6 to 10 (6x10)', '7 to 10 (7x10)', '2 to 5 (2x5)'],
    isCompulsory: true
  },
  {
    matchKey: '16049',
    productName: 'PARALITE 16049 GENTS',
    groupName: 'PARALITE',
    imageUrl: 'https://res.cloudinary.com/dg365ewal/image/upload/v1770919172/16049_BLK.jpg',
    rate: 299.5,
    suggestedSizes: ['6 to 9 (6x9)', '6 to 10 (6x10)', '2 to 5 (2x5)'],
    isCompulsory: true
  }
];

const allCatalogProducts = computed(() => {
  if (!stockData.value || !Array.isArray(stockData.value)) return [];
  const list = [];
  stockData.value.forEach(group => {
    if (group.groupName === '_META_DATA_' || !group.products) return;
    group.products.forEach(p => {
      list.push({
        ...p,
        groupName: group.groupName
      });
    });
  });
  return list;
});

const currentCategoryProducts = computed(() => {
  const cat = activeCategoryObj.value;
  const list = allCatalogProducts.value;

  if (cat.id === 'general') {
    const enrichedCompulsory = COMPULSORY_CORE_ITEMS.map(c => {
      const live = list.find(p => p.productName && p.productName.toLowerCase().includes(c.matchKey));
      return {
        ...c,
        closingBalance: live ? (live.closingBalance || live.quantity || 0) : 0,
        rate: (live && live.rate) ? live.rate : c.rate
      };
    });

    const otherItems = list.filter(p => {
      if (!p.imageUrl || p.imageUrl.trim().length === 0) return false;
      const n = (p.productName || '').toLowerCase();
      return !n.includes('cushion') && !n.includes('1251') && !n.includes('16048') && !n.includes('16049');
    });

    return [...enrichedCompulsory, ...otherItems];
  }

  const allowedBrandsSet = new Set(cat.brands.map(b => b.toLowerCase().trim()));
  return list.filter(p => {
    const gName = (p.groupName || '').toLowerCase().trim();
    return allowedBrandsSet.has(gName) && p.imageUrl && p.imageUrl.trim().length > 0;
  });
});

const filteredCatalogProducts = computed(() => {
  let list = currentCategoryProducts.value;

  // 1. Photo Only Filter
  if (photoOnlyMode.value) {
    list = list.filter(p => p.imageUrl && p.imageUrl.trim().length > 0);
  }

  // 2. Search Query Filter
  if (searchQuery.value && searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter(p =>
      (p.productName && p.productName.toLowerCase().includes(q)) ||
      (p.groupName && p.groupName.toLowerCase().includes(q))
    );
  }

  // 3. Quick Filter Chips
  if (activeFilter.value === 'core') {
    list = list.filter(p => p.isCompulsory);
  } else if (activeFilter.value === 'instock') {
    list = list.filter(p => (p.closingBalance || p.quantity || 0) >= 10);
  } else if (activeFilter.value === 'under200') {
    list = list.filter(p => p.rate && p.rate <= 200);
  }

  return list;
});

// Card State
const currentIndex = ref(0);
const currentQty = ref(1);
const currentComment = ref('');

const currentProduct = computed(() => {
  return filteredCatalogProducts.value[currentIndex.value] || {};
});

const selectCategory = (id) => {
  activeCategoryId.value = id;
  currentIndex.value = 0;
  resetCardInputs();
};

const resetCardInputs = () => {
  currentQty.value = 1;
  currentComment.value = '';
};

const jumpToPhoto = (idx) => {
  if (idx >= 0 && idx < filteredCatalogProducts.value.length) {
    currentIndex.value = idx;
    resetCardInputs();
  }
};

const quickSizes = ['4x8', '5x9', '5x10', '6x9', '6x10', '7x10', '9x10', '11x13', '1x3', '4x7'];

const appendSuggestedSize = (sizeOption) => {
  const snippet = `Size: ${sizeOption}`;
  if (currentComment.value.includes(snippet) || currentComment.value.includes(sizeOption)) return;
  if (currentComment.value.trim().length > 0) {
    currentComment.value += `, ${snippet}`;
  } else {
    currentComment.value = snippet;
  }
};

const appendSizeShortcut = (size) => {
  if (currentComment.value.trim().length > 0) {
    currentComment.value += `, ${size}`;
  } else {
    currentComment.value = `Size: ${size}`;
  }
};

// Basket & Ordering
const orderItems = ref([]);
const showOrderModal = ref(false);
const customerName = ref('');
const customerPhone = ref('');
const isExporting = ref(false);

const totalOrderSets = computed(() => {
  return orderItems.value.reduce((sum, item) => sum + item.quantity, 0);
});

const handleSkip = () => {
  if (currentIndex.value < filteredCatalogProducts.value.length) {
    currentIndex.value++;
    resetCardInputs();
  }
};

const handleAddAndNext = () => {
  const prod = currentProduct.value;
  if (!prod || !prod.productName) return;

  const existingIdx = orderItems.value.findIndex(i => i.product.productName === prod.productName);

  if (existingIdx !== -1) {
    orderItems.value[existingIdx].quantity += currentQty.value;
    if (currentComment.value.trim()) {
      orderItems.value[existingIdx].comment = (orderItems.value[existingIdx].comment ? orderItems.value[existingIdx].comment + '; ' : '') + currentComment.value.trim();
    }
  } else {
    orderItems.value.push({
      product: prod,
      quantity: currentQty.value,
      comment: currentComment.value.trim()
    });
  }

  toast.success(`Added ${prod.productName} (${currentQty.value} Set${currentQty.value > 1 ? 's' : ''})`, { autoClose: 1000 });

  currentIndex.value++;
  resetCardInputs();
};

const updateOrderItemQty = (idx, diff) => {
  if (idx < 0 || idx >= orderItems.value.length) return;
  const item = orderItems.value[idx];
  const newQty = item.quantity + diff;
  if (newQty <= 0) {
    orderItems.value.splice(idx, 1);
  } else {
    item.quantity = newQty;
  }
};

const removeOrderItem = (idx) => {
  if (idx >= 0 && idx < orderItems.value.length) {
    orderItems.value.splice(idx, 1);
  }
};

const clearAllOrderItems = () => {
  if (confirm('Clear all items from your order basket?')) {
    orderItems.value = [];
  }
};

// WhatsApp & PDF Export
const handleExportWhatsApp = async () => {
  if (orderItems.value.length === 0) return;

  const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const partyName = customerName.value.trim() || 'Valued Customer';
  const partyPhone = customerPhone.value.trim();

  let message = `*Purchase Order — Sri Brundabana Enterprises*\n`;
  message += `Customer: *${partyName}*${partyPhone ? ` (${partyPhone})` : ''}\n`;
  message += `Date: ${date}\n`;
  message += `------------------------------------\n\n`;

  orderItems.value.forEach((item, index) => {
    const qtyLabel = item.quantity > 1 ? 'Sets' : 'Set';
    message += `${index + 1}. *${item.product.productName}*\n`;
    message += `   • Quantity: *${item.quantity} ${qtyLabel}*\n`;
    if (item.comment && item.comment.trim()) {
      message += `   • Requirement: _${item.comment.trim()}_\n`;
    }
    message += `\n`;
  });

  message += `------------------------------------\n`;
  message += `*Total Items:* ${totalOrderSets.value} Sets (${orderItems.value.length} Articles)\n\n`;
  message += `✨ _Thank you for placing your order with Sri Brundabana Enterprises!_`;

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(message);
    }
  } catch (e) {}

  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
  toast.success('Order copied & WhatsApp opened!', { autoClose: 3000 });
};

const handleExportPDF = async () => {
  if (orderItems.value.length === 0) return;

  try {
    isExporting.value = true;
    const name = customerName.value.trim() || 'General Customer';
    const phone = customerPhone.value.trim() || '-';

    const pdfBase64 = await generateOrderPDF(orderItems.value, {
      name,
      phone,
      returnBase64: true
    });

    if (Capacitor.isNativePlatform() || Capacitor.getPlatform() === 'android') {
      const base64Data = pdfBase64.split(',')[1] || pdfBase64;
      const fileName = `Order_${name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache
      });

      await Share.share({
        title: `Purchase Order - ${name}`,
        files: [savedFile.uri]
      });

      toast.success('Order PDF generated & ready to share!', { autoClose: 3000 });
    } else {
      await generateOrderPDF(orderItems.value, { name, phone });
      toast.success('Order PDF downloaded successfully!', { autoClose: 3000 });
    }
  } catch (err) {
    console.error('PDF generation error:', err);
    toast.error('Failed to generate PDF.');
  } finally {
    isExporting.value = false;
  }
};

const handleBack = () => {
  router.push('/home');
};

onMounted(async () => {
  if (!stockData.value || stockData.value.length === 0) {
    await loadStockData();
  }
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

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.animate-slide-up {
  animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
