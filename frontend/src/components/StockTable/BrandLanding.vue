<template>
  <div class="brand-landing pb-24 text-slate-900 font-sans w-full max-w-full overflow-x-hidden">
    
    <!-- ══════════════════════════════════════════════════════════
         1. TOP BAR: Search Bar & Cart (Single Row at the Very Top)
         ══════════════════════════════════════════════════════════ -->
    <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100/80 px-2.5 sm:px-6 pb-2 transition-all w-full max-w-full overflow-hidden" style="padding-top: max(0.625rem, env(safe-area-inset-top, 0.625rem));">
      <!-- Search Bar + Cart Button Row -->
      <div class="flex items-center gap-1.5 sm:gap-2.5 w-full">
        <div class="flex-1 min-w-0 relative" ref="searchContainerRef">
          <div class="flex items-center gap-1.5 sm:gap-2 bg-slate-50 hover:bg-white rounded-2xl border border-slate-200 shadow-sm p-1 pl-2.5 sm:pl-3.5 focus-within:border-[#c59b27] focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500/10 transition-all">
            <i class="fa-solid fa-magnifying-glass text-slate-400 text-xs sm:text-sm shrink-0"></i>
            
            <input
              v-model="localQuery"
              @focus="showDropdown = true"
              @keydown.enter="handleSearchSubmit(localQuery)"
              type="text"
              placeholder="Search products..."
              class="flex-1 min-w-0 bg-transparent text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none py-1.5"
            />

            <button
              v-if="localQuery"
              @click="localQuery = ''; showDropdown = false"
              class="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 shrink-0"
            >
              <i class="fa-solid fa-xmark text-xs"></i>
            </button>

            <!-- Vertical Divider -->
            <div class="h-5 sm:h-6 w-px bg-slate-200 shrink-0 mx-0.5"></div>

            <!-- Clean View Switch (Zomato VEG MODE Style) -->
            <button
              @click="cleanView = !cleanView"
              type="button"
              class="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 rounded-xl transition-all select-none shrink-0"
              :class="cleanView ? 'bg-amber-50 border border-amber-300/80 text-amber-900' : 'bg-white border border-slate-200/70 text-slate-500'"
              title="Toggle Images Only & In Stock"
            >
              <div class="flex flex-col text-right leading-none">
                <span class="text-[8px] sm:text-[9px] font-black uppercase tracking-wider" :class="cleanView ? 'text-amber-800' : 'text-slate-600'">CLEAN</span>
                <span class="hidden sm:inline text-[8px] font-bold" :class="cleanView ? 'text-amber-600' : 'text-slate-400'">VIEW</span>
              </div>
              <!-- Custom Toggle Pill -->
              <div
                class="w-6 sm:w-7 h-3.5 sm:h-4 rounded-full p-0.5 transition-colors relative"
                :class="cleanView ? 'bg-[#c59b27]' : 'bg-slate-300'"
              >
                <div
                  class="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-white shadow-sm transition-transform"
                  :class="cleanView ? 'translate-x-2.5 sm:translate-x-3' : 'translate-x-0'"
                ></div>
              </div>
            </button>
          </div>

          <!-- Search Auto-complete Dropdown -->
          <transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-1"
          >
            <div
              v-if="showDropdown && localQuery.trim().length > 0"
              class="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-50 max-h-[60vh] flex flex-col"
            >
              <div class="overflow-y-auto overscroll-contain flex-1 p-2 space-y-1 no-scrollbar">
                <button
                  @click="handleSearchSubmit(localQuery)"
                  class="w-full text-left px-4 py-2.5 rounded-xl hover:bg-amber-50/60 transition-colors flex items-center gap-3"
                >
                  <div class="w-7 h-7 rounded-full bg-amber-100 text-[#c59b27] flex items-center justify-center shrink-0">
                    <i class="fa-solid fa-magnifying-glass text-xs"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-bold text-slate-800 truncate">Show all results for "{{ localQuery.trim() }}"</div>
                    <div class="text-xs text-slate-400">View all matching products</div>
                  </div>
                  <i class="fa-solid fa-arrow-right text-xs text-slate-400"></i>
                </button>

                <div v-if="searchSuggestions.length > 0" class="h-px bg-slate-100 my-1 mx-2"></div>

                <!-- Product Suggestions -->
                <button
                  v-for="product in searchSuggestions"
                  :key="product.productName"
                  @click="handleProductSelect(product)"
                  class="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-3 group/item"
                >
                  <div class="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200/60">
                    <img v-if="product.imageUrl" :src="getOptimizedImageUrl(product.imageUrl, 'w_100,h_100,c_fill')" class="w-full h-full object-cover" />
                    <div v-else class="w-full h-full flex items-center justify-center text-slate-300">
                      <i class="fa-solid fa-box text-sm"></i>
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-xs sm:text-sm font-bold text-slate-800 truncate group-hover/item:text-[#c59b27] transition-colors">
                      {{ getCleanProductName(product.productName) }}
                    </div>
                    <div class="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                      <span v-if="getProductColor(product.productName)" class="flex items-center gap-1">
                        <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: getProductColor(product.productName).hex }"></span>
                        <span class="capitalize">{{ getProductColor(product.productName).text }}</span>
                      </span>
                      <span v-if="getProductSize(product.productName)" class="font-semibold text-slate-600">
                        {{ getProductSize(product.productName) }}
                      </span>
                      <span class="font-black text-slate-900">
                        ₹{{ getPriceInfo(product.productName).price }}
                      </span>
                      <span :class="product.quantity > 0 ? 'text-emerald-600' : 'text-rose-500'" class="font-bold">
                        {{ product.quantity > 0 ? `${product.quantity} pairs` : 'Out of Stock' }}
                      </span>
                    </div>
                  </div>
                </button>

                <div v-if="searchSuggestions.length === 0" class="px-4 py-6 text-center text-slate-400 text-xs">
                  No specific items matching "{{ localQuery.trim() }}"
                </div>
              </div>
            </div>
          </transition>
        </div>

        <!-- Sync Button (Admin Mode) -->
        <button
          v-if="isAdmin || isSuperAdmin"
          @click="handleSync"
          class="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white border border-slate-200 hover:border-amber-400 text-slate-700 hover:text-amber-600 flex items-center justify-center transition-all hover:bg-amber-50/50 active:scale-95 shadow-sm shrink-0"
          title="Sync Stock from Tally"
        >
          <i class="fa-solid fa-rotate text-xs sm:text-sm" :class="{ 'animate-spin text-amber-500': isSyncing }"></i>
        </button>

        <!-- Admin Login / Hub Button -->
        <button
          v-if="!isAdmin && !isSuperAdmin"
          @click="appStore.toggleAdminModal(true)"
          class="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white border border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all hover:bg-slate-50 active:scale-95 shadow-sm shrink-0"
          title="Admin Login"
        >
          <i class="fa-solid fa-lock text-xs sm:text-sm"></i>
        </button>
        <button
          v-else
          @click="$router.push('/home')"
          class="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-amber-50 border border-amber-300/80 text-amber-700 hover:bg-amber-100 flex items-center justify-center transition-all active:scale-95 shadow-sm shrink-0"
          title="SBE Hub"
        >
          <i class="fa-solid fa-shield-halved text-xs sm:text-sm"></i>
        </button>

        <!-- Right: Shopping Bag Cart Button -->
        <button
          @click="appStore.toggleCart(true)"
          class="relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#18181b] text-white flex items-center justify-center transition-all hover:bg-black active:scale-95 shadow-md shadow-black/10 shrink-0"
          title="View Cart"
        >
          <div v-if="cartTotalItems > 0" class="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-black h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full ring-2 ring-white animate-pulse">
            {{ cartTotalItems }}
          </div>
          <i class="fa-solid fa-bag-shopping text-xs sm:text-sm text-amber-400"></i>
        </button>
      </div>

      <!-- ══════════════════════════════════════════════════════════
           2. BRAND TABS: Circular Brand Icons (Zomato Category Bar)
           ══════════════════════════════════════════════════════════ -->
      <div class="mt-2.5 w-full overflow-x-auto no-scrollbar border-t border-slate-100/60 pt-2">
        <div class="flex items-center gap-3 sm:gap-4.5 min-w-max pb-1">
          <button
            v-for="tab in brandTabs"
            :key="tab.id"
            @click="selectTab(tab.id)"
            class="flex flex-col items-center gap-1.5 group select-none transition-all relative pb-2 shrink-0 min-w-[56px] sm:min-w-[64px]"
          >
            <!-- Circle Thumbnail / Badge -->
            <div
              class="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center p-2 transition-all duration-300 relative overflow-hidden shrink-0"
              :class="activeTab === tab.id ? 'ring-2 ring-[#c59b27] ring-offset-2 bg-amber-50 shadow-md scale-105' : 'bg-slate-50 border border-slate-200/80 hover:bg-slate-100/80 hover:scale-102'"
            >
              <img
                v-if="tab.image"
                :src="tab.image"
                :alt="tab.label"
                class="w-full h-full object-contain transition-transform group-hover:scale-110"
              />
              <div v-else-if="tab.icon" class="text-base sm:text-lg" :class="tab.iconColor || 'text-slate-700'">
                <i :class="tab.icon"></i>
              </div>
            </div>

            <!-- Tab Label -->
            <span
              class="text-[11px] sm:text-xs font-bold tracking-tight transition-colors whitespace-nowrap"
              :class="activeTab === tab.id ? 'text-slate-900 font-extrabold' : 'text-slate-600 group-hover:text-slate-900'"
            >
              {{ tab.label }}
            </span>

            <!-- Active Indicator Underline -->
            <div
              v-if="activeTab === tab.id"
              class="absolute bottom-0 left-2 right-2 h-0.5 bg-[#c59b27] rounded-full shadow-sm"
            ></div>
          </button>
        </div>
      </div>
    </header>

    <!-- ══════════════════════════════════════════════════════════
         3. STICKY FILTER PILLS: Quick Filter Chips Bar
         ══════════════════════════════════════════════════════════ -->
    <div class="sticky top-[108px] sm:top-[115px] z-30 bg-[#fcfbf9]/95 backdrop-blur-md py-2 px-3 sm:px-6 border-b border-slate-200/50">
      <div class="flex items-center gap-2 overflow-x-auto no-scrollbar">
        <!-- Filters Button -->
        <button
          @click="activeFilter = activeFilter === 'all' ? 'instock' : 'all'"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all shrink-0 shadow-sm"
          :class="activeFilter !== 'all' ? 'bg-[#18181b] text-white border-black' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'"
        >
          <i class="fa-solid fa-sliders text-[11px] text-amber-500"></i>
          <span>Filters</span>
          <i class="fa-solid fa-chevron-down text-[9px] ml-0.5 opacity-60"></i>
        </button>

        <!-- Near & Fast / In Stock Only -->
        <button
          @click="toggleInStockFilter"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all shrink-0 shadow-sm"
          :class="inStockOnly ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'"
        >
          <i class="fa-solid fa-bolt text-[11px] text-amber-400"></i>
          <span>In Stock Only</span>
        </button>

        <!-- New Arrivals Filter -->
        <button
          @click="selectTab('NewArrivals')"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all shrink-0 shadow-sm"
          :class="activeTab === 'NewArrivals' ? 'bg-[#c59b27] text-white border-[#c59b27]' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'"
        >
          <span>✨ New Arrivals</span>
        </button>

        <!-- 40% Off Paragon -->
        <button
          @click="selectTab('ParagonDiscount')"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-all shrink-0 shadow-sm"
        >
          <i class="fa-solid fa-tag text-[10px]"></i>
          <span>40% Off Paragon</span>
        </button>

        <!-- Box Packing -->
        <button
          @click="selectTab('BoxPacking')"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all shrink-0 shadow-sm"
        >
          <i class="fa-solid fa-box text-[10px] text-blue-500"></i>
          <span>Box Packing</span>
        </button>

        <!-- Loose Packing -->
        <button
          @click="selectTab('LoosePacking')"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all shrink-0 shadow-sm"
        >
          <i class="fa-solid fa-bag-shopping text-[10px] text-purple-500"></i>
          <span>Loose Packing</span>
        </button>

        <!-- Under ₹250 -->
        <button
          @click="handlePriceFilter(250)"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all shrink-0 shadow-sm"
          :class="maxPriceFilter === 250 ? 'bg-[#18181b] text-white border-black' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'"
        >
          <span>Under ₹250</span>
        </button>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════
         1. SEARCH RESULTS VIEW: Shown when user is actively searching
         ══════════════════════════════════════════════════════════ -->
    <section v-if="isSearchActive" class="mt-4 px-3 sm:px-6">
      <div class="flex items-center justify-between mb-4 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div class="flex items-center gap-2 min-w-0">
          <span class="text-sm sm:text-base font-black font-['Clash_Display'] text-slate-900 uppercase truncate">
            Search: "{{ searchQuery }}"
          </span>
          <span class="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-black shrink-0">
            {{ (selectedItem ? 1 : 0) + otherSearchResults.length }} products found
          </span>
        </div>
        <button
          @click="clearSearch"
          class="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-all shrink-0"
        >
          <i class="fa-solid fa-xmark text-[10px]"></i>
          <span>Clear Search</span>
        </button>
      </div>

      <!-- 1. SELECTED ITEM ON TOP (If user clicked a specific item from dropdown) -->
      <div v-if="selectedItem" class="mb-6">
        <div class="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <i class="fa-solid fa-star text-amber-500"></i>
          <span>Selected Product</span>
        </div>

        <div class="flex flex-col sm:flex-row bg-gradient-to-br from-amber-500/10 via-amber-50/40 to-white rounded-3xl p-4 sm:p-5 border-2 border-amber-400 shadow-md gap-4 sm:gap-6 relative overflow-hidden group/sel">
          <!-- Image Section -->
          <div 
            class="relative w-full sm:w-[170px] aspect-[4/5] sm:aspect-square bg-white rounded-2xl overflow-hidden cursor-pointer shrink-0 border border-amber-200/60 shadow-sm flex items-center justify-center p-2"
            @click="$emit('open-image-popup', selectedItem)"
          >
            <CachedImage
              v-if="selectedItem.imageUrl"
              :src="getOptimizedImageUrl(selectedItem.imageUrl, 'w_400,h_500,c_fill')"
              :alt="selectedItem.productName"
              class="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover/sel:scale-105"
            />
            <div v-else class="w-full h-full flex flex-col items-center justify-center text-slate-300">
              <i class="fa-solid fa-image text-3xl opacity-20"></i>
            </div>

            <div class="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-amber-400 text-[10px] font-black tracking-wider uppercase flex items-center gap-1">
              <i class="fa-solid fa-check text-[9px]"></i> EXACT MATCH
            </div>
          </div>

          <!-- Details Section -->
          <div class="flex-1 flex flex-col justify-between min-w-0">
            <div>
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <h3 class="text-base sm:text-lg font-black font-['Clash_Display'] text-slate-900 tracking-tight leading-snug">
                    {{ getCleanProductName(selectedItem.productName) }}
                  </h3>
                  <p class="text-xs text-slate-500 mt-0.5 font-medium truncate">{{ selectedItem.productName }}</p>
                </div>
                <span 
                  class="px-3 py-1 rounded-full text-xs font-black shrink-0 shadow-xs"
                  :class="selectedItem.quantity > 0 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-700 border border-rose-200'"
                >
                  {{ selectedItem.quantity > 0 ? `${selectedItem.quantity} pairs in stock` : 'Out of Stock' }}
                </span>
              </div>

              <!-- Color, Size & Price badges -->
              <div class="flex flex-wrap items-center gap-2 mt-3 text-xs">
                <span v-if="getProductColor(selectedItem.productName)" class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-slate-200 shadow-xs font-bold text-slate-700">
                  <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: getProductColor(selectedItem.productName).hex }"></span>
                  <span class="capitalize">{{ getProductColor(selectedItem.productName).text }}</span>
                </span>
                <span v-if="getProductSize(selectedItem.productName)" class="px-2.5 py-1 rounded-xl bg-white border border-slate-200 shadow-xs font-extrabold text-slate-800">
                  Size: {{ getProductSize(selectedItem.productName) }}
                </span>
                <div class="px-3 py-1 rounded-xl bg-slate-900 text-amber-400 font-black text-sm shadow-sm">
                  ₹{{ getPriceInfo(selectedItem.productName).price }}
                </div>
              </div>
            </div>

            <!-- Add to cart & Quick actions -->
            <div class="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between gap-3">
              <div class="text-xs font-bold text-slate-600">
                Order Quantity:
              </div>

              <div class="flex items-center gap-3">
                <div 
                  v-if="getCartQty(selectedItem) > 0" 
                  class="flex items-center gap-2 p-1 bg-white rounded-2xl shadow-sm border border-amber-300"
                >
                  <button 
                    @click.stop="updateCart(selectedItem, -1)" 
                    class="w-7 h-7 flex items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 active:scale-90 transition-all font-black"
                    title="Decrease"
                  >
                    <i class="fa-solid fa-minus text-xs"></i>
                  </button>
                  <span class="min-w-[24px] text-center text-sm font-black text-slate-900 px-1">
                    {{ getCartQty(selectedItem) }}
                  </span>
                  <button 
                    @click.stop="updateCart(selectedItem, 1)" 
                    class="w-7 h-7 flex items-center justify-center rounded-xl bg-[#18181b] text-amber-400 hover:bg-black active:scale-90 transition-all shadow-xs font-black"
                    title="Increase"
                  >
                    <i class="fa-solid fa-plus text-xs"></i>
                  </button>
                </div>
                <button
                  v-else
                  @click.stop="addToCart(selectedItem)"
                  class="px-5 py-2 rounded-2xl bg-[#18181b] text-amber-400 hover:bg-black font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-2"
                >
                  <i class="fa-solid fa-plus text-xs"></i>
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. ALL OTHER / MATCHING RESULTS GRID -->
      <div v-if="otherSearchResults.length > 0">
        <div v-if="selectedItem" class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <i class="fa-solid fa-layer-group text-slate-400"></i>
          <span>More Results Matching "{{ searchQuery }}" ({{ otherSearchResults.length }})</span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4 pb-12">
          <div
            v-for="product in otherSearchResults"
            :key="product.productName"
            class="flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200/70 overflow-hidden relative group/card"
          >
            <!-- Image Area -->
            <div 
              class="relative w-full aspect-[4/5] bg-slate-50 cursor-pointer overflow-hidden"
              @click="$emit('open-image-popup', product)"
            >
              <!-- Out of Stock Overlay -->
              <div v-if="product.quantity <= 0" class="absolute inset-0 z-10 bg-slate-50/80 backdrop-blur-[2px] flex items-center justify-center">
                <span class="px-2.5 py-0.5 bg-slate-200 text-slate-500 text-[10px] font-bold rounded-full border border-slate-300">Out of Stock</span>
              </div>

              <CachedImage
                v-if="product.imageUrl"
                :src="getOptimizedImageUrl(product.imageUrl, 'w_350,h_450,c_fill')"
                alt="Product"
                class="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
              />
              <div v-else class="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                <i class="fa-solid fa-image text-2xl opacity-20"></i>
              </div>

              <!-- Floating Cart Controls / Add Button on Image -->
              <div 
                v-if="getCartQty(product) > 0" 
                class="absolute bottom-2 right-2 z-20 flex items-center gap-1 p-0.5 bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-amber-200/80 animate-fade-in"
                @click.stop
              >
                <button 
                  @click.stop="updateCart(product, -1)" 
                  class="w-6 h-6 flex items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 active:scale-90 transition-all"
                  title="Decrease"
                >
                  <i class="fa-solid fa-minus text-[9px]"></i>
                </button>
                <span class="min-w-[16px] text-center text-xs font-black text-slate-900 px-0.5">
                  {{ getCartQty(product) }}
                </span>
                <button 
                  @click.stop="updateCart(product, 1)" 
                  class="w-6 h-6 flex items-center justify-center rounded-full bg-[#18181b] text-amber-400 hover:bg-black active:scale-90 transition-all shadow-xs"
                  title="Increase"
                >
                  <i class="fa-solid fa-plus text-[9px]"></i>
                </button>
              </div>
              <button
                v-else-if="product.quantity > 0"
                @click.stop="addToCart(product)"
                class="absolute bottom-2 right-2 z-20 w-8 h-8 rounded-full bg-white/95 backdrop-blur-md text-slate-800 shadow-md border border-slate-200/80 flex items-center justify-center hover:bg-[#18181b] hover:text-amber-400 active:scale-90 transition-all group-hover/card:scale-105"
                title="Add to cart"
              >
                <i class="fa-solid fa-plus text-xs"></i>
              </button>
            </div>

            <!-- Content Area -->
            <div class="p-2.5 flex flex-col flex-1">
              <h4 class="text-[11px] sm:text-xs font-bold text-slate-800 leading-snug line-clamp-1 group-hover/card:text-[#c59b27] transition-colors" :title="product.productName">
                {{ getCleanProductName(product.productName) }}
              </h4>

              <div class="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                <span v-if="getProductColor(product.productName)" class="flex items-center gap-1 truncate max-w-[60px]">
                  <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: getProductColor(product.productName).hex }"></span>
                  <span class="capitalize truncate">{{ getProductColor(product.productName).text }}</span>
                </span>
                <span v-if="getProductSize(product.productName)" class="font-bold text-slate-600 px-1 rounded bg-slate-100">
                  {{ getProductSize(product.productName) }}
                </span>
              </div>

              <div class="mt-2 flex items-baseline justify-between pt-1 border-t border-slate-100">
                <div class="text-xs sm:text-sm font-black text-slate-900">
                  <span class="text-[10px] font-medium mr-[1px]">₹</span>{{ getPriceInfo(product.productName).price }}
                </div>
                <span :class="product.quantity > 0 ? 'text-slate-400' : 'text-rose-500 font-bold'" class="text-[10px]">
                  {{ product.quantity > 0 ? `${product.quantity} prs` : 'Out of Stock' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State if no other results and no selected item -->
      <div v-else-if="!selectedItem" class="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
        <i class="fa-solid fa-magnifying-glass text-4xl text-slate-300 mb-2"></i>
        <p class="text-sm font-bold text-slate-600">No products found matching "{{ searchQuery }}"</p>
        <p v-if="inStockOnly" class="text-xs text-amber-600 mt-1 font-medium">"In Stock Only" filter is active</p>
        <button @click="clearSearch" class="mt-3 px-4 py-2 bg-[#18181b] text-white text-xs font-bold rounded-xl">
          Clear Search
        </button>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════
         2. CATEGORY PRODUCT GRID: Shown directly under bubbles when a bubble is clicked
         ══════════════════════════════════════════════════════════ -->
    <section v-else-if="activeTab !== 'All'" class="mt-4 px-3 sm:px-6">
      <div class="flex items-center justify-between mb-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
        <div class="flex items-center gap-2 min-w-0">
          <span class="text-sm sm:text-base font-black font-['Clash_Display'] text-slate-900 uppercase truncate">
            {{ getActiveTabLabel() }}
          </span>
          <span class="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-black shrink-0">
            {{ activeTab === 'ParagonCore' ? paragonCoreList.length + ' Core Models' : filteredTabProducts.length + ' products' }}
          </span>
        </div>
        <button
          @click="selectTab('All')"
          class="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-all shrink-0"
        >
          <i class="fa-solid fa-xmark text-[10px]"></i>
          <span>Show All</span>
        </button>
      </div>

      <!-- Dedicated Paragon Core Unified Cards (16 Core Articles with Size Groups) -->
      <div v-if="activeTab === 'ParagonCore'" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4 pb-12">
        <div
          v-for="core in paragonCoreList"
          :key="core.id"
          class="flex flex-col sm:flex-row bg-white rounded-3xl p-3.5 sm:p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition-all gap-3.5 sm:gap-4 group/corecard"
        >
          <!-- Core Image Box -->
          <div 
            class="relative w-full sm:w-[130px] aspect-[4/5] sm:aspect-square bg-slate-50 rounded-2xl overflow-hidden cursor-pointer shrink-0 border border-slate-100 flex items-center justify-center p-2"
            @click="$emit('open-image-popup', { productName: core.name, imageUrl: core.img })"
          >
            <CachedImage
              :src="getOptimizedImageUrl(core.img, 'w_350,h_450,c_fill')"
              :alt="core.name"
              class="w-full h-full object-contain transition-transform duration-500 group-hover/corecard:scale-105"
            />
            <div class="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-amber-400 text-[9px] font-black tracking-wider uppercase">
              CORE
            </div>
          </div>

          <!-- Core Details & Size Groups Table -->
          <div class="flex-1 flex flex-col justify-between min-w-0">
            <div>
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <h3 class="font-['Clash_Display'] font-black text-slate-900 text-sm sm:text-base tracking-wide truncate">
                    {{ core.name }}
                  </h3>
                  <p class="text-[11px] font-medium text-slate-500 truncate">{{ core.category }}</p>
                </div>
                <span 
                  class="px-2 py-0.5 rounded-full text-[10px] font-black shrink-0"
                  :class="core.totalStock > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-400'"
                >
                  {{ core.totalStock > 0 ? core.totalStock + ' prs' : '0 in stock' }}
                </span>
              </div>

              <!-- Size Groups List -->
              <div class="mt-2.5 space-y-1.5">
                <div class="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                  Available Size Groups
                </div>
                <div class="space-y-1.5">
                  <div
                    v-for="s in core.sizes.filter(x => x.size !== 'Standard' || x.totalQty > 0 || core.sizes.length === 1)"
                    :key="s.size"
                    class="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/60 hover:bg-slate-100/70 transition-colors"
                  >
                    <div class="flex items-center gap-2 min-w-0">
                      <span class="px-1.5 py-0.5 rounded-md bg-white font-black text-[11px] text-slate-800 border border-slate-200 shadow-xs">
                        {{ s.size === 'Standard' ? 'Regular' : s.size }}
                      </span>
                      <span v-if="s.price > 0" class="text-xs font-black text-slate-900">
                        ₹{{ s.price }}
                      </span>
                    </div>

                    <div class="flex items-center gap-2.5 shrink-0">
                      <span 
                        class="text-[10px] font-bold"
                        :class="s.totalQty > 0 ? 'text-slate-600' : 'text-slate-400'"
                      >
                        {{ s.totalQty > 0 ? s.totalQty + ' prs' : 'Out of stock' }}
                      </span>

                      <!-- Cart Pill for Size Group -->
                      <div v-if="s.primaryProduct && s.totalQty > 0" class="flex items-center">
                        <div 
                          v-if="getCartQty(s.primaryProduct) > 0" 
                          class="flex items-center gap-1 p-0.5 bg-white rounded-full shadow-sm border border-amber-300"
                          @click.stop
                        >
                          <button 
                            @click.stop="updateCart(s.primaryProduct, -1)" 
                            class="w-5 h-5 flex items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 active:scale-90 transition-all"
                            title="Decrease"
                          >
                            <i class="fa-solid fa-minus text-[8px]"></i>
                          </button>
                          <span class="min-w-[14px] text-center text-[11px] font-black text-slate-900 px-0.5">
                            {{ getCartQty(s.primaryProduct) }}
                          </span>
                          <button 
                            @click.stop="updateCart(s.primaryProduct, 1)" 
                            class="w-5 h-5 flex items-center justify-center rounded-full bg-[#18181b] text-amber-400 hover:bg-black active:scale-90 transition-all"
                            title="Increase"
                          >
                            <i class="fa-solid fa-plus text-[8px]"></i>
                          </button>
                        </div>
                        <button
                          v-else
                          @click.stop="addToCart(s.primaryProduct)"
                          class="w-6 h-6 rounded-full bg-white text-slate-800 shadow-xs border border-slate-200 flex items-center justify-center hover:bg-[#18181b] hover:text-amber-400 active:scale-90 transition-all"
                          title="Add to cart"
                        >
                          <i class="fa-solid fa-plus text-[9px]"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Standard Product Cards Grid (For Other Tabs) -->
      <div v-else-if="filteredTabProducts.length > 0" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4 pb-12">
        <div
          v-for="product in filteredTabProducts"
          :key="product.productName"
          class="flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200/70 overflow-hidden relative group/card"
        >
          <!-- Image Area -->
          <div 
            class="relative w-full aspect-[4/5] bg-slate-50 cursor-pointer overflow-hidden"
            @click="$emit('open-image-popup', product)"
          >
            <!-- Out of Stock Overlay -->
            <div v-if="product.quantity <= 0" class="absolute inset-0 z-10 bg-slate-50/80 backdrop-blur-[2px] flex items-center justify-center">
              <span class="px-2.5 py-0.5 bg-slate-200 text-slate-500 text-[10px] font-bold rounded-full border border-slate-300">Out of Stock</span>
            </div>

            <CachedImage
              v-if="product.imageUrl"
              :src="getOptimizedImageUrl(product.imageUrl, 'w_350,h_450,c_fill')"
              alt="Product"
              class="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
            />
            <div v-else class="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
              <i class="fa-solid fa-image text-2xl opacity-20"></i>
            </div>

            <!-- Floating Cart Controls / Add Button on Image -->
            <div 
              v-if="getCartQty(product) > 0" 
              class="absolute bottom-2 right-2 z-20 flex items-center gap-1 p-0.5 bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-amber-200/80 animate-fade-in"
              @click.stop
            >
              <button 
                @click.stop="updateCart(product, -1)" 
                class="w-6 h-6 flex items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 active:scale-90 transition-all"
                title="Decrease"
              >
                <i class="fa-solid fa-minus text-[9px]"></i>
              </button>
              <span class="min-w-[16px] text-center text-xs font-black text-slate-900 px-0.5">
                {{ getCartQty(product) }}
              </span>
              <button 
                @click.stop="updateCart(product, 1)" 
                class="w-6 h-6 flex items-center justify-center rounded-full bg-[#18181b] text-amber-400 hover:bg-black active:scale-90 transition-all shadow-xs"
                title="Increase"
              >
                <i class="fa-solid fa-plus text-[9px]"></i>
              </button>
            </div>
            <button
              v-else-if="product.quantity > 0"
              @click.stop="addToCart(product)"
              class="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-white/95 text-slate-800 hover:bg-[#18181b] hover:text-amber-400 shadow-md border border-slate-200/60 flex items-center justify-center transition-all active:scale-90"
              title="Add to Cart"
            >
              <i class="fa-solid fa-plus text-[10px]"></i>
            </button>
          </div>

          <!-- Product Details -->
          <div class="p-2.5 flex flex-col flex-1">
            <h4 class="text-[11px] sm:text-xs font-bold text-slate-800 leading-snug line-clamp-1 group-hover/card:text-[#c59b27] transition-colors" :title="product.productName">
              {{ getCleanProductName(product.productName) }}
            </h4>

            <div class="flex items-center justify-between mt-1 text-[10px] text-slate-500">
              <span v-if="getProductColor(product.productName)" class="flex items-center gap-1 truncate max-w-[60px]">
                <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: getProductColor(product.productName).hex }"></span>
                <span class="capitalize truncate">{{ getProductColor(product.productName).text }}</span>
              </span>
              <span v-if="getProductSize(product.productName)" class="font-bold text-slate-600 px-1 rounded bg-slate-100">
                {{ getProductSize(product.productName) }}
              </span>
            </div>

            <div class="mt-2 flex items-baseline justify-between pt-1 border-t border-slate-100">
              <div class="text-xs sm:text-sm font-black text-slate-900">
                <span class="text-[10px] font-medium mr-[1px]">₹</span>{{ getPriceInfo(product.productName).price }}
              </div>
              <span class="text-[10px] font-bold text-slate-400">
                {{ product.quantity }} prs
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
        <i class="fa-solid fa-box-open text-4xl text-slate-300 mb-2"></i>
        <p class="text-sm font-bold text-slate-600">No products found in this category</p>
        <button @click="selectTab('All')" class="mt-3 px-4 py-2 bg-[#18181b] text-white text-xs font-bold rounded-xl">
          Back to All Products
        </button>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════
         FULL STOREFRONT SHOWCASE: Shown when activeTab === 'All'
         ══════════════════════════════════════════════════════════ -->
    <template v-else>
      <!-- 4. PARAGON 40% DISCOUNT STRIP: Eye-Catching Marquee -->
      <div class="mt-5 px-3 sm:px-6">
        <div 
          class="w-full h-14 sm:h-16 rounded-2xl overflow-hidden relative cursor-pointer bg-gradient-to-r from-red-600 via-red-700 to-red-600 shadow-md flex items-center group transition-transform duration-300 hover:scale-[1.01]"
          @click="selectTab('ParagonDiscount')"
        >
          <!-- Logo Section -->
          <div class="w-20 sm:w-28 h-full bg-white flex items-center justify-center rounded-r-2xl border-r-2 border-red-800 z-10 shadow-md px-2 shrink-0">
            <CachedImage
              :src="ParagonLogo"
              alt="Paragon"
              class="h-2/3 w-auto object-contain"
              transformations="w_200,c_fit"
            />
          </div>
          
          <!-- Moving Marquee Text -->
          <div class="flex-1 h-full overflow-hidden flex items-center relative">
            <div class="marquee-content text-white font-black font-['Clash_Display'] text-sm sm:text-lg tracking-wider uppercase drop-shadow-md flex whitespace-nowrap">
              <span class="mx-3">🌟 40% DISCOUNT ON SELECTED ARTICLES - TAP HERE 🌟</span>
              <span class="mx-3">🌟 40% DISCOUNT ON SELECTED ARTICLES - TAP HERE 🌟</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. NEW ARRIVALS: Horizontal Product Stack -->
      <section class="mt-6 px-3 sm:px-6 overflow-hidden">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="text-base sm:text-xl font-black font-['Clash_Display'] holographic-text uppercase">
              ✨ New Arrivals
            </span>
            <span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black">
              {{ getNewArrivalCount() }}
            </span>
          </div>
          <button 
            @click="selectTab('NewArrivals')"
            class="text-xs font-bold text-[#c59b27] hover:text-[#9e782f] transition-colors flex items-center gap-1 bg-amber-50/80 px-2.5 py-1 rounded-lg"
          >
            View All <i class="fa-solid fa-arrow-right text-[10px]"></i>
          </button>
        </div>

        <!-- Horizontal Auto-Scrolling Stack -->
        <div class="relative group/scroll w-full">
          <div 
            class="flex overflow-x-auto gap-3.5 pb-2 no-scrollbar"
            :ref="el => setScroller('new-arrivals', el)"
            @pointerdown="pauseScroll('new-arrivals')"
            @pointerup="resumeScroll('new-arrivals')"
            @pointerleave="resumeScroll('new-arrivals')"
            @touchstart.passive="pauseScroll('new-arrivals')"
            @touchend.passive="resumeScroll('new-arrivals')"
          >
            <!-- Duplicated block for seamless loop -->
            <template v-for="loopIndex in 2" :key="'na-loop-'+loopIndex">
              <!-- Hero Card -->
              <div 
                class="flex-shrink-0 w-[130px] sm:w-[190px] aspect-[4/5] sm:aspect-square rounded-2xl overflow-hidden relative group/hero cursor-pointer transition-transform duration-500 hover:scale-[1.02] bg-[#18181b]"
                @click="selectTab('NewArrivals')"
              >
                <CachedImage
                  v-if="getHeroImage()"
                  :src="getOptimizedImageUrl(getHeroImage(), 'w_500,h_600,c_fill')"
                  alt="New Arrivals"
                  class="w-full h-full object-cover rounded-2xl transition-transform duration-1000 group-hover/hero:scale-110 opacity-80"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                
                <div class="absolute bottom-3 left-3 right-3">
                  <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                    <span class="text-[8px] font-bold text-white uppercase tracking-widest">New Season</span>
                  </div>
                  <h3 class="text-sm sm:text-base font-black text-white leading-tight uppercase font-['Clash_Display']">Latest<br/>Arrivals</h3>
                  <div class="mt-2 flex items-center gap-1.5 text-white/70 group-hover/hero:text-white text-[11px] font-bold">
                    <span>Shop Collection</span>
                    <i class="fa-solid fa-arrow-right text-[9px] transition-transform group-hover/hero:translate-x-1"></i>
                  </div>
                </div>
              </div>

              <!-- Product Cards in Horizontal Row -->
              <div
                v-for="product in getNewArrivalProducts().slice(0, 12)"
                :key="'na-'+product.productName+'-'+loopIndex"
                class="flex-shrink-0 w-[125px] sm:w-[155px] flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-100 overflow-hidden relative group/card"
              >
                <!-- Image Area -->
                <div 
                  class="relative w-full aspect-[4/5] bg-slate-50 cursor-pointer overflow-hidden"
                  @click="$emit('open-image-popup', product)"
                >
                  <CachedImage
                    v-if="product.imageUrl"
                    :src="getOptimizedImageUrl(product.imageUrl, 'w_350,h_450,c_fill')"
                    alt="Product"
                    class="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                  />
                  <div v-else class="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                    <i class="fa-solid fa-image text-2xl opacity-20"></i>
                  </div>

                  <!-- Floating Cart Controls / Add Button on Image -->
                  <div 
                    v-if="getCartQty(product) > 0" 
                    class="absolute bottom-2 right-2 z-20 flex items-center gap-1 p-0.5 bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-amber-200/80 animate-fade-in"
                    @click.stop
                  >
                    <button 
                      @click.stop="updateCart(product, -1)" 
                      class="w-6 h-6 flex items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 active:scale-90 transition-all"
                      title="Decrease"
                    >
                      <i class="fa-solid fa-minus text-[9px]"></i>
                    </button>
                    <span class="min-w-[16px] text-center text-xs font-black text-slate-900 px-0.5">
                      {{ getCartQty(product) }}
                    </span>
                    <button 
                      @click.stop="updateCart(product, 1)" 
                      class="w-6 h-6 flex items-center justify-center rounded-full bg-[#18181b] text-amber-400 hover:bg-black active:scale-90 transition-all shadow-xs"
                      title="Increase"
                    >
                      <i class="fa-solid fa-plus text-[9px]"></i>
                    </button>
                  </div>
                  <button
                    v-else-if="product.quantity > 0"
                    @click.stop="addToCart(product)"
                    class="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-white/95 text-slate-800 hover:bg-[#18181b] hover:text-amber-400 shadow-md border border-slate-200/60 flex items-center justify-center transition-all active:scale-90"
                    title="Add to Cart"
                  >
                    <i class="fa-solid fa-plus text-[10px]"></i>
                  </button>
                </div>

                <!-- Product Details -->
                <div class="p-2 flex flex-col flex-1">
                  <h4 class="text-[11px] sm:text-xs font-bold text-slate-800 leading-snug line-clamp-1 group-hover/card:text-[#c59b27] transition-colors" :title="product.productName">
                    {{ getCleanProductName(product.productName) }}
                  </h4>

                  <div class="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                    <span v-if="getProductColor(product.productName)" class="flex items-center gap-1 truncate max-w-[50px]">
                      <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: getProductColor(product.productName).hex }"></span>
                      <span class="capitalize truncate">{{ getProductColor(product.productName).text }}</span>
                    </span>
                    <span v-if="getProductSize(product.productName)" class="font-bold text-slate-600 px-1 rounded bg-slate-100">
                      {{ getProductSize(product.productName) }}
                    </span>
                  </div>

                  <div class="mt-2 flex items-baseline justify-between pt-1 border-t border-slate-100">
                    <div class="text-xs sm:text-sm font-black text-slate-900">
                      <span class="text-[10px] font-medium mr-[1px]">₹</span>{{ getPriceInfo(product.productName).price }}
                    </div>
                    <span class="text-[10px] font-bold text-slate-400">
                      {{ product.quantity }} prs
                    </span>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </section>

      <!-- 6. BRAND PARAGONS GRID: Major Categories -->
      <section class="mt-8 px-3 sm:px-6">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xs font-extrabold uppercase tracking-widest text-slate-400">
            PARAGON COLLECTIONS
          </h2>
          <span class="text-[11px] font-bold text-amber-700">Official Range</span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <SlideshowCard
            v-for="card in paragonCards"
            :key="card.id"
            :card="card"
            :images="getParagonImages(card)"
            :count="getCount(card.groupNames)"
            aspectClass="aspect-[3/4]"
            @click="selectTab(card.id)"
          />
        </div>
      </section>

      <!-- 7. CURATED BRAND SHOWCASES WITH PRODUCTS BELOW -->
      <section class="mt-8 px-3 sm:px-6 space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-xs font-extrabold uppercase tracking-widest text-slate-400">
            FEATURED BRAND SHOWCASES
          </h2>
          <span class="text-[11px] font-bold text-amber-700">Live Inventory</span>
        </div>

        <!-- Each Big Brand Gallery -->
        <div
          v-for="brand in bigBrandCards"
          :key="brand.id"
          class="bg-white rounded-3xl p-3.5 sm:p-5 border border-slate-200/80 shadow-sm"
        >
          <!-- Brand Header -->
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <div class="h-8 sm:h-10 w-20 sm:w-28 bg-slate-50 rounded-xl p-1 border border-slate-100 flex items-center justify-center">
                <CachedImage
                  :src="brand.logo"
                  :alt="brand.label"
                  class="h-full w-auto object-contain"
                />
              </div>
              <div>
                <h3 class="text-base sm:text-lg font-black font-['Clash_Display'] text-slate-900 leading-none uppercase">
                  {{ brand.label }}
                </h3>
                <span class="text-[11px] text-slate-400 font-medium">
                  {{ getCount(brand.groupNames) }} items available
                </span>
              </div>
            </div>

            <button
              @click="selectTab(brand.id)"
              class="text-xs font-bold text-[#c59b27] hover:text-[#9e782f] flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-xl transition-colors"
            >
              View All <i class="fa-solid fa-arrow-right text-[9px]"></i>
            </button>
          </div>

          <!-- Horizontal Scroll of Products for This Brand -->
          <div class="overflow-x-auto no-scrollbar -mx-1 px-1">
            <div class="flex items-stretch gap-3 min-w-max pb-1">
              <div
                v-for="product in getBrandProducts(brand.groupNames).slice(0, 10)"
                :key="'brand-p-'+product.productName"
                class="w-[125px] sm:w-[150px] flex flex-col bg-slate-50/70 rounded-2xl border border-slate-200/60 overflow-hidden relative group/bcard hover:bg-white hover:shadow-md transition-all"
              >
                <div 
                  class="relative w-full aspect-[4/5] bg-white cursor-pointer overflow-hidden"
                  @click="$emit('open-image-popup', product)"
                >
                  <CachedImage
                    v-if="product.imageUrl"
                    :src="getOptimizedImageUrl(product.imageUrl, 'w_350,h_450,c_fill')"
                    alt="Product"
                    class="w-full h-full object-cover transition-transform duration-500 group-hover/bcard:scale-105"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center text-slate-300">
                    <i class="fa-solid fa-image text-xl opacity-20"></i>
                  </div>

                  <!-- Floating Cart Controls / Add Button on Image -->
                  <div 
                    v-if="getCartQty(product) > 0" 
                    class="absolute bottom-2 right-2 z-20 flex items-center gap-1 p-0.5 bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-amber-200/80 animate-fade-in"
                    @click.stop
                  >
                    <button 
                      @click.stop="updateCart(product, -1)" 
                      class="w-5 h-5 flex items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 active:scale-90 transition-all"
                      title="Decrease"
                    >
                      <i class="fa-solid fa-minus text-[8px]"></i>
                    </button>
                    <span class="min-w-[14px] text-center text-[11px] font-black text-slate-900 px-0.5">
                      {{ getCartQty(product) }}
                    </span>
                    <button 
                      @click.stop="updateCart(product, 1)" 
                      class="w-5 h-5 flex items-center justify-center rounded-full bg-[#18181b] text-amber-400 hover:bg-black active:scale-90 transition-all shadow-xs"
                      title="Increase"
                    >
                      <i class="fa-solid fa-plus text-[8px]"></i>
                    </button>
                  </div>
                  <button
                    v-else-if="product.quantity > 0"
                    @click.stop="addToCart(product)"
                    class="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-white text-slate-800 shadow border border-slate-200 flex items-center justify-center transition-all hover:bg-[#18181b] hover:text-amber-400 active:scale-90"
                    title="Add to Cart"
                  >
                    <i class="fa-solid fa-plus text-[9px]"></i>
                  </button>
                </div>

                <div class="p-2 flex flex-col flex-1">
                  <h4 class="text-[11px] font-bold text-slate-800 truncate" :title="product.productName">
                    {{ getCleanProductName(product.productName) }}
                  </h4>
                  <div class="mt-1 flex items-baseline justify-between">
                    <span class="text-xs font-black text-slate-900">₹{{ getPriceInfo(product.productName).price }}</span>
                    <span class="text-[10px] font-semibold text-slate-400">{{ product.quantity }} prs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 8. GENERAL PACKING: Bento/Masonry Design -->
      <section class="mt-8 px-3 sm:px-6">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xs font-extrabold uppercase tracking-widest text-slate-400">
            GENERAL PACKING
          </h2>
          <span class="text-[11px] font-bold text-amber-700">Bulk & Pairs</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <!-- Box Packing Card -->
          <div
            @click="selectTab('BoxPacking')"
            class="rounded-3xl p-5 bg-[#18181b] text-white cursor-pointer relative overflow-hidden group shadow-md hover:shadow-xl transition-all"
          >
            <div class="absolute -right-6 -bottom-6 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>
            <div class="relative z-10 flex items-start justify-between">
              <div>
                <span class="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                  Premium
                </span>
                <h3 class="text-2xl font-black font-['Clash_Display'] mt-2 uppercase leading-none text-white">
                  Box Packing
                </h3>
                <p class="text-xs text-slate-400 mt-1 font-medium">{{ getCount(boxGroupNames) }} Products Available</p>
              </div>
              <div class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-amber-400 text-lg group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-box"></i>
              </div>
            </div>
            <div class="mt-4 flex items-center gap-2 text-amber-400 text-xs font-bold">
              <span>Explore Box Packing</span>
              <i class="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition-transform"></i>
            </div>
          </div>

          <!-- Loose Packing Card -->
          <div
            @click="selectTab('LoosePacking')"
            class="rounded-3xl p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white cursor-pointer relative overflow-hidden group shadow-md hover:shadow-xl transition-all"
          >
            <div class="absolute -right-6 -bottom-6 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"></div>
            <div class="relative z-10 flex items-start justify-between">
              <div>
                <span class="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-wider border border-purple-500/30">
                  Economy
                </span>
                <h3 class="text-2xl font-black font-['Clash_Display'] mt-2 uppercase leading-none text-white">
                  Loose Packing
                </h3>
                <p class="text-xs text-slate-400 mt-1 font-medium">{{ getCount(looseGroupNames) }} Products Available</p>
              </div>
              <div class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-purple-400 text-lg group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-bag-shopping"></i>
              </div>
            </div>
            <div class="mt-4 flex items-center gap-2 text-purple-400 text-xs font-bold">
              <span>Explore Loose Packing</span>
              <i class="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition-transform"></i>
            </div>
          </div>
        </div>
      </section>

      <!-- 9. MID BRANDS SECTION -->
      <section class="mt-8 px-3 sm:px-6">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xs font-extrabold uppercase tracking-widest text-slate-400">
            MORE BRANDS
          </h2>
          <span class="text-[11px] font-bold text-amber-700">Explore Variety</span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
          <SlideshowCard
            v-for="card in midBrandCards"
            :key="card.id"
            :card="card"
            :images="getImages(card.groupNames, 4)"
            :count="getCount(card.groupNames)"
            aspectClass="aspect-[4/3]"
            @click="selectTab(card.id)"
          />
        </div>
      </section>

      <!-- 10. EXPLORE ALL CTA -->
      <div class="mt-10 mb-8 px-4 flex justify-center">
        <button 
          @click="selectTab('All')"
          class="group relative inline-flex items-center justify-center px-8 py-4 bg-[#18181b] text-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:bg-black active:scale-98 transition-all duration-300 w-full sm:w-auto"
        >
          <div class="relative flex items-center gap-3">
            <span class="font-['Clash_Display'] font-bold text-base sm:text-lg uppercase tracking-wider text-amber-400">
              Browse All Products
            </span>
            <i class="fa-solid fa-arrow-right text-base text-amber-400 transition-transform duration-300 group-hover:translate-x-2"></i>
          </div>
        </button>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, defineAsyncComponent } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import SlideshowCard from './SlideshowCard.vue';
import { isNewArrival, getOptimizedImageUrl, formatProductName } from '../../utils/formatters';
import { extractColor } from '../../utils/colors';

import { useAdmin } from '../../composables/useAdmin';
import { useStockData } from '../../composables/useStockData';
import { useCart } from '../../composables/useCart';

import { useAppStore } from '../../stores/appStore';
import { useCartStore } from '../../stores/cartStore';
import { storeToRefs } from 'pinia';

const CachedImage = defineAsyncComponent(() => import('./CachedImage.vue'));

const route = useRoute();
const router = useRouter();

const appStore = useAppStore();
const cartStore = useCartStore();
const { cleanView, searchQuery, lastSyncTime } = storeToRefs(appStore);
const { cartTotalItems } = storeToRefs(cartStore);

const { isAdmin, isSuperAdmin } = useAdmin();
const { stockData, loading: isSyncing, updateStockData } = useStockData();
const { addToCart, updateCart, getCartQty } = useCart();

const emit = defineEmits(['select-category', 'open-image-popup', 'open-catalog-gen', 'open-cart', 'promptAdminLogin']);

// UI States
const activeTab = ref('All');
const activeFilter = ref('all');
const inStockOnly = ref(false);
const maxPriceFilter = ref(null);
const localQuery = ref(searchQuery.value || '');
const showDropdown = ref(false);
const searchContainerRef = ref(null);
const selectedItem = ref(null);

watch(() => route.query, (query) => {
  if (query.brand) {
    activeTab.value = query.brand;
    searchQuery.value = '';
    localQuery.value = '';
    selectedItem.value = null;
  } else if (query.club) {
    activeTab.value = query.club;
    searchQuery.value = '';
    localQuery.value = '';
    selectedItem.value = null;
  } else if (query.q) {
    searchQuery.value = query.q;
    localQuery.value = query.q;
    selectedItem.value = null;
  }
}, { immediate: true });

watch(() => searchQuery.value, (newVal) => {
  if (!newVal) {
    localQuery.value = '';
    selectedItem.value = null;
  } else if (localQuery.value !== newVal) {
    localQuery.value = newVal;
  }
});

const handleSync = async () => {
  if (updateStockData) {
    await updateStockData();
  }
};

const formattedLastSync = computed(() => {
  if (!lastSyncTime.value) return '';
  const d = new Date(lastSyncTime.value);
  if (isNaN(d.getTime())) return '';
  return `Synced ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
});

// Auto-Scroll JS Engine for Native Swiping Freedom
const scrollers = ref(new Map());
const activeScrolls = ref(new Set());
let animationFrameId;
let lastTime = 0;

const setScroller = (id, el, direction = 1) => {
  if (el) {
    scrollers.value.set(id, { el, direction });
  } else {
    scrollers.value.delete(id);
  }
};

const pauseScroll = (id) => activeScrolls.value.add(id);
const resumeScroll = (id) => activeScrolls.value.delete(id);

const loopScroll = (time) => {
  if (!lastTime) lastTime = time;
  const delta = time - lastTime;
  lastTime = time;

  for (const [id, data] of scrollers.value.entries()) {
    if (activeScrolls.value.has(id)) continue;
    const { el, direction } = data;
    el.scrollLeft += (delta * 0.02 * direction);

    if (direction === 1) {
      if (el.scrollLeft >= el.scrollWidth / 2) {
        el.scrollLeft -= el.scrollWidth / 2;
      }
    } else {
      if (el.scrollLeft <= 0) {
        el.scrollLeft += el.scrollWidth / 2;
      }
    }
  }

  animationFrameId = requestAnimationFrame(loopScroll);
};

onMounted(() => {
  animationFrameId = requestAnimationFrame(loopScroll);
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  document.removeEventListener('click', handleClickOutside);
});

const handleClickOutside = (e) => {
  if (searchContainerRef.value && !searchContainerRef.value.contains(e.target)) {
    showDropdown.value = false;
  }
};

// Search Dropdown Autocomplete
const searchSuggestions = computed(() => {
  if (!localQuery.value || localQuery.value.trim().length < 2) return [];
  const q = localQuery.value.toLowerCase().trim();
  const parts = q.split(/\s+/).filter(Boolean);
  const matches = [];
  const seen = new Set();

  if (stockData.value) {
    for (const group of stockData.value) {
      if (group.products) {
        for (const p of group.products) {
          if (p.productName && !seen.has(p.productName)) {
            const pName = p.productName.toLowerCase();
            if (parts.every(part => pName.includes(part))) {
              seen.add(p.productName);
              matches.push(p);
              if (matches.length >= 8) return matches;
            }
          }
        }
      }
    }
  }
  return matches;
});

const handleSearchSubmit = (q) => {
  showDropdown.value = false;
  selectedItem.value = null; // Clear single-item selection to show all matching results
  const val = (q || localQuery.value || '').trim();
  searchQuery.value = val;
  localQuery.value = val;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleProductSelect = (product) => {
  showDropdown.value = false;
  selectedItem.value = product;
  searchQuery.value = product.productName;
  localQuery.value = product.productName;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const clearSearch = () => {
  selectedItem.value = null;
  searchQuery.value = '';
  localQuery.value = '';
  showDropdown.value = false;
};

const isSearchActive = computed(() => {
  return Boolean(searchQuery.value && searchQuery.value.trim().length > 0) || Boolean(selectedItem.value);
});

const searchResults = computed(() => {
  if (!searchQuery.value || !stockData.value) return [];
  const q = searchQuery.value.toLowerCase().trim();
  const parts = q.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return [];

  const list = [];
  const seen = new Set();

  for (const group of stockData.value) {
    if (group.products) {
      for (const p of group.products) {
        if (p.productName && !seen.has(p.productName)) {
          const pName = p.productName.toLowerCase();
          if (parts.every(part => pName.includes(part))) {
            seen.add(p.productName);
            list.push(p);
          }
        }
      }
    }
  }

  // Filter with In Stock Only (if explicitly toggled) & Max Price
  return list.filter(p => {
    if (inStockOnly.value && Number(p.quantity) <= 0) return false;
    if (maxPriceFilter.value) {
      const price = parseFloat(getPriceInfo(p.productName).price);
      if (!isNaN(price) && price > maxPriceFilter.value) return false;
    }
    return true;
  });
});

const otherSearchResults = computed(() => {
  if (!selectedItem.value) return searchResults.value;
  return searchResults.value.filter(p => p.productName !== selectedItem.value.productName);
});

// Brand Tabs Data (Zomato-Style Circular Icons)
const ParagonLogo = 'https://res.cloudinary.com/dg365ewal/image/upload/paragonLogo_rqk3hu.webp';
const AjantaLogo = `${import.meta.env.BASE_URL}assets/ajanta-logo.png`;

const brandTabs = [
  { id: 'All', label: 'All', icon: 'fa-solid fa-border-all', iconColor: 'text-[#c59b27]' },
  { id: 'NewArrivals', label: 'New Arrivals', icon: 'fa-solid fa-wand-magic-sparkles', iconColor: 'text-amber-500' },
  { id: 'PARAGON GENTS', label: 'Paragon Gents', image: ParagonLogo },
  { id: 'PARAGON LADIES', label: 'Paragon Ladies', image: ParagonLogo },
  { id: 'ParagonCore', label: 'Paragon Core', image: ParagonLogo },
  { id: 'ACTION', label: 'Action', image: 'https://res.cloudinary.com/dg365ewal/image/upload/v1768150265/action-logo_dzd5mq.png' },
  { id: 'EEKEN', label: 'Eeken', image: 'https://res.cloudinary.com/dg365ewal/image/upload/eekenLogo_rg5xwa.webp' },
  { id: 'AJANTA', label: 'Ajanta', image: AjantaLogo },
  { id: 'PARALITE', label: 'Paralite', image: ParagonLogo },
  { id: 'P-TOES PARALITE', label: 'P-Toes', image: ParagonLogo },
  { id: 'Cubix', label: 'Cubix', image: 'https://res.cloudinary.com/dg365ewal/image/upload/v1749667073/cubixLogo_bwawj3.jpg' },
  { id: 'Florex', label: 'Florex', image: 'https://res.cloudinary.com/dg365ewal/image/upload/florexLogo_sqgjln.png' },
  { id: 'Reliance', label: 'Reliance', image: 'https://res.cloudinary.com/dg365ewal/image/upload/v1749667072/relianceLogo_bvgwwz.png' },
  { id: 'BoxPacking', label: 'Box Packing', icon: 'fa-solid fa-box', iconColor: 'text-blue-500' },
  { id: 'LoosePacking', label: 'Loose Packing', icon: 'fa-solid fa-bag-shopping', iconColor: 'text-purple-500' },
  { id: 'ParagonDiscount', label: '40% Off', icon: 'fa-solid fa-tags', iconColor: 'text-red-500' },
  { id: 'Safety', label: 'Safety', icon: 'fa-solid fa-shield', iconColor: 'text-emerald-500' },
  { id: 'School', label: 'School', icon: 'fa-solid fa-graduation-cap', iconColor: 'text-indigo-500' },
  { id: 'Walkaholic', label: 'Walkaholic', icon: 'fa-solid fa-person-walking', iconColor: 'text-teal-500' },
];

const selectTab = (tabId) => {
  activeTab.value = tabId;
  selectedItem.value = null;
  searchQuery.value = '';
  localQuery.value = '';
  showDropdown.value = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const toggleInStockFilter = () => {
  inStockOnly.value = !inStockOnly.value;
  cleanView.value = inStockOnly.value;
};

const handlePriceFilter = (price) => {
  if (maxPriceFilter.value === price) {
    maxPriceFilter.value = null;
  } else {
    maxPriceFilter.value = price;
  }
};

// Helper Functions
const getPriceInfo = (name) => {
  if (!name) return { label: 'Net Rate', price: '?' };
  const match = name.match(/((?:RS|MRP|@))[\.\s]*(\d+(\.\d+)?)/i);
  if (match) {
    const prefix = match[1].toUpperCase();
    return { label: prefix === 'MRP' ? 'MRP' : 'Net Rate', price: match[2] };
  }
  const fallback = name.match(/(\d+(\.\d+)?)(?!.*\d)/);
  return { label: 'Net Rate', price: fallback ? fallback[0] : '?' };
};

const getProductSize = (name) => {
  if (!name) return null;
  const match = name.match(/(?:^|[\s\(])(\d{1,2})\s*[xX*]\s*(\d{1,2})(?:[\s\)]|$)/);
  if (match) {
    const n1 = parseInt(match[1]);
    const n2 = parseInt(match[2]);
    return `${Math.min(n1, n2)}x${Math.max(n1, n2)}`;
  }
  return null;
};

const getProductColor = (name) => extractColor(name);

const getCleanProductName = (name) => {
  if (!name) return '';
  let clean = name;
  const colorData = extractColor(name);
  if (colorData && colorData.originalTokens) {
    colorData.originalTokens.forEach(token => {
      clean = clean.replace(new RegExp(`\\b${token}\\b`, 'gi'), '');
    });
  }
  clean = clean.replace(/((?:RS|MRP|@))[\.\s]*(\d+(\.\d+)?)/gi, '');
  clean = clean.replace(/(?:^|[\s\(])(\d{1,2})\s*[xX*]\s*(\d{1,2})(?:[\s\)]|$)/g, ' ');
  clean = clean.replace(/\(\s*\)/g, '').replace(/[\/\-\.]+\s*$/g, '').replace(/^\s*[\/\-\.]+/g, '').replace(/\s*[\/\-\.]+\s*/g, ' ');
  return formatProductName(clean.replace(/\s+/g, ' ').trim());
};

// Data Collection Functions
const getNewArrivalProducts = () => {
  let products = [];
  if (!stockData.value) return products;
  for (const group of stockData.value) {
    if (group.products) {
      for (const p of group.products) {
        if (cleanView.value) {
          if (!p.imageUrl || Number(p.quantity) < 4) continue;
        }
        if (isNewArrival(p) && p.imageUrl) products.push(p);
      }
    }
  }
  return products.sort((a,b) => {
    const dateA = new Date(a.firstSeenAt || a.imageUploadedAt || 0);
    const dateB = new Date(b.firstSeenAt || b.imageUploadedAt || 0);
    return dateB - dateA;
  });
};

const getNewArrivalCount = () => {
  return getNewArrivalProducts().length;
};

const getHeroImage = () => {
  const list = getNewArrivalProducts();
  if (list.length > 0 && list[0].imageUrl) return list[0].imageUrl;
  return null;
};

const getBrandProducts = (groupNames) => {
  let products = [];
  if (!stockData.value || !groupNames) return products;
  const lower = groupNames.map(n => n.toLowerCase());
  for (const group of stockData.value) {
    if (lower.includes(group.groupName.toLowerCase()) && group.products) {
      for (const p of group.products) {
        if (cleanView.value) {
          if (!p.imageUrl || Number(p.quantity) < 4) continue;
        }
        if (p.imageUrl) products.push(p);
      }
    }
  }
  return products;
};

// Dynamic Category Products for Selected Bubble
const getActiveTabProducts = () => {
  if (activeTab.value === 'All') return [];
  if (!stockData.value) return [];

  let products = [];
  const tab = activeTab.value;

  if (tab === 'NewArrivals') {
    products = getNewArrivalProducts();
  } else if (tab === 'ParagonDiscount') {
    products = getBrandProducts(['PARAGON GENTS 40%', 'SOLEA DISC 40% OFFER']);
  } else if (tab === 'BoxPacking') {
    products = getBrandProducts(boxGroupNames);
  } else if (tab === 'LoosePacking') {
    products = getBrandProducts(looseGroupNames);
  } else if (tab === 'ParagonCore') {
    products = getBrandProducts(['PARAGON GENTS', 'PARAGON LADIES', 'PARALITE', 'P-TOES', 'Hawai Chappal']);
  } else if (tab === 'PARAGON GENTS') {
    products = getBrandProducts(['PARAGON GENTS', 'PARAGON GENTS 40%']);
  } else if (tab === 'PARAGON LADIES') {
    products = getBrandProducts(['PARAGON LADIES']);
  } else if (tab === 'PARALITE') {
    products = getBrandProducts(['PARALITE', 'PARALITE OLD', 'P-TOES PARALITE']);
  } else if (tab === 'P-TOES PARALITE' || tab === 'P-TOES') {
    products = getBrandProducts(['P-TOES', 'P-TOES PARALITE']);
  } else if (tab === 'ACTION') {
    products = getBrandProducts(['ACTION']);
  } else if (tab === 'EEKEN') {
    products = getBrandProducts(['EEKEN']);
  } else if (tab === 'AJANTA') {
    products = getBrandProducts(['AJANTA', 'AJANTA FOOTWEAR']);
  } else if (tab === 'Cubix') {
    products = getBrandProducts(['CUBIX', 'CUBIX 2']);
  } else if (tab === 'Florex') {
    products = getBrandProducts(['Florex (Swastik)']);
  } else if (tab === 'Reliance') {
    products = getBrandProducts(['RELIANCE FOOTWEAR']);
  } else if (tab === 'Safety') {
    products = getBrandProducts(['Safety']);
  } else if (tab === 'School') {
    products = getBrandProducts(['School', 'SCHOOL SHOE DUROLITE']);
  } else if (tab === 'Walkaholic') {
    products = getBrandProducts(['Walkaholic']);
  } else {
    products = getBrandProducts([tab]);
  }

  // Apply In Stock & Price Filters
  return products.filter(p => {
    if (cleanView.value) {
      if (!p.imageUrl || Number(p.quantity) < 4) return false;
    }
    if (inStockOnly.value && Number(p.quantity) <= 0) return false;
    if (maxPriceFilter.value) {
      const price = parseFloat(getPriceInfo(p.productName).price);
      if (!isNaN(price) && price > maxPriceFilter.value) return false;
    }
    return true;
  });
};

const filteredTabProducts = computed(() => getActiveTabProducts());

const paragonCoreDefinitions = [
  { id: '1136', name: 'Paragon 1136 Gents', category: 'PU Daily Slippers', img: 'https://res.cloudinary.com/dg365ewal/image/upload/v1787900427/Core-1136_rbynmk.png', match: (p) => p.productName.includes('1136') },
  { id: '1170', name: 'Paragon 1170 Ladies', category: 'Ladies PU Slippers', img: 'https://res.cloudinary.com/dg365ewal/image/upload/v1787900426/Core-1170_ez7zfr.png', match: (p) => p.productName.includes('1170') },
  { id: '1180', name: 'P-Toes 1180 Boys', category: 'Boys & Junior Footwear', img: 'https://res.cloudinary.com/dg365ewal/image/upload/v1787900424/Core-1180_bving9.png', match: (p) => p.productName.includes('1180') },
  { id: '1181', name: 'P-Toes 1181 Boys', category: 'Boys & Junior Footwear', img: 'https://res.cloudinary.com/dg365ewal/image/upload/v1787900429/Core-1181_kaddpn.png', match: (p) => p.productName.includes('1181') },
  { id: '1190', name: 'Paralite 1190 Gents', category: 'Lightweight Daily Slipper', img: 'https://res.cloudinary.com/dg365ewal/image/upload/v1787900424/Core-1190_daqseh.png', match: (p) => p.productName.includes('1190') },
  { id: '1210', name: 'Paragon 1210 Gents', category: 'Everyday Comfort PU', img: 'https://res.cloudinary.com/dg365ewal/image/upload/v1787900428/Core-1210_wvvf5q.png', match: (p) => p.productName.includes('1210') },
  { id: '1215', name: 'Paragon 1215 Ladies', category: 'Women Daily PU Comfort', img: 'https://res.cloudinary.com/dg365ewal/image/upload/v1787900428/Core-1215_n934pm.png', match: (p) => p.productName.includes('1215') },
  { id: '1220', name: 'Paragon 1220 Ladies', category: 'Women Daily PU Comfort', img: 'https://res.cloudinary.com/dg365ewal/image/upload/v1787900426/Core-1220_bzdakk.png', match: (p) => p.productName.includes('1220') },
  { id: '1250_bkr', name: 'Paragon 1250 BKR', category: 'Men Classic Black-Red', img: 'https://res.cloudinary.com/dg365ewal/image/upload/v1787900426/Core-1250-BKR_y691z2.png', match: (p) => p.productName.includes('1250') && (p.productName.toUpperCase().includes('BKR') || !p.productName.toUpperCase().includes('TQN')) },
  { id: '1250_tqn', name: 'Paragon 1250 TQN', category: 'Men Turquoise-Navy', img: 'https://res.cloudinary.com/dg365ewal/image/upload/v1787900427/Core-1250-TQN_foqv2b.png', match: (p) => p.productName.includes('1250') && p.productName.toUpperCase().includes('TQN') },
  { id: '1251_bkr', name: 'Paragon 1251 BKR', category: 'Men Classic Black-Red', img: 'https://res.cloudinary.com/dg365ewal/image/upload/v1787900425/Core-1251-BKR_ey6ugu.png', match: (p) => p.productName.includes('1251') },
  { id: '16048_blk', name: 'Paralite 16048 BLK', category: 'Men Light PU Black', img: 'https://res.cloudinary.com/dg365ewal/image/upload/v1787900429/Core-16048-BLK_g95bqr.png', match: (p) => p.productName.includes('16048') && (p.productName.toUpperCase().includes('BLK') || !p.productName.toUpperCase().includes('MIG')) },
  { id: '16048_mig', name: 'Paralite 16048 MIG', category: 'Men Light PU Mint-Grey', img: 'https://res.cloudinary.com/dg365ewal/image/upload/v1787900424/Core-16048-MIG_tu7lm5.png', match: (p) => p.productName.includes('16048') && p.productName.toUpperCase().includes('MIG') },
  { id: '16049_blk', name: 'Paralite 16049 BLK', category: 'Men Light PU Black', img: 'https://res.cloudinary.com/dg365ewal/image/upload/v1787900425/Core-16049-BLK_m9hwdx.png', match: (p) => p.productName.includes('16049') && (p.productName.toUpperCase().includes('BLK') || !p.productName.toUpperCase().includes('RYB')) },
  { id: '16049_ryb', name: 'Paralite 16049 RYB', category: 'Men Light PU Royal Blue', img: 'https://res.cloudinary.com/dg365ewal/image/upload/v1787900424/Core-16049-RYB_gw7p37.png', match: (p) => p.productName.includes('16049') && p.productName.toUpperCase().includes('RYB') },
  { id: 'cushion', name: 'Paragon Cushion Hawai', category: 'Classic Daily Hawai', img: 'https://res.cloudinary.com/dg365ewal/image/upload/v1787900426/Core-cushion_impiqy.png', match: (p) => p.productName.toUpperCase().includes('CUSHION') && !p.productName.includes('1136') && !p.productName.includes('1210') }
];

function standardizeCoreSize(name) {
  const m = name.match(/\(\s*(\d+\s*[\*xX\-]\s*\d+)\s*\)/i) ||
            name.match(/\b(\d+\s*[\*xX\-]\s*\d+)\b/i) ||
            name.match(/\b(\d+)\s*no\b/i);
  if (m) {
    let s = m[1].replace(/\s+/g, '').replace(/[\*X]/g, 'x');
    if (s.startsWith('0')) s = s.substring(1);
    return s;
  }
  return 'Standard';
}

function parseCorePrice(name) {
  const m = name.match(/mrp\s*[:\.]?\s*(\d+(\.\d+)?)/i) || 
            name.match(/rs\s*[:\.]?\s*(\d+(\.\d+)?)/i) || 
            name.match(/@\s*(\d+(\.\d+)?)/i);
  return m ? parseFloat(m[1]) : 0;
}

const paragonCoreList = computed(() => {
  if (!stockData.value) return [];

  return paragonCoreDefinitions.map(def => {
    const matched = [];
    stockData.value.forEach(g => {
      if (g.products) {
        g.products.forEach(p => {
          if (def.match(p)) {
            matched.push(p);
          }
        });
      }
    });

    const sizeGroups = {};
    matched.forEach(p => {
      const size = standardizeCoreSize(p.productName);
      const price = parseCorePrice(p.productName);
      if (!sizeGroups[size]) {
        sizeGroups[size] = {
          size,
          totalQty: 0,
          price: price || 0,
          primaryProduct: p,
          products: []
        };
      }
      sizeGroups[size].totalQty += (Number(p.quantity) || 0);
      sizeGroups[size].products.push(p);
      if (Number(p.quantity) > 0 && (!sizeGroups[size].primaryProduct || Number(sizeGroups[size].primaryProduct.quantity) <= 0)) {
        sizeGroups[size].primaryProduct = p;
        if (price > 0) sizeGroups[size].price = price;
      }
    });

    let sizes = Object.values(sizeGroups).sort((a,b) => b.totalQty - a.totalQty);
    
    if (inStockOnly.value) {
      sizes = sizes.filter(s => s.totalQty > 0);
    }
    if (maxPriceFilter.value) {
      sizes = sizes.filter(s => s.price === 0 || s.price <= maxPriceFilter.value);
    }

    const totalStock = sizes.reduce((sum, s) => sum + s.totalQty, 0);

    return {
      ...def,
      totalStock,
      sizes
    };
  }).filter(core => {
    if (cleanView.value && core.totalStock <= 0) return false;
    if (inStockOnly.value && core.totalStock <= 0) return false;
    return true;
  });
});

const getActiveTabLabel = () => {
  const found = brandTabs.find(t => t.id === activeTab.value);
  return found ? found.label : activeTab.value;
};

const getParagonImages = (card) => {
  return localCarousals[card.id] || [];
};

const getImages = (groupNames, limit=5) => {
  return [];
};

const getCount = (groupNames) => {
  if (!stockData.value || !groupNames) return 0;
  let count = 0;
  const lower = groupNames.map(n => n.toLowerCase());
  stockData.value.forEach(g => {
    if (lower.includes(g.groupName.toLowerCase())) {
      count += g.products ? g.products.length : 0;
    }
  });
  return count;
};

const localCarousals = {
  'ParagonCore': [
    'https://res.cloudinary.com/dg365ewal/image/upload/v1787900427/Core-1136_rbynmk.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/v1787900426/Core-1170_ez7zfr.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/v1787900424/Core-1180_bving9.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/v1787900429/Core-1181_kaddpn.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/v1787900424/Core-1190_daqseh.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/v1787900428/Core-1210_wvvf5q.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/v1787900428/Core-1215_n934pm.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/v1787900426/Core-1220_bzdakk.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/v1787900426/Core-1250-BKR_y691z2.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/v1787900427/Core-1250-TQN_foqv2b.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/v1787900425/Core-1251-BKR_ey6ugu.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/v1787900429/Core-16048-BLK_g95bqr.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/v1787900424/Core-16048-MIG_tu7lm5.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/v1787900425/Core-16049-BLK_m9hwdx.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/v1787900424/Core-16049-RYB_gw7p37.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/v1787900426/Core-cushion_impiqy.png'
  ],
  'EEKEN': [
    'https://res.cloudinary.com/dg365ewal/image/upload/Eeken-1.jpg',
    'https://res.cloudinary.com/dg365ewal/image/upload/Eeken-2.jpg',
    'https://res.cloudinary.com/dg365ewal/image/upload/Eeken-3.jpg'
  ],
  'PARALITE': [
    'https://res.cloudinary.com/dg365ewal/image/upload/v1787900426/Core-1220_bzdakk.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/v1787900426/Core-1250-BKR_y691z2.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/v1787900429/Core-16048-BLK_g95bqr.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/Paralite.jpg'
  ],
  'PARAGON GENTS': [
    'https://res.cloudinary.com/dg365ewal/image/upload/v1787900427/Core-1136_rbynmk.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/v1787900428/Core-1210_wvvf5q.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/Paragon-gents-1.jpg',
    'https://res.cloudinary.com/dg365ewal/image/upload/Paragon-gents-2.jpg'
  ],
  'PARAGON LADIES': [
    'https://res.cloudinary.com/dg365ewal/image/upload/v1787900426/Core-1170_ez7zfr.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/v1787900426/Core-1220_bzdakk.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/Paragon-ladies-1.jpg',
    'https://res.cloudinary.com/dg365ewal/image/upload/Paragon-ladies-2.jpg'
  ],
  'P-TOES PARALITE': [
    'https://res.cloudinary.com/dg365ewal/image/upload/v1787900424/Core-1180_bving9.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/v1787900424/Core-1190_daqseh.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/P-toes.png'
  ],
  'Safety': ['https://res.cloudinary.com/dg365ewal/image/upload/Boot-1.jpg'],
  'School': ['https://res.cloudinary.com/dg365ewal/image/upload/paragon-school.jpg'],
  'Walkaholic': [
    'https://res.cloudinary.com/dg365ewal/image/upload/v1787900444/3603_Turquoise_xeir3c.jpg',
    'https://res.cloudinary.com/dg365ewal/image/upload/v1787900475/1987_Mehandi_fk1gou.jpg',
    'https://res.cloudinary.com/dg365ewal/image/upload/v1787900444/1975_Maroon_ez1kuc.jpg',
    'https://res.cloudinary.com/dg365ewal/image/upload/v1787900443/16054_Red_tg6zft.jpg',
    'https://res.cloudinary.com/dg365ewal/image/upload/v1787900443/1933_Orange_oqlrrs.jpg',
    'https://res.cloudinary.com/dg365ewal/image/upload/Walkaholic.png'
  ],
  'Max': ['https://res.cloudinary.com/dg365ewal/image/upload/Max.jpg'],
  'Escoute': ['https://res.cloudinary.com/dg365ewal/image/upload/Escoute.jpg'],
  'LoosePacking': ['https://res.cloudinary.com/dg365ewal/image/upload/loose.png'],
  'BoxPacking': ['https://res.cloudinary.com/dg365ewal/image/upload/box.png']
};

const looseGroupNames = ['ASHU', 'PANKAJ PLASTIC', 'TARA', 'J.K Plastic', 'MAGNET', 'MARUTI PLASTICS', 'AAGAM POLYMER', 'A G ENTERPRISES', 'NAV DURGA ENTERPRISES', 'NEXUS', 'R K TRADERS', 'SRG ENTERPRISES', 'VARDHMAN PLASTICS', 'YASH FOOTWEAR', 'KRISHNA AGENCY', 'SHYAM', 'AVTAR V V POLYMERS', 'ATHARV PLASTIC'];
const boxGroupNames = ['Mini F/w', 'ADDA', 'ADDOXY', 'AIRFAX', 'HITWAY', 'PARIS', 'TEUZ', 'VAISHNO PLASTIC', 'AGRA', 'R R POLYPLAST', 'AIRSON', 'AMBIKA FOOTWEAR', 'GOKUL FOOTWEAR', 'NEXGEN FOOTWEAR', 'Kohinoor', 'UAM FOOTWEAR', 'BROCKKIE'];

const paragonCards = [
  { id: 'ParagonCore', label: 'Paragon Core', groupNames: ['PARAGON GENTS', 'PARAGON LADIES', 'PARALITE', 'P-TOES', 'Hawai Chappal'] },
  { id: 'EEKEN', label: 'Eeken', groupNames: ['EEKEN'] },
  { id: 'PARALITE', label: 'Paralite', groupNames: ['PARALITE', 'PARALITE OLD', 'P-TOES PARALITE'] },
  { id: 'LoosePacking', label: 'Loose Packing', groupNames: looseGroupNames },
  { id: 'BoxPacking', label: 'Box Packing', groupNames: boxGroupNames },
  { id: 'PARAGON GENTS', label: 'Paragon Gents', groupNames: ['PARAGON GENTS', 'PARAGON GENTS 40%'] },
  { id: 'PARAGON LADIES', label: 'Paragon Ladies', groupNames: ['PARAGON LADIES'] },
  { id: 'P-TOES PARALITE', label: 'P-Toes', groupNames: ['P-TOES PARALITE'] },
  { id: 'Safety', label: 'Safety Shoes', groupNames: ['Safety'] },
  { id: 'School', label: 'School Shoes', groupNames: ['School', 'SCHOOL SHOE DUROLITE'] },
  { id: 'Walkaholic', label: 'Walkaholic', groupNames: ['Walkaholic'] },
  { id: 'Max', label: 'Max', groupNames: ['Max'] },
  { id: 'Escoute', label: 'Escoute', groupNames: ['Escoute'] },
];

const bigBrandCards = [
  { id: 'Cubix', label: 'Cubix', groupNames: ['CUBIX', 'CUBIX 2'], logo: 'https://res.cloudinary.com/dg365ewal/image/upload/v1749667073/cubixLogo_bwawj3.jpg' },
  { id: 'Florex', label: 'Florex', groupNames: ['Florex (Swastik)'], logo: 'https://res.cloudinary.com/dg365ewal/image/upload/florexLogo_sqgjln.png' },
  { id: 'ACTION', label: 'Action', groupNames: ['ACTION'], logo: 'https://res.cloudinary.com/dg365ewal/image/upload/v1768150265/action-logo_dzd5mq.png' },
  { id: 'Reliance', label: 'Reliance', groupNames: ['RELIANCE FOOTWEAR'], logo: 'https://res.cloudinary.com/dg365ewal/image/upload/v1749667072/relianceLogo_bvgwwz.png' },
  { id: 'EEKEN', label: 'Eeken', groupNames: ['EEKEN'], logo: 'https://res.cloudinary.com/dg365ewal/image/upload/eekenLogo_rg5xwa.webp' },
];

const midBrandCards = [
  { id: 'AIRFAX', label: 'Airfax', groupNames: ['AIRFAX'], icon: 'fa-solid fa-wind' },
  { id: 'TEUZ', label: 'Teuz', groupNames: ['TEUZ'], icon: 'fa-solid fa-bolt' },
  { id: 'PARIS', label: 'Paris', groupNames: ['PARIS'], icon: 'fa-solid fa-star' },
  { id: 'HITWAY', label: 'Hitway', groupNames: ['HITWAY'], icon: 'fa-solid fa-rocket' },
  { id: 'PANKAJ PLASTIC', label: 'Pankaj', groupNames: ['PANKAJ PLASTIC'], icon: 'fa-solid fa-shoe-prints' },
  { id: 'VAISHNO PLASTIC', label: 'Vaishno', groupNames: ['VAISHNO PLASTIC'], icon: 'fa-solid fa-gem' },
  { id: 'TARA', label: 'Tara', groupNames: ['TARA'], icon: 'fa-solid fa-moon' },
  { id: 'ADDA', label: 'Adda', groupNames: ['ADDA'], icon: 'fa-solid fa-sun' },
  { id: 'ASHU', label: 'Ashu', groupNames: ['ASHU'], icon: 'fa-solid fa-leaf' },
  { id: 'ADDOXY', label: 'Addoxy', groupNames: ['ADDOXY'], icon: 'fa-solid fa-shield' },
];
</script>

<style scoped>
@keyframes marquee {
  0% { transform: translateX(0%); }
  100% { transform: translateX(-50%); }
}
.marquee-content {
  animation: marquee 10s linear infinite;
}
.group:hover .marquee-content {
  animation-play-state: paused;
}

@keyframes bounceSubtle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
.animate-bounce-subtle {
  animation: bounceSubtle 2s ease-in-out infinite;
}
</style>

