<template>
  <div class="h-screen h-[100dvh] max-h-[100dvh] flex flex-col bg-slate-50 relative text-slate-800 antialiased selection:bg-violet-500 selection:text-white overflow-hidden">
    <!-- Ambient Subtle Background -->
    <div class="fixed inset-0 pointer-events-none -z-10" style="background: radial-gradient(circle at 90% 10%, rgba(139, 92, 246, 0.08) 0%, transparent 40%), radial-gradient(circle at 10% 90%, rgba(244, 63, 94, 0.06) 0%, transparent 40%), #f8fafc;"></div>

    <!-- ═══ 1. COMPACT TOP HEADER ═══ -->
    <header class="az-topbar flex-shrink-0 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 px-3 sm:px-5 py-2 flex items-center justify-between gap-2 shadow-2xs" style="padding-top: max(env(safe-area-inset-top, 24px), 12px);">
      <!-- Left: Back Button & Title -->
      <div class="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          @click="handleBack"
          class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all flex-shrink-0 cursor-pointer"
          title="Back to Home"
        >
          <i class="fa-solid fa-arrow-left text-xs"></i>
        </button>
        <div class="min-w-0">
          <div class="flex items-center gap-1.5">
            <h1 class="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-none truncate">
              Order Maker
            </h1>
            <VersionBadge />
          </div>
          <p class="text-[10px] text-slate-400 font-semibold truncate">
            {{ activeCategoryObj.label }} • {{ currentIndex + 1 }}/{{ currentCategoryProducts.length }}
          </p>
        </div>
      </div>

      <!-- Right: Order Basket Button -->
      <button
        @click="showOrderModal = true"
        class="h-8 px-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 active:scale-95 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition-all flex-shrink-0 cursor-pointer"
      >
        <i class="fa-solid fa-bag-shopping text-xs"></i>
        <span class="hidden xs:inline">Basket</span>
        <span
          v-if="orderItems.length > 0"
          class="px-1.5 py-0.2 rounded-full bg-white text-violet-700 font-black text-[10px]"
        >
          {{ totalOrderSets }}
        </span>
      </button>
    </header>

    <!-- ═══ 2. COMPACT BRAND / CATEGORY TABS ═══ -->
    <div class="flex-shrink-0 px-3 py-1.5 bg-white border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
      <button
        v-for="cat in categoryList"
        :key="cat.id"
        @click="selectCategory(cat.id)"
        class="px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap flex items-center gap-1 transition-all flex-shrink-0 border cursor-pointer"
        :class="activeCategoryId === cat.id
          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
          : 'bg-slate-50 text-slate-600 border-slate-200/70 hover:bg-slate-100'"
      >
        <span>{{ cat.icon }}</span>
        <span>{{ cat.label }}</span>
      </button>
    </div>

    <!-- ═══ 3. COMPACT FILMSTRIP PREVIEW BUBBLE TRAIL ═══ -->
    <div v-if="currentCategoryProducts.length > 0" class="flex-shrink-0 px-3 py-1 bg-slate-100/60 border-b border-slate-200/60 flex items-center gap-1.5 overflow-x-auto hide-scrollbar scroll-smooth" ref="bubbleTrailContainer">
      <button
        v-for="(prod, idx) in currentCategoryProducts"
        :key="idx"
        :ref="el => setBubbleRef(el, idx)"
        type="button"
        @click="jumpToPhoto(idx)"
        class="relative w-10 h-10 rounded-xl flex-shrink-0 bg-white border transition-all duration-150 overflow-hidden flex items-center justify-center p-0.5 cursor-pointer"
        :class="idx === currentIndex
          ? 'scale-105 border-violet-600 ring-2 ring-violet-500 shadow-xs z-10'
          : idx < currentIndex
            ? 'opacity-60 border-slate-200 bg-slate-50'
            : 'opacity-80 border-slate-200 hover:opacity-100'"
        :title="prod.productName"
      >
        <img
          v-if="prod.imageUrl"
          :src="prod.imageUrl"
          class="w-full h-full object-contain pointer-events-none"
          loading="lazy"
        />
        <i v-else class="fa-solid fa-shoe-prints text-slate-300 text-[10px]"></i>

        <!-- Checkmark Badge if added -->
        <div
          v-if="isProductInCart(prod.productName)"
          class="absolute top-0 right-0 w-3 h-3 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[7px] font-black"
        >
          ✓
        </div>
      </button>
    </div>

    <!-- ═══ 4. MAIN PRODUCT DISPLAY (Flex-1 Fits Exactly in Viewport) ═══ -->
    <main class="flex-1 min-h-0 flex flex-col justify-between p-2.5 sm:p-3 max-w-md mx-auto w-full">
      <!-- Loading State -->
      <div v-if="stockLoading" class="flex-1 flex flex-col items-center justify-center space-y-2">
        <div class="w-8 h-8 rounded-full border-2 border-violet-300 border-t-violet-600 animate-spin"></div>
        <p class="text-xs font-bold text-slate-500">Loading catalog items…</p>
      </div>

      <!-- No Products -->
      <div v-else-if="currentCategoryProducts.length === 0" class="flex-1 flex flex-col items-center justify-center text-center p-4">
        <i class="fa-solid fa-box-open text-3xl text-slate-300 mb-2"></i>
        <p class="text-xs font-bold text-slate-600">No items available in {{ activeCategoryObj.label }}</p>
        <button @click="selectCategory('general')" class="mt-2 px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer">
          Switch to General
        </button>
      </div>

      <!-- Category Completed -->
      <div v-else-if="currentIndex >= currentCategoryProducts.length" class="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-3">
        <div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl mx-auto">
          <i class="fa-solid fa-check"></i>
        </div>
        <h3 class="text-sm font-black text-slate-900">All {{ currentCategoryProducts.length }} items reviewed!</h3>
        <div class="flex items-center gap-2">
          <button @click="jumpToPhoto(0)" class="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">
            Restart
          </button>
          <button @click="showOrderModal = true" class="px-3 py-1.5 bg-violet-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer">
            View Order ({{ orderItems.length }})
          </button>
        </div>
      </div>

      <!-- Active Article Card -->
      <div v-else class="flex-1 min-h-0 flex flex-col justify-between bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden p-2.5 sm:p-3 space-y-2">
        <!-- Big Photo Box (Flex Shrinks/Grows Responsively) -->
        <div class="relative flex-1 min-h-[140px] max-h-[260px] w-full bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden p-1">
          <img
            v-if="currentProduct.imageUrl"
            :src="currentProduct.imageUrl"
            :alt="currentProduct.productName"
            class="w-full h-full object-contain select-none"
            loading="eager"
          />
          <div v-else class="text-slate-300 text-3xl flex flex-col items-center">
            <i class="fa-solid fa-shoe-prints"></i>
            <span class="text-[10px] font-bold text-slate-400 mt-1">No Photo</span>
          </div>

          <!-- Badges: Group & Stock -->
          <div class="absolute top-1.5 left-1.5 flex items-center gap-1">
            <span class="px-2 py-0.5 rounded-md bg-slate-900/80 text-white text-[9px] font-black uppercase">
              {{ currentProduct.groupName }}
            </span>
            <span v-if="currentProduct.isCompulsory" class="px-1.5 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-black">
              ★ Core
            </span>
          </div>

          <div class="absolute top-1.5 right-1.5">
            <span
              class="px-2 py-0.5 rounded-md text-[9px] font-black text-white"
              :class="currentProduct.closingBalance > 0 ? 'bg-emerald-600' : 'bg-slate-600'"
            >
              {{ currentProduct.closingBalance || currentProduct.quantity || 0 }} prs
            </span>
          </div>
        </div>

        <!-- Article Title & Qty Stepper Row -->
        <div class="flex items-center justify-between gap-2">
          <div class="min-w-0 flex-1">
            <h2 class="text-xs sm:text-sm font-black text-slate-900 truncate">
              {{ currentProduct.productName }}
            </h2>
            <p v-if="currentProduct.rate" class="text-[11px] font-black text-violet-700">
              ₹{{ currentProduct.rate }}
            </p>
          </div>

          <!-- Quantity Stepper -->
          <div class="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200/80 flex-shrink-0">
            <button
              @click="currentQty = Math.max(1, currentQty - 1)"
              class="w-6 h-6 rounded-lg bg-white text-slate-700 flex items-center justify-center font-bold text-xs active:scale-95 shadow-2xs cursor-pointer"
            >-</button>
            <span class="w-8 text-center font-black text-xs text-slate-900">{{ currentQty }} <span class="text-[8px] font-normal block -mt-1">Sets</span></span>
            <button
              @click="currentQty++"
              class="w-6 h-6 rounded-lg bg-white text-slate-700 flex items-center justify-center font-bold text-xs active:scale-95 shadow-2xs cursor-pointer"
            >+</button>
          </div>
        </div>

        <!-- ═══ DIRECT 1-TAP SIZE PROMPT (For Cushion & Compulsory Articles) ═══ -->
        <div v-if="currentProduct.suggestedSizes && currentProduct.suggestedSizes.length > 0" class="p-1.5 bg-amber-50/80 rounded-xl border border-amber-200/70 space-y-1">
          <div class="text-[10px] font-black text-amber-900 uppercase flex items-center justify-between">
            <span>Customer size requirement:</span>
            <span class="text-[9px] font-normal text-amber-700">1-tap pick</span>
          </div>
          <div class="flex flex-wrap gap-1">
            <button
              v-for="sizeOpt in currentProduct.suggestedSizes"
              :key="sizeOpt"
              type="button"
              @click="appendSuggestedSize(sizeOpt)"
              class="px-2 py-0.5 rounded-lg text-[11px] font-black transition-all active:scale-95 border cursor-pointer"
              :class="currentComment.includes(sizeOpt)
                ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                : 'bg-white text-amber-950 border-amber-300 hover:bg-amber-100'"
            >
              {{ sizeOpt }}
            </button>
          </div>
        </div>

        <!-- ═══ GENERAL QUICK SIZE SHORTCUTS PILLS ═══ -->
        <div class="space-y-1">
          <div class="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Quick Sizes</span>
            <button v-if="currentComment" @click="currentComment = ''" class="text-[9px] text-rose-500 font-bold hover:underline cursor-pointer">
              Clear ({{ currentComment }})
            </button>
          </div>
          <div class="flex flex-wrap gap-1">
            <button
              v-for="size in quickSizes"
              :key="size"
              type="button"
              @click="appendSizeShortcut(size)"
              class="px-2 py-0.5 rounded-md text-[10px] font-bold transition-all border cursor-pointer active:scale-95"
              :class="currentComment.includes(size) ? 'bg-violet-600 text-white border-violet-600' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'"
            >
              {{ size }}
            </button>
          </div>
        </div>

        <!-- ═══ 5. SKIP (RED) & ADD & NEXT (GREEN) ACTION BUTTONS (ALWAYS VISIBLE) ═══ -->
        <div class="grid grid-cols-2 gap-2 pt-1 flex-shrink-0">
          <button
            type="button"
            @click="handleSkip"
            class="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 active:scale-95 font-black text-xs flex items-center justify-center gap-1.5 border border-rose-200 transition-all cursor-pointer"
          >
            <i class="fa-solid fa-xmark text-sm text-rose-600"></i>
            <span>Skip</span>
          </button>

          <button
            type="button"
            @click="handleAddAndNext"
            class="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 font-black text-xs flex items-center justify-center gap-1.5 border border-emerald-700 transition-all shadow-xs cursor-pointer"
          >
            <i class="fa-solid fa-check text-sm"></i>
            <span>Add & Next</span>
          </button>
        </div>
      </div>
    </main>

    <!-- ═══ ORDER SUMMARY DRAWER ═══ -->
    <Transition name="fade">
      <div
        v-if="showOrderModal"
        class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        @click.self="showOrderModal = false"
      >
        <div class="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up">
          <div class="p-3.5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 class="text-sm font-black text-slate-900">Current Order Basket</h3>
              <p class="text-[10px] text-slate-400 font-semibold">
                {{ orderItems.length }} Articles • {{ totalOrderSets }} Total Sets
              </p>
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
                class="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
              />
            </div>
            <div>
              <label class="text-[9px] font-black text-slate-400 uppercase block mb-0.5">WhatsApp / Phone</label>
              <input
                v-model="customerPhone"
                type="tel"
                placeholder="e.g. 9876543210"
                class="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
              />
            </div>
          </div>

          <!-- Items Table -->
          <div class="flex-1 overflow-y-auto p-3 divide-y divide-slate-100">
            <div v-if="orderItems.length === 0" class="py-8 text-center text-slate-400 text-xs font-bold">
              Your order basket is currently empty.
            </div>

            <div
              v-for="(item, idx) in orderItems"
              :key="idx"
              class="py-2.5 flex items-center justify-between gap-2.5 text-xs"
            >
              <div class="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
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
                <div class="flex items-center bg-slate-100 rounded-lg p-0.5">
                  <button @click="updateOrderItemQty(idx, -1)" class="w-5 h-5 rounded bg-white flex items-center justify-center font-bold text-xs cursor-pointer">-</button>
                  <span class="w-5 text-center font-bold text-xs">{{ item.quantity }}</span>
                  <button @click="updateOrderItemQty(idx, 1)" class="w-5 h-5 rounded bg-white flex items-center justify-center font-bold text-xs cursor-pointer">+</button>
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
                class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-bold text-xs flex items-center gap-1 disabled:opacity-40 cursor-pointer"
              >
                <i class="fa-solid fa-file-pdf text-rose-400 text-xs"></i>
                <span>PDF</span>
              </button>

              <button
                @click="handleExportWhatsApp"
                :disabled="orderItems.length === 0 || isExporting"
                class="px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#128C7E] active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-40 cursor-pointer"
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
import { ref, computed, onMounted, watch, nextTick } from 'vue';
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

const categoryList = [
  { id: 'general', label: 'General', icon: '✨', brands: [] },
  { id: 'paragon_gents', label: 'Paragon Gents', icon: '👞', brands: ['Max', 'PARAGON GENTS', 'Escoute'] },
  { id: 'paragon_ladies', label: 'Paragon Ladies', icon: '👠', brands: ['PARAGON LADIES'] },
  { id: 'eeken', label: 'Eeken', icon: '🏃', brands: ['EEKEN'] },
  { id: 'cubix', label: 'Cubix', icon: '👟', brands: ['CUBIX', 'CUBIX 2'] },
  { id: 'florex', label: 'Florex', icon: '🌸', brands: ['Florex (Swastik)'] },
  { id: 'action', label: 'Action', icon: '⚡', brands: ['ACTION'] },
  { id: 'reliance', label: 'Reliance', icon: '🔷', brands: ['RELIANCE FOOTWEAR'] },
  { id: 'ajanta', label: 'Ajanta', icon: '👡', brands: ['AJANTA'] },
  { id: 'box_packing', label: 'General Box Packing', icon: '📥', brands: [...BRAND_LISTS.generalBoxPacking] },
  { id: 'loose_packing', label: 'General Loose Packing', icon: '📦', brands: [...BRAND_LISTS.generalLoosePacking] },
  { id: 'ptos', label: 'P-Toes', icon: '🟠', brands: ['P-TOES'] },
  { id: 'paralite', label: 'Paralite', icon: '🔶', brands: ['PARALITE'] },
  { id: 'ladies_40', label: 'Paragon Ladies 40%', icon: '🏷️', brands: ['SOLEA DISC 40% OFFER'] },
  { id: 'gents_40', label: 'Paragon Gents 40%', icon: '🏷️', brands: ['PARAGON GENTS 40%'] },
  { id: 'socks', label: 'Socks', icon: '🧦', brands: ['Barun', 'Pareek Soucks', 'LEO'] }
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

// Card State
const currentIndex = ref(0);
const currentQty = ref(1);
const currentComment = ref('');
const bubbleTrailContainer = ref(null);
const bubbleElements = ref({});

const setBubbleRef = (el, idx) => {
  if (el) bubbleElements.value[idx] = el;
};

const currentProduct = computed(() => {
  return currentCategoryProducts.value[currentIndex.value] || {};
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
  if (idx >= 0 && idx < currentCategoryProducts.value.length) {
    currentIndex.value = idx;
    resetCardInputs();
  }
};

watch(currentIndex, async (newIdx) => {
  await nextTick();
  const el = bubbleElements.value[newIdx];
  if (el && el.scrollIntoView) {
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
});

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

const isProductInCart = (productName) => {
  if (!productName) return false;
  return orderItems.value.some(i => i.product.productName === productName);
};

const handleSkip = () => {
  if (currentIndex.value < currentCategoryProducts.value.length) {
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
