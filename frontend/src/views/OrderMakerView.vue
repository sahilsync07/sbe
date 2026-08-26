<template>
  <div class="min-h-screen bg-slate-50 relative pb-28 text-slate-800 antialiased selection:bg-violet-500 selection:text-white">
    <!-- Ambient Glow Orbs -->
    <div class="fixed top-0 left-0 w-96 h-96 bg-gradient-to-tr from-violet-200/30 to-indigo-400/20 rounded-full blur-[90px] -z-10 pointer-events-none mix-blend-multiply opacity-75"></div>
    <div class="fixed top-48 right-0 w-[450px] h-[450px] bg-gradient-to-bl from-rose-200/25 to-amber-300/20 rounded-full blur-[100px] -z-10 pointer-events-none mix-blend-multiply opacity-65"></div>

    <!-- ═══ TOP BAR (Sticky Safe Area) ═══ -->
    <header class="az-topbar sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-xs px-4 sm:px-6 transition-all" style="padding-top: max(env(safe-area-inset-top, 32px), 24px); padding-bottom: 12px;">
      <div class="max-w-4xl mx-auto flex items-center justify-between gap-3">
        <!-- Left: Back Button & Title -->
        <div class="flex items-center gap-3 min-w-0">
          <button
            type="button"
            @click="handleBack"
            class="w-10 h-10 rounded-2xl bg-slate-100/90 hover:bg-slate-200/90 active:scale-95 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all shadow-xs flex-shrink-0"
            title="Back"
          >
            <i class="fa-solid fa-arrow-left text-sm"></i>
          </button>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h1 class="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none truncate">
                Order Maker
              </h1>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-100 text-violet-800">
                Rapid Mode
              </span>
            </div>
            <p class="text-[11px] text-slate-400 font-semibold truncate mt-0.5">
              {{ activeCategoryObj.label }} • {{ currentCategoryProducts.length }} Articles Available
            </p>
          </div>
        </div>

        <!-- Right: Order Basket Button -->
        <button
          @click="showOrderModal = true"
          class="h-10 px-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all relative flex-shrink-0"
        >
          <i class="fa-solid fa-bag-shopping text-sm"></i>
          <span class="hidden sm:inline">Order Basket</span>
          <span
            v-if="orderItems.length > 0"
            class="px-1.5 py-0.2 rounded-full bg-white text-violet-700 font-black text-[11px] min-w-[20px] text-center shadow-xs"
          >
            {{ totalOrderSets }}
          </span>
        </button>
      </div>
    </header>

    <!-- ═══ CATEGORIES / BRAND TABS (Horizontal Scroll) ═══ -->
    <div class="max-w-4xl mx-auto px-3.5 sm:px-6 pt-3">
      <div class="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
        <button
          v-for="cat in categoryList"
          :key="cat.id"
          @click="selectCategory(cat.id)"
          class="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all flex-shrink-0 border"
          :class="activeCategoryId === cat.id
            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
            : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50 hover:text-slate-900'"
        >
          <span>{{ cat.icon }}</span>
          <span>{{ cat.label }}</span>
          <span class="text-[10px] opacity-70 px-1.5 py-0.2 rounded-full bg-black/10">
            {{ getCategoryCount(cat.id) }}
          </span>
        </button>
      </div>
    </div>

    <!-- ═══ TOP BUBBLE TRAIL / PHOTO FILMSTRIP PREVIEW ═══ -->
    <div v-if="currentCategoryProducts.length > 0" class="max-w-md mx-auto px-3.5 sm:px-4 pt-2">
      <div class="bg-white/85 backdrop-blur-md rounded-2xl p-2 border border-slate-200/80 shadow-xs space-y-1.5">
        <!-- Trail Navigation Controls Header -->
        <div class="flex items-center justify-between px-1 text-[11px] font-bold text-slate-500">
          <button
            type="button"
            @click="handlePrev"
            :disabled="currentIndex === 0"
            class="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 text-[11px] font-bold"
          >
            <i class="fa-solid fa-chevron-left text-[10px]"></i>
            <span>Back</span>
          </button>

          <span class="text-slate-700 font-extrabold">
            Photo {{ Math.min(currentIndex + 1, currentCategoryProducts.length) }} of {{ currentCategoryProducts.length }}
          </span>

          <button
            type="button"
            @click="handleNext"
            :disabled="currentIndex >= currentCategoryProducts.length - 1"
            class="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 text-[11px] font-bold"
          >
            <span>Next</span>
            <i class="fa-solid fa-chevron-right text-[10px]"></i>
          </button>
        </div>

        <!-- Horizontal Scrollable Square Bubbles -->
        <div
          ref="bubbleTrailContainer"
          class="flex items-center gap-2 overflow-x-auto py-1 px-1 hide-scrollbar scroll-smooth"
        >
          <button
            v-for="(prod, idx) in currentCategoryProducts"
            :key="idx"
            :ref="el => setBubbleRef(el, idx)"
            type="button"
            @click="jumpToPhoto(idx)"
            class="relative w-14 h-14 rounded-2xl flex-shrink-0 bg-slate-100 border transition-all duration-200 overflow-hidden group flex items-center justify-center p-1"
            :class="idx === currentIndex
              ? 'scale-110 border-violet-600 ring-2 ring-violet-500 ring-offset-2 shadow-md z-10 bg-white'
              : idx < currentIndex
                ? 'opacity-65 hover:opacity-100 border-slate-200 hover:border-slate-400 bg-slate-50'
                : 'opacity-80 hover:opacity-100 border-slate-200 hover:border-slate-400 bg-white'"
            :title="prod.productName"
          >
            <!-- Miniature Image -->
            <img
              v-if="prod.imageUrl"
              :src="prod.imageUrl"
              class="w-full h-full object-contain pointer-events-none"
              loading="lazy"
            />
            <i v-else class="fa-solid fa-shoe-prints text-slate-300 text-xs"></i>

            <!-- Order Indicator Badge (Checkmark if already added to cart) -->
            <div
              v-if="isProductInCart(prod.productName)"
              class="absolute top-0.5 right-0.5 w-4 h-4 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[8px] font-black shadow-xs"
              title="Added to order"
            >
              <i class="fa-solid fa-check"></i>
            </div>

            <!-- Compulsory Star Badge -->
            <div
              v-if="prod.isCompulsory"
              class="absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-amber-500 text-white rounded-full flex items-center justify-center text-[7px] font-black"
              title="Compulsory Item"
            >
              ★
            </div>

            <!-- Index Tag -->
            <div class="absolute bottom-0.5 left-0.5 px-1 rounded bg-slate-900/70 text-white text-[8px] font-extrabold leading-tight backdrop-blur-2xs">
              {{ idx + 1 }}
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- ═══ MAIN CARD / PHOTO REVIEW INTERFACE ═══ -->
    <main class="max-w-md mx-auto px-3.5 sm:px-4 pt-2 space-y-3.5">
      <!-- Loading State -->
      <div v-if="stockLoading" class="py-24 text-center space-y-3 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
        <div class="w-12 h-12 rounded-full border-3 border-violet-200 border-t-violet-600 animate-spin mx-auto"></div>
        <p class="text-sm font-bold text-slate-600">Loading catalog items…</p>
      </div>

      <!-- No Products in Category -->
      <div v-else-if="currentCategoryProducts.length === 0" class="py-16 text-center space-y-4 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
        <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 text-2xl">
          <i class="fa-solid fa-box-open"></i>
        </div>
        <div>
          <h3 class="text-base font-bold text-slate-800">No products found</h3>
          <p class="text-xs text-slate-400 mt-1">No items with photos available in {{ activeCategoryObj.label }}.</p>
        </div>
        <button
          @click="selectCategory('general')"
          class="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
        >
          View General Catalog
        </button>
      </div>

      <!-- End of Category Products Reached -->
      <div v-else-if="currentIndex >= currentCategoryProducts.length" class="py-16 text-center space-y-4 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs animate-fade-in">
        <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
          <i class="fa-solid fa-circle-check"></i>
        </div>
        <div>
          <h3 class="text-base font-bold text-slate-800">Category Review Complete!</h3>
          <p class="text-xs text-slate-400 mt-1">You have reviewed all {{ currentCategoryProducts.length }} items in {{ activeCategoryObj.label }}.</p>
        </div>
        <div class="flex items-center justify-center gap-3 pt-2">
          <button
            @click="jumpToPhoto(0)"
            class="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold"
          >
            <i class="fa-solid fa-rotate-left mr-1"></i> Restart Category
          </button>
          <button
            @click="showOrderModal = true"
            class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-xs"
          >
            <i class="fa-solid fa-bag-shopping mr-1"></i> View Order ({{ orderItems.length }})
          </button>
        </div>
      </div>

      <!-- Active Product Card -->
      <div v-else class="space-y-3 animate-fade-in">
        <!-- Product Presentation Card -->
        <div class="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-md transition-all">
          <!-- Big Product Image -->
          <div class="relative bg-slate-100 aspect-square w-full flex items-center justify-center overflow-hidden group">
            <img
              v-if="currentProduct.imageUrl"
              :src="currentProduct.imageUrl"
              :alt="currentProduct.productName"
              class="w-full h-full object-contain p-2 select-none transition-transform duration-300 group-hover:scale-105"
              loading="eager"
            />
            <div v-else class="text-slate-300 text-6xl flex flex-col items-center">
              <i class="fa-solid fa-shoe-prints"></i>
              <span class="text-xs font-bold text-slate-400 mt-2">No Photo Available</span>
            </div>

            <!-- Floating Badge: Brand & Stock -->
            <div class="absolute top-3 left-3 flex items-center gap-2">
              <span class="px-2.5 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-black uppercase tracking-wider shadow-sm">
                {{ currentProduct.groupName || activeCategoryObj.label }}
              </span>
              <span
                v-if="currentProduct.isCompulsory"
                class="px-2 py-0.5 rounded-lg bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-xs animate-pulse"
              >
                ★ Core Item
              </span>
            </div>

            <!-- In-Stock Indicator -->
            <div class="absolute top-3 right-3">
              <span
                class="px-2.5 py-1 rounded-xl text-[11px] font-black tracking-wider shadow-sm flex items-center gap-1"
                :class="currentProduct.closingBalance > 0 ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-200'"
              >
                <i class="fa-solid fa-cubes text-[10px]"></i>
                {{ currentProduct.closingBalance || currentProduct.quantity || 0 }} Pairs
              </span>
            </div>

            <!-- Price/Rate Tag if available -->
            <div v-if="currentProduct.rate" class="absolute bottom-3 left-3">
              <span class="px-3 py-1 rounded-xl bg-violet-600 text-white text-xs font-black shadow-sm">
                ₹{{ currentProduct.rate }}
              </span>
            </div>
          </div>

          <!-- Product Details Section -->
          <div class="p-4 sm:p-5 space-y-4">
            <!-- Title & Qty Stepper -->
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <h2 class="text-base sm:text-lg font-black text-slate-900 leading-snug">
                  {{ currentProduct.productName }}
                </h2>
                <p class="text-xs text-slate-400 font-semibold mt-0.5">
                  Art: {{ getCleanArticleName(currentProduct.productName) }}
                </p>
              </div>

              <!-- Quantity Selector (Sets) -->
              <div class="flex items-center bg-slate-100 rounded-2xl p-1 border border-slate-200/80 flex-shrink-0">
                <button
                  @click="currentQty = Math.max(1, currentQty - 1)"
                  class="w-7 h-7 rounded-xl bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center active:scale-95 font-bold shadow-2xs"
                >
                  -
                </button>
                <span class="w-10 text-center font-black text-xs text-slate-900">
                  {{ currentQty }} <span class="text-[9px] text-slate-500 block -mt-1 font-normal">Set{{ currentQty > 1 ? 's' : '' }}</span>
                </span>
                <button
                  @click="currentQty++"
                  class="w-7 h-7 rounded-xl bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center active:scale-95 font-bold shadow-2xs"
                >
                  +
                </button>
              </div>
            </div>

            <!-- ═══ DIRECT SIZE PROMPT (For Cushion & Compulsory Items) ═══ -->
            <div v-if="currentProduct.suggestedSizes && currentProduct.suggestedSizes.length > 0" class="p-3 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent rounded-2xl border border-amber-300/60 space-y-2">
              <div class="flex items-center justify-between text-[11px] font-black text-amber-900 uppercase tracking-wider">
                <span class="flex items-center gap-1.5">
                  <i class="fa-solid fa-bullseye text-amber-600"></i>
                  <span>Which size does the customer want?</span>
                </span>
                <span class="text-[10px] font-semibold text-amber-700">1-tap select</span>
              </div>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="sizeOpt in currentProduct.suggestedSizes"
                  :key="sizeOpt"
                  type="button"
                  @click="appendSuggestedSize(sizeOpt)"
                  class="px-3 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 border shadow-2xs"
                  :class="currentComment.includes(sizeOpt)
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-white text-amber-950 border-amber-300 hover:bg-amber-100/80'"
                >
                  {{ sizeOpt }}
                </button>
              </div>
            </div>

            <!-- ═══ GENERAL SIZE SHORTCUT PILLS ═══ -->
            <div class="space-y-1.5 pt-1">
              <div class="flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-wider">
                <span>Quick Size Shortcuts</span>
                <span class="text-[10px] font-normal lowercase text-slate-400">tap to append</span>
              </div>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="size in quickSizes"
                  :key="size"
                  type="button"
                  @click="appendSizeShortcut(size)"
                  class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-violet-100 hover:text-violet-900 active:scale-95 text-slate-700 text-xs font-bold transition-all border border-slate-200/60"
                >
                  {{ size }}
                </button>
              </div>
            </div>

            <!-- ═══ CUSTOM SIZE RANGE BUILDER ═══ -->
            <div class="space-y-1.5 pt-1">
              <div class="flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-wider">
                <span>Custom Size Range</span>
              </div>
              <div class="flex items-center gap-2">
                <input
                  v-model="customSizeMin"
                  type="text"
                  placeholder="Min (e.g. 3)"
                  class="w-1/3 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center focus:bg-white focus:outline-violet-500"
                />
                <span class="text-xs font-black text-slate-400">×</span>
                <input
                  v-model="customSizeMax"
                  type="text"
                  placeholder="Max (e.g. 7)"
                  class="w-1/3 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center focus:bg-white focus:outline-violet-500"
                />
                <button
                  type="button"
                  @click="addCustomRangeToComment"
                  class="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold active:scale-95 flex-1 shadow-2xs"
                >
                  + Add Size
                </button>
              </div>
            </div>

            <!-- ═══ COMMENT / REQUIREMENT TEXTBOX ═══ -->
            <div class="space-y-1.5 pt-1">
              <div class="flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-wider">
                <span>Requirement / Comments</span>
                <button
                  v-if="currentComment"
                  type="button"
                  @click="currentComment = ''"
                  class="text-[10px] text-rose-500 hover:underline font-bold"
                >
                  Clear
                </button>
              </div>
              <textarea
                v-model="currentComment"
                rows="2"
                placeholder="e.g. Size 6x9 only, urgent delivery, red color..."
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-violet-500 font-medium"
              ></textarea>
            </div>

            <!-- ═══ BIG WRONG (SKIP) & RIGHT (ADD) BUTTONS ═══ -->
            <div class="grid grid-cols-2 gap-3 pt-2">
              <!-- Wrong / Skip (Red Button) -->
              <button
                type="button"
                @click="handleSkip"
                class="py-3.5 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 active:scale-95 font-black text-sm flex items-center justify-center gap-2 border border-rose-200/80 transition-all shadow-2xs"
              >
                <i class="fa-solid fa-xmark text-lg text-rose-600"></i>
                <span>Skip</span>
              </button>

              <!-- Right / Add & Next (Green Button) -->
              <button
                type="button"
                @click="handleAddAndNext"
                class="py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 font-black text-sm flex items-center justify-center gap-2 border border-emerald-700 transition-all shadow-sm"
              >
                <i class="fa-solid fa-check text-lg"></i>
                <span>Add & Next</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- ═══ ORDER SUMMARY DRAWER / MODAL ═══ -->
    <Transition name="fade">
      <div
        v-if="showOrderModal"
        class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        @click.self="showOrderModal = false"
      >
        <div class="bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up">
          <!-- Drawer Header -->
          <div class="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 class="text-base font-black text-slate-900">Current Order Summary</h3>
              <p class="text-xs text-slate-400 font-semibold mt-0.5">
                {{ orderItems.length }} Articles • {{ totalOrderSets }} Total Sets
              </p>
            </div>
            <button
              @click="showOrderModal = false"
              class="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
            >
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Customer Name & Phone Input -->
          <div class="p-4 bg-slate-50 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Customer / Party Name</label>
              <input
                v-model="customerName"
                type="text"
                placeholder="e.g. Balaji Footwear"
                class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              />
            </div>
            <div>
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Phone / WhatsApp No.</label>
              <input
                v-model="customerPhone"
                type="tel"
                placeholder="e.g. 9876543210"
                class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              />
            </div>
          </div>

          <!-- Items Table -->
          <div class="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
            <div v-if="orderItems.length === 0" class="py-12 text-center text-slate-400 space-y-2">
              <i class="fa-solid fa-basket-shopping text-3xl"></i>
              <p class="text-xs font-bold">Your order basket is currently empty.</p>
            </div>

            <div
              v-for="(item, idx) in orderItems"
              :key="idx"
              class="py-3 flex items-start justify-between gap-3 text-xs"
            >
              <!-- Thumbnail -->
              <div class="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                <img v-if="item.product.imageUrl" :src="item.product.imageUrl" class="w-full h-full object-contain" />
                <i v-else class="fa-solid fa-shoe-prints text-slate-300"></i>
              </div>

              <!-- Details -->
              <div class="flex-1 min-w-0">
                <h4 class="font-bold text-slate-900 truncate">{{ item.product.productName }}</h4>
                <div class="flex items-center gap-2 text-[10px] text-slate-400 font-semibold mt-0.5">
                  <span>{{ item.product.groupName }}</span>
                  <span>•</span>
                  <span>Stock: {{ item.product.closingBalance || item.product.quantity || 0 }} prs</span>
                </div>

                <!-- Custom Size / Comment Display -->
                <div v-if="item.comment" class="mt-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/60 text-amber-800 text-[11px] font-medium inline-block max-w-full truncate">
                  💬 {{ item.comment }}
                </div>
              </div>

              <!-- Qty & Delete -->
              <div class="flex items-center gap-2 flex-shrink-0">
                <div class="flex items-center bg-slate-100 rounded-xl p-0.5">
                  <button @click="updateOrderItemQty(idx, -1)" class="w-6 h-6 rounded-lg bg-white flex items-center justify-center font-bold text-xs">-</button>
                  <span class="w-6 text-center font-bold text-xs">{{ item.quantity }}</span>
                  <button @click="updateOrderItemQty(idx, 1)" class="w-6 h-6 rounded-lg bg-white flex items-center justify-center font-bold text-xs">+</button>
                </div>
                <button
                  @click="removeOrderItem(idx)"
                  class="w-7 h-7 rounded-xl text-rose-500 hover:bg-rose-50 flex items-center justify-center"
                  title="Remove"
                >
                  <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Drawer Footer Action Buttons -->
          <div class="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2.5">
            <button
              v-if="orderItems.length > 0"
              @click="clearAllOrderItems"
              class="px-3 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs"
            >
              Clear All
            </button>

            <div class="flex items-center gap-2 ml-auto">
              <!-- Generate PDF Button -->
              <button
                @click="handleExportPDF"
                :disabled="orderItems.length === 0 || isExporting"
                class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-40"
              >
                <i class="fa-solid fa-file-pdf text-rose-400"></i>
                <span>Order PDF</span>
              </button>

              <!-- WhatsApp Share Button -->
              <button
                @click="handleExportWhatsApp"
                :disabled="orderItems.length === 0 || isExporting"
                class="px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#128C7E] active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-40"
              >
                <i class="fa-brands fa-whatsapp text-sm"></i>
                <span>Send WhatsApp</span>
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
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { toast } from 'vue3-toastify';

const router = useRouter();
const { stockData, loadStockData, loading: stockLoading } = useStockData(ref(false));

// ─── Categories & Brand Groups Definition ─────────────────────────────
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

// ─── Hardcoded Compulsory Core Products Definition for General ─────────
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

// ─── Filtered Products for Active Category ────────────────────────────
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
    // Populate compulsory items at top of General list
    const enrichedCompulsory = COMPULSORY_CORE_ITEMS.map(c => {
      // Find matching live stock if available
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

const getCategoryCount = (catId) => {
  const cat = categoryList.find(c => c.id === catId);
  if (!cat) return 0;
  if (catId === 'general') {
    return currentCategoryProducts.value.length;
  }
  const allowedBrandsSet = new Set(cat.brands.map(b => b.toLowerCase().trim()));
  return allCatalogProducts.value.filter(p => {
    const gName = (p.groupName || '').toLowerCase().trim();
    return allowedBrandsSet.has(gName) && p.imageUrl;
  }).length;
};

// ─── Current Photo Card State ─────────────────────────────────────────
const currentIndex = ref(0);
const currentQty = ref(1);
const currentComment = ref('');
const customSizeMin = ref('');
const customSizeMax = ref('');
const bubbleTrailContainer = ref(null);
const bubbleElements = ref({});

const setBubbleRef = (el, idx) => {
  if (el) {
    bubbleElements.value[idx] = el;
  }
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
  customSizeMin.value = '';
  customSizeMax.value = '';
};

const jumpToPhoto = (idx) => {
  if (idx >= 0 && idx < currentCategoryProducts.value.length) {
    currentIndex.value = idx;
    resetCardInputs();
  }
};

const handlePrev = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    resetCardInputs();
  }
};

const handleNext = () => {
  if (currentIndex.value < currentCategoryProducts.value.length - 1) {
    currentIndex.value++;
    resetCardInputs();
  }
};

// Auto scroll bubble trail so active square is always centered
watch(currentIndex, async (newIdx) => {
  await nextTick();
  const el = bubbleElements.value[newIdx];
  if (el && el.scrollIntoView) {
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
});

// ─── Size Shortcuts & Comment Helpers ─────────────────────────────────
const quickSizes = ['4x8', '5x9', '5x10', '6x9', '6x10', '7x10', '9x10', '11x13', '1x3', '4x7'];

const appendSuggestedSize = (sizeOption) => {
  const snippet = `Size: ${sizeOption}`;
  if (currentComment.value.includes(snippet) || currentComment.value.includes(sizeOption)) {
    // Already included
    return;
  }
  if (currentComment.value.trim().length > 0) {
    currentComment.value += `, ${snippet}`;
  } else {
    currentComment.value = snippet;
  }
};

const appendSizeShortcut = (size) => {
  if (currentComment.value.trim().length > 0) {
    currentComment.value += `, Size: ${size}`;
  } else {
    currentComment.value = `Size: ${size}`;
  }
};

const addCustomRangeToComment = () => {
  const min = (customSizeMin.value || '').trim();
  const max = (customSizeMax.value || '').trim();

  if (!min || !max) {
    toast.warn('Please enter both min and max sizes', { autoClose: 1500 });
    return;
  }

  const snippet = `Size: ${min}x${max} required`;
  if (currentComment.value.trim().length > 0) {
    currentComment.value += `, ${snippet}`;
  } else {
    currentComment.value = snippet;
  }

  customSizeMin.value = '';
  customSizeMax.value = '';
};

const getCleanArticleName = (name) => {
  if (!name) return '';
  return name.replace(/\s*\(\d+\s*Sets?\)/gi, '').trim();
};

// ─── Card Actions: Skip vs Add & Next ─────────────────────────────────
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

  toast.success(`Added ${prod.productName} (${currentQty.value} Set${currentQty.value > 1 ? 's' : ''})`, { autoClose: 1200 });

  currentIndex.value++;
  resetCardInputs();
};

// ─── Order Drawer Operations ──────────────────────────────────────────
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

// ─── Export: WhatsApp & PDF ───────────────────────────────────────────
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
  message += `_Generated via SBE Order Maker_`;

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(message);
    }
  } catch (e) {}

  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
  toast.success('Order copied to clipboard & WhatsApp opened!', { autoClose: 3000 });
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
    toast.error('Failed to generate PDF. Please try again.');
  } finally {
    isExporting.value = false;
  }
};

const handleBack = () => {
  router.push('/');
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
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
.animate-slide-up {
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fade-in {
  animation: fadeIn 0.2s ease-out forwards;
}
</style>
