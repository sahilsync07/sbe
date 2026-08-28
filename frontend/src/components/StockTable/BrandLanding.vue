<template>
  <div class="brand-landing pb-24 text-slate-900 font-sans">
    
    <!-- ══════════════════════════════════════════════════════════
         1. TOP BAR: Zomato-Style Location Header & Cart
         ══════════════════════════════════════════════════════════ -->
    <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100/80 px-3 sm:px-6 pt-2.5 pb-2 transition-all">
      <div class="flex items-center justify-between gap-3">
        <!-- Left: Location Info (Zomato Style) -->
        <div class="flex items-center gap-2.5 min-w-0 cursor-pointer select-none group" @click="$emit('select-category', 'All')">
          <div class="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#c59b27] shrink-0 shadow-sm transition-transform group-hover:scale-105">
            <i class="fa-solid fa-location-dot text-red-600 text-base animate-bounce-subtle"></i>
          </div>
          <div class="flex flex-col min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="text-sm sm:text-base font-black text-slate-900 tracking-tight font-['Clash_Display'] truncate">
                Sri Brundabana Enterprises
              </span>
              <i class="fa-solid fa-chevron-down text-[10px] text-slate-400 shrink-0"></i>
            </div>
            <div class="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 truncate">
              <span class="text-amber-700 font-semibold">Rayagada</span>
              <span class="w-1 h-1 rounded-full bg-slate-300"></span>
              <span class="text-slate-400">Official Store</span>
            </div>
          </div>
        </div>

        <!-- Right: Shopping Bag Cart Button -->
        <div class="flex items-center gap-2 shrink-0">
          <button
            @click="appStore.toggleCart(true)"
            class="relative w-10 h-10 rounded-full bg-[#18181b] text-white flex items-center justify-center transition-all hover:bg-black active:scale-95 shadow-md shadow-black/10"
            title="View Cart"
          >
            <div v-if="cartTotalItems > 0" class="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-black h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full ring-2 ring-white animate-pulse">
              {{ cartTotalItems }}
            </div>
            <i class="fa-solid fa-bag-shopping text-sm text-amber-400"></i>
          </button>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════
           2. SEARCH BAR: Zomato-Style with Clean View Switch
           ══════════════════════════════════════════════════════════ -->
      <div class="mt-2.5 relative" ref="searchContainerRef">
        <div class="flex items-center gap-2 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-1 pl-3.5 focus-within:border-[#c59b27] focus-within:ring-2 focus-within:ring-amber-500/10 transition-all">
          <i class="fa-solid fa-magnifying-glass text-slate-400 text-sm shrink-0"></i>
          
          <input
            v-model="localQuery"
            @focus="showDropdown = true"
            @keydown.enter="handleSearchSubmit(localQuery)"
            type="text"
            placeholder="Search products..."
            class="flex-1 min-w-0 bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none py-1.5"
          />

          <button
            v-if="localQuery"
            @click="localQuery = ''; showDropdown = false"
            class="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 shrink-0"
          >
            <i class="fa-solid fa-xmark text-xs"></i>
          </button>

          <!-- Vertical Divider -->
          <div class="h-6 w-px bg-slate-200 shrink-0 mx-0.5"></div>

          <!-- Clean View Switch (Zomato VEG MODE Style) -->
          <button
            @click="cleanView = !cleanView"
            type="button"
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all select-none shrink-0"
            :class="cleanView ? 'bg-amber-50 border border-amber-300/80 text-amber-900' : 'bg-slate-50 border border-slate-200/70 text-slate-500'"
            title="Toggle Images Only & In Stock"
          >
            <div class="flex flex-col text-right leading-none">
              <span class="text-[9px] font-black uppercase tracking-wider" :class="cleanView ? 'text-amber-800' : 'text-slate-600'">CLEAN</span>
              <span class="text-[8px] font-bold" :class="cleanView ? 'text-amber-600' : 'text-slate-400'">VIEW</span>
            </div>
            <!-- Custom Toggle Pill -->
            <div
              class="w-7 h-4 rounded-full p-0.5 transition-colors relative"
              :class="cleanView ? 'bg-[#c59b27]' : 'bg-slate-300'"
            >
              <div
                class="w-3 h-3 rounded-full bg-white shadow-sm transition-transform"
                :class="cleanView ? 'translate-x-3' : 'translate-x-0'"
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
                  <div class="text-sm font-bold text-slate-800 truncate">Search for "{{ localQuery.trim() }}"</div>
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

      <!-- ══════════════════════════════════════════════════════════
           3. BRAND TABS: Circular Brand Icons (Zomato Category Bar)
           ══════════════════════════════════════════════════════════ -->
      <div class="mt-2.5 -mx-3 sm:-mx-6 px-3 sm:px-6 overflow-x-auto no-scrollbar border-t border-slate-100/60 pt-2">
        <div class="flex items-center gap-4 sm:gap-6 min-w-max pb-1">
          <button
            v-for="tab in brandTabs"
            :key="tab.id"
            @click="selectTab(tab.id)"
            class="flex flex-col items-center gap-1.5 group select-none transition-all relative pb-2"
          >
            <!-- Circle Thumbnail / Badge -->
            <div
              class="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center p-2 transition-all duration-300 relative"
              :class="activeTab === tab.id ? 'ring-2 ring-[#c59b27] ring-offset-2 bg-amber-50/50 shadow-md scale-105' : 'bg-slate-50 border border-slate-200/80 hover:bg-slate-100/80 hover:scale-102'"
            >
              <img
                v-if="tab.image"
                :src="tab.image"
                :alt="tab.label"
                class="w-full h-full object-contain transition-transform group-hover:scale-110"
              />
              <div v-else-if="tab.icon" class="text-xl" :class="tab.iconColor || 'text-slate-700'">
                <i :class="tab.icon"></i>
              </div>
            </div>

            <!-- Tab Label -->
            <span
              class="text-xs font-bold tracking-tight transition-colors whitespace-nowrap"
              :class="activeTab === tab.id ? 'text-slate-900 font-extrabold' : 'text-slate-600 group-hover:text-slate-900'"
            >
              {{ tab.label }}
            </span>

            <!-- Zomato-Style Active Underline Indicator -->
            <div
              v-if="activeTab === tab.id"
              class="absolute bottom-0 left-2 right-2 h-0.5 bg-[#c59b27] rounded-full shadow-sm"
            ></div>
          </button>
        </div>
      </div>
    </header>

    <!-- ══════════════════════════════════════════════════════════
         4. STICKY FILTER PILLS: Quick Filter Chips Bar
         ══════════════════════════════════════════════════════════ -->
    <div class="sticky top-[138px] sm:top-[146px] z-30 bg-[#fcfbf9]/95 backdrop-blur-md py-2.5 px-3 sm:px-6 border-b border-slate-200/50">
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
          @click="$emit('select-category', 'ParagonDiscount')"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-all shrink-0 shadow-sm"
        >
          <i class="fa-solid fa-tag text-[10px]"></i>
          <span>40% Off Paragon</span>
        </button>

        <!-- Box Packing -->
        <button
          @click="$emit('select-category', 'BoxPacking')"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all shrink-0 shadow-sm"
        >
          <i class="fa-solid fa-box text-[10px] text-blue-500"></i>
          <span>Box Packing</span>
        </button>

        <!-- Loose Packing -->
        <button
          @click="$emit('select-category', 'LoosePacking')"
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
         6. PARAGON 40% DISCOUNT STRIP: Eye-Catching Marquee
         ══════════════════════════════════════════════════════════ -->
    <div class="mt-5 px-3 sm:px-6">
      <div 
        class="w-full h-14 sm:h-16 rounded-2xl overflow-hidden relative cursor-pointer bg-gradient-to-r from-red-600 via-red-700 to-red-600 shadow-md flex items-center group transition-transform duration-300 hover:scale-[1.01]"
        @click="$emit('select-category', 'ParagonDiscount')"
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

    <!-- ══════════════════════════════════════════════════════════
         7. NEW ARRIVALS: Horizontal Product Stack
         ══════════════════════════════════════════════════════════ -->
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
          @click="$emit('select-category', 'NewArrivals')"
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
              @click="$emit('select-category', 'NewArrivals')"
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

                <!-- Floating Add Button on Image -->
                <button
                  v-if="product.quantity > 0"
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

    <!-- ══════════════════════════════════════════════════════════
         8. BRAND PARAGONS GRID: Major Categories
         ══════════════════════════════════════════════════════════ -->
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
          @click="$emit('select-category', card.id)"
        />
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════
         9. CURATED BRAND SHOWCASES WITH PRODUCTS BELOW
         ══════════════════════════════════════════════════════════ -->
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
            @click="$emit('select-category', brand.id)"
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

                <!-- Add to cart -->
                <button
                  v-if="product.quantity > 0"
                  @click.stop="addToCart(product)"
                  class="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-white text-slate-800 shadow border border-slate-200 flex items-center justify-center transition-all hover:bg-[#18181b] hover:text-amber-400 active:scale-90"
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

    <!-- ══════════════════════════════════════════════════════════
         10. GENERAL PACKING: Bento/Masonry Design
         ══════════════════════════════════════════════════════════ -->
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
          @click="$emit('select-category', 'BoxPacking')"
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
          @click="$emit('select-category', 'LoosePacking')"
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

    <!-- ══════════════════════════════════════════════════════════
         11. MID BRANDS SECTION
         ══════════════════════════════════════════════════════════ -->
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
          @click="$emit('select-category', card.id)"
        />
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════
         12. EXPLORE ALL CTA
         ══════════════════════════════════════════════════════════ -->
    <div class="mt-10 mb-8 px-4 flex justify-center">
      <button 
        @click="$emit('select-category', 'All')"
        class="group relative inline-flex items-center justify-center px-8 py-4 bg-[#18181b] text-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:bg-black active:scale-98 transition-all duration-300 w-full sm:w-auto"
      >
        <div class="relative flex items-center gap-3">
          <img src="/assets/e-sbe-logo.png" alt="e-SBE" class="h-6 w-auto object-contain invert brightness-200" />
          <span class="font-['Clash_Display'] font-bold text-base sm:text-lg uppercase tracking-wider text-amber-400">
            Browse All Products
          </span>
          <i class="fa-solid fa-arrow-right text-base text-amber-400 transition-transform duration-300 group-hover:translate-x-2"></i>
        </div>
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, defineAsyncComponent } from 'vue';
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

const appStore = useAppStore();
const cartStore = useCartStore();
const { cleanView, searchQuery, lastSyncTime } = storeToRefs(appStore);
const { cartTotalItems } = storeToRefs(cartStore);

const { isAdmin, isSuperAdmin } = useAdmin();
const { stockData, loading: isSyncing, updateStockData } = useStockData();
const { addToCart } = useCart();

const emit = defineEmits(['select-category', 'open-image-popup', 'open-catalog-gen', 'open-cart']);

// UI States
const activeTab = ref('All');
const activeFilter = ref('all');
const inStockOnly = ref(false);
const maxPriceFilter = ref(null);
const localQuery = ref('');
const showDropdown = ref(false);
const searchContainerRef = ref(null);

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

const handleClickOutside = (e) => {
  if (searchContainerRef.value && !searchContainerRef.value.contains(e.target)) {
    showDropdown.value = false;
  }
};

onMounted(() => {
  animationFrameId = requestAnimationFrame(loopScroll);
  document.addEventListener('mousedown', handleClickOutside);
  document.addEventListener('touchstart', handleClickOutside);
});

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId);
  document.removeEventListener('mousedown', handleClickOutside);
  document.removeEventListener('touchstart', handleClickOutside);
});

// Search and Suggestions
const searchSuggestions = computed(() => {
  const q = localQuery.value.trim().toLowerCase();
  if (!q) return [];
  const parts = q.split(/\s+/).filter(Boolean);
  const matches = [];
  
  if (stockData.value && Array.isArray(stockData.value)) {
    for (const group of stockData.value) {
      if (group.products) {
        for (const p of group.products) {
          if (p.productName) {
            const pName = p.productName.toLowerCase();
            if (parts.every(part => pName.includes(part))) {
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
  if (!q) return;
  searchQuery.value = q;
  emit('select-category', 'All');
};

const handleProductSelect = (product) => {
  showDropdown.value = false;
  localQuery.value = '';
  emit('open-image-popup', product);
};

// Brand Tabs Data (Zomato-Style Circular Icons)
const ParagonLogo = 'https://res.cloudinary.com/dg365ewal/image/upload/paragonLogo_rqk3hu.webp';

const brandTabs = [
  { id: 'All', label: 'All', icon: 'fa-solid fa-border-all', iconColor: 'text-[#c59b27]' },
  { id: 'ParagonCore', label: 'Core', icon: 'fa-solid fa-fire', iconColor: 'text-orange-500' },
  { id: 'NewArrivals', label: 'New', icon: 'fa-solid fa-wand-magic-sparkles', iconColor: 'text-amber-500' },
  { id: 'Paragon', label: 'Paragon', image: ParagonLogo },
  { id: 'EEKEN', label: 'Eeken', image: 'https://res.cloudinary.com/dg365ewal/image/upload/eekenLogo_rg5xwa.webp' },
  { id: 'Cubix', label: 'Cubix', image: 'https://res.cloudinary.com/dg365ewal/image/upload/v1749667073/cubixLogo_bwawj3.jpg' },
  { id: 'Florex', label: 'Florex', image: 'https://res.cloudinary.com/dg365ewal/image/upload/florexLogo_sqgjln.png' },
  { id: 'ACTION', label: 'Action', image: 'https://res.cloudinary.com/dg365ewal/image/upload/v1768150265/action-logo_dzd5mq.png' },
  { id: 'Reliance', label: 'Reliance', image: 'https://res.cloudinary.com/dg365ewal/image/upload/v1749667072/relianceLogo_bvgwwz.png' },
  { id: 'BoxPacking', label: 'Box', icon: 'fa-solid fa-box', iconColor: 'text-blue-500' },
  { id: 'LoosePacking', label: 'Loose', icon: 'fa-solid fa-bag-shopping', iconColor: 'text-purple-500' },
  { id: 'ParagonDiscount', label: '40% Off', icon: 'fa-solid fa-tags', iconColor: 'text-red-500' },
  { id: 'Safety', label: 'Safety', icon: 'fa-solid fa-shield', iconColor: 'text-emerald-500' },
  { id: 'School', label: 'School', icon: 'fa-solid fa-graduation-cap', iconColor: 'text-indigo-500' },
];

const selectTab = (tabId) => {
  activeTab.value = tabId;
  emit('select-category', tabId);
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

const localCarousals = {
  'ParagonCore': [
    'https://res.cloudinary.com/dg365ewal/image/upload/Core-1136.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/Core-1170.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/Core-1180.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/Core-1181.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/Core-1190.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/Core-1210.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/Core-1215.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/Core-1220.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/Core-1250-BKR.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/Core-1250-TQN.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/Core-1251-BKR.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/Core-16048-BLK.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/Core-16048-MIG.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/Core-16049-BLK.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/Core-16049-RYB.png',
    'https://res.cloudinary.com/dg365ewal/image/upload/Core-cushion.png'
  ],
  'EEKEN': [
    'https://res.cloudinary.com/dg365ewal/image/upload/Eeken-1.jpg',
    'https://res.cloudinary.com/dg365ewal/image/upload/Eeken-2.jpg',
    'https://res.cloudinary.com/dg365ewal/image/upload/Eeken-3.jpg'
  ],
  'PARALITE': ['https://res.cloudinary.com/dg365ewal/image/upload/Paralite.jpg'],
  'PARAGON GENTS': [
    'https://res.cloudinary.com/dg365ewal/image/upload/Paragon-gents-1.jpg',
    'https://res.cloudinary.com/dg365ewal/image/upload/Paragon-gents-2.jpg'
  ],
  'PARAGON LADIES': [
    'https://res.cloudinary.com/dg365ewal/image/upload/Paragon-ladies-1.jpg',
    'https://res.cloudinary.com/dg365ewal/image/upload/Paragon-ladies-2.jpg'
  ],
  'P-TOES PARALITE': ['https://res.cloudinary.com/dg365ewal/image/upload/P-toes.png'],
  'Safety': ['https://res.cloudinary.com/dg365ewal/image/upload/Boot-1.jpg'],
  'School': ['https://res.cloudinary.com/dg365ewal/image/upload/paragon-school.jpg'],
  'Walkaholic': ['https://res.cloudinary.com/dg365ewal/image/upload/Walkaholic.png'],
  'Max': ['https://res.cloudinary.com/dg365ewal/image/upload/Max.jpg'],
  'Escoute': ['https://res.cloudinary.com/dg365ewal/image/upload/Escoute.jpg'],
  'LoosePacking': ['https://res.cloudinary.com/dg365ewal/image/upload/loose.png'],
  'BoxPacking': ['https://res.cloudinary.com/dg365ewal/image/upload/box.png']
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

