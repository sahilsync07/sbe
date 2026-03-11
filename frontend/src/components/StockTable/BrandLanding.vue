<template>
  <div class="brand-landing pb-12">
    <!-- NEW ARRIVALS: Refined Heading + Horizontal Scroll Stack -->
    <section class="mb-2 overflow-hidden">
      <!-- Exact Heading Style from All Products -->
      <div class="flex items-center justify-between mb-3 px-1">
        <div class="flex items-center gap-3">
          <h2 class="text-lg lg:text-2xl font-['Clash_Display'] font-bold tracking-wide holographic-text uppercase">
            ✨ New Arrivals
          </h2>
        </div>
        <button 
           @click="$emit('select-category', 'NewArrivals')"
           class="text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-widest hover:text-blue-800 transition-colors flex items-center gap-1 bg-blue-50/50 px-2 py-1 rounded-md"
        >
           View All <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>

      <!-- Horizontal Auto-Scrolling Product Stack -->
      <div class="relative group/scroll w-full">
        <div 
           class="flex overflow-x-auto gap-4 pb-2 px-1 no-scrollbar"
           :ref="el => setScroller('new-arrivals', el)"
           @pointerdown="pauseScroll('new-arrivals')"
           @pointerup="resumeScroll('new-arrivals')"
           @pointerleave="resumeScroll('new-arrivals')"
           @touchstart.passive="pauseScroll('new-arrivals')"
           @touchend.passive="resumeScroll('new-arrivals')"
        >
          
          <!-- Duplicated block to loop infinitely without gaps -->
          <template v-for="loopIndex in 2" :key="'na-loop-'+loopIndex">
              <!-- FEATURED HERO IMAGE CARD -->
              <div 
                class="flex-shrink-0 w-[140px] sm:w-[210px] aspect-[4/5] sm:aspect-square rounded-3xl overflow-hidden relative group/hero cursor-pointer transition-transform duration-500 hover:scale-[1.02]"
                @click="$emit('select-category', 'NewArrivals')"
              >
                <CachedImage
                  v-if="getHeroImage()"
                  :src="getOptimizedImageUrl(getHeroImage(), 'w_600,h_800,c_fill')"
                  alt="New Arrivals"
                  class="w-full h-full object-cover rounded-3xl transition-transform duration-1000 group-hover/hero:scale-110"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                
                <div class="absolute bottom-4 left-4 right-4">
                    <!-- Glassmorphic Badge -->
                    <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-2">
                        <span class="w-1 h-1 rounded-full bg-blue-400 animate-pulse"></span>
                        <span class="text-[9px] font-bold text-white uppercase tracking-widest">New Season</span>
                    </div>
                    <h3 class="text-lg font-black text-white leading-tight uppercase font-['Clash_Display']">Latest<br/>Arrivals</h3>
                    <div class="mt-4 flex items-center gap-2 text-white/60 group-hover/hero:text-white transition-colors">
                        <span class="text-xs font-bold uppercase tracking-wider">Shop Collection</span>
                        <i class="fa-solid fa-arrow-right text-[10px] transition-transform group-hover/hero:translate-x-1"></i>
                    </div>
                </div>
              </div>

              <!-- Individual Product Cards -->
              <div
                v-for="product in getNewArrivalProducts().slice(0, 15)"
                :key="'na-'+product.productName+'-'+loopIndex"
                class="flex-shrink-0 w-[120px] sm:w-[160px] flex flex-col group/card relative bg-white rounded-3xl shadow-card hover:shadow-float transition-all duration-300 border border-transparent"
              >
                <!-- Image Area -->
                <div 
                  class="relative w-full aspect-[4/5] bg-slate-100 rounded-t-3xl cursor-pointer" 
                  :class="{ 'holographic-border': isNewArrival(product) }"
                  @click="$emit('open-image-popup', product)"
                >
                   <div class="absolute inset-0 rounded-t-3xl overflow-hidden">
                     <CachedImage
                        v-if="product.imageUrl"
                        :src="getOptimizedImageUrl(product.imageUrl)"
                        alt="Product"
                        class="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-110"
                      />
                      <div v-else class="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                        <i class="fa-solid fa-image text-3xl opacity-20"></i>
                      </div>

                      <!-- Floating Cart Controls -->
                      <div v-if="getCartQty(product) > 0" class="absolute bottom-2 right-2 z-20 flex items-center gap-0.5 p-0.5 bg-white/95 backdrop-blur rounded-full shadow-md border border-blue-100 animate-fade-in-up" @click.stop>
                          <button @click.stop="$emit('update-cart', product, -1)" class="w-6 h-6 flex items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 transition-colors">
                              <i class="fa-solid fa-minus text-[10px]"></i>
                          </button>
                          <span class="w-4 text-center text-xs font-bold text-slate-800">{{ getCartQty(product) }}</span>
                          <button @click.stop="$emit('update-cart', product, 1)" class="w-6 h-6 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm">
                              <i class="fa-solid fa-plus text-[10px]"></i>
                          </button>
                      </div>
                   </div>
                </div>

                <!-- Content -->
                <div class="p-2 flex flex-col flex-1 pb-2.5 relative">
                    <!-- Title -->
                    <div class="mb-1 pr-6">
                       <h3 class="text-[10px] sm:text-xs font-bold text-slate-800 leading-snug line-clamp-2 min-h-[2.5em] group-hover/card:text-blue-600 transition-colors" :title="product.productName">
                          {{ getCleanProductName(product.productName) }}
                       </h3>
                    </div>
                    
                    <!-- Details Row -->
                    <div class="flex items-center justify-between mb-1">
                        <div class="flex items-center gap-1 overflow-hidden">
                           <span v-if="getProductColor(product.productName)" 
                                 class="w-2.5 h-2.5 rounded-full shadow-sm ring-1 ring-slate-100" 
                                 :style="{ backgroundColor: getProductColor(product.productName).hex }"
                                 :title="getProductColor(product.productName).text"
                           ></span>
                           <span v-if="getProductColor(product.productName)" class="text-[9px] sm:text-[10px] font-medium text-slate-500 capitalize truncate max-w-[45px]">
                              {{ getProductColor(product.productName).text }}
                           </span>
                        </div>
                        <span v-if="getProductSize(product.productName)" class="px-1.5 py-0.5 rounded shadow-sm bg-slate-50 text-slate-600 text-[9px] sm:text-[10px] font-bold border border-slate-200">
                           {{ getProductSize(product.productName) }}
                        </span>
                    </div>

                    <!-- Footer -->
                    <div class="mt-auto flex items-end justify-between">
                        <div class="flex flex-col">
                           <span class="text-[8px] sm:text-[9px] font-semibold text-slate-400 uppercase tracking-widest">{{ getPriceInfo(product.productName).label }}</span>
                           <div class="text-sm sm:text-base font-black text-slate-900 leading-none mt-0.5">
                              <span class="text-[9px] sm:text-[10px] align-top font-medium mr-[1px]">₹</span>{{ getPriceInfo(product.productName).price }}
                           </div>
                        </div>
                        <div class="text-right flex flex-col items-end">
                           <span class="text-[10px] sm:text-xs font-bold" :class="product.quantity < 5 ? 'text-amber-500' : 'text-slate-400'">
                              {{ product.quantity }} {{ product.quantity === 1 ? 'Pair' : 'Pairs' }}
                           </span>
                        </div>
                    </div>

                    <button 
                         v-if="product.quantity > 0"
                         @click.stop="$emit('add-to-cart', product)"
                         class="absolute top-2 right-2 z-20 w-6 h-6 flex items-center justify-center rounded-full bg-white text-slate-600 shadow border border-slate-100 hover:bg-blue-600 hover:text-white transition-all hover:scale-110 active:scale-95"
                         title="Add to Cart"
                    >
                          <i class="fa-solid fa-plus text-[10px]"></i>
                    </button>
                </div>
              </div>
          </template>
        </div>
      </div>
    </section>

    <!-- UNIFIED BRANDS MARQUEE (Paragon + Others, Moving RIGHT) -->
    <div class="w-full relative py-3 mb-4 overflow-hidden bg-white border-y border-slate-100 shadow-sm group/logo-scroll">
       <div 
           class="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar px-4"
           :ref="el => setScroller('brand-logos', el, -1)"
           @pointerdown="pauseScroll('brand-logos')"
           @pointerup="resumeScroll('brand-logos')"
           @pointerleave="resumeScroll('brand-logos')"
           @touchstart.passive="pauseScroll('brand-logos')"
           @touchend.passive="resumeScroll('brand-logos')"
       >
           <!-- Dual Loop for infinite scrolling -->
           <template v-for="loopIndex in 2" :key="'unified-logo-loop-'+loopIndex">
               
               <!-- Paragon Logo (Standard) -->
               <div 
                   @click="$emit('select-category', 'Paragon')"
                   class="flex-shrink-0 h-10 sm:h-14 px-4 py-1 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
               >
                   <CachedImage
                      :src="ParagonLogo"
                      alt="Paragon"
                      class="h-full w-auto object-contain"
                      transformations="w_400,c_fit"
                   />
               </div>

               <!-- Other Brands -->
               <div 
                   v-for="brand in marqueeBrands" 
                   :key="'banner-'+brand.id+'-'+loopIndex"
                   @click="$emit('select-category', brand.id)"
                   class="flex-shrink-0 h-10 sm:h-14 px-4 py-1 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
               >
                   <CachedImage
                      :src="brand.logo"
                      :alt="brand.label"
                      class="h-full w-auto object-contain"
                   />
               </div>
           </template>
       </div>
    </div>

    <!-- BRAND PARAGONS GRID -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
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

    <!-- TOP BRANDS: Replaced with Horizontal Galleries -->
    <div v-for="(brand, idx) in bigBrandCards" :key="brand.id" :class="['mb-6 last:mb-0', idx === 0 ? 'mt-10' : '']">
      <div class="flex items-center justify-between mb-3 px-1">
        <h3 class="text-lg sm:text-2xl font-bold font-['Clash_Display'] holographic-text tracking-wide uppercase">
          {{ brand.label }}
        </h3>
        <button 
           @click="$emit('select-category', brand.id)"
           class="text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-widest hover:text-blue-800 transition-colors flex items-center gap-1 bg-blue-50/50 px-2 py-1 rounded-md"
        >
           View All <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>
      
      <div class="relative group/scroll w-full">
        <div 
           class="flex overflow-x-auto gap-4 pb-2 px-1 no-scrollbar"
           :ref="el => setScroller('brand-col-'+brand.id, el)"
           @pointerdown="pauseScroll('brand-col-'+brand.id)"
           @pointerup="resumeScroll('brand-col-'+brand.id)"
           @pointerleave="resumeScroll('brand-col-'+brand.id)"
           @touchstart.passive="pauseScroll('brand-col-'+brand.id)"
           @touchend.passive="resumeScroll('brand-col-'+brand.id)"
        >
          <!-- Duplicate brand collection for infinite scroll -->
          <template v-for="loopIndex in 2" :key="brand.id+'-loop-'+loopIndex">
              <div 
                class="flex-shrink-0 w-[140px] sm:w-[210px] aspect-[4/5] sm:aspect-square rounded-3xl overflow-hidden relative group/hero cursor-pointer transition-transform duration-500 hover:scale-[1.02] bg-white"
                @click="$emit('select-category', brand.id)"
              >
                <!-- Logo Section (Top Part) -->
                <div class="absolute inset-x-0 top-0 h-1/2 flex items-center justify-center p-6 mt-4">
                    <CachedImage
                      :src="brand.logo"
                      :alt="brand.label"
                      class="h-full w-auto object-contain transition-transform duration-1000 group-hover/hero:scale-110"
                    />
                </div>
                
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
                
                <div class="absolute bottom-4 left-4 right-4">
                    <h3 class="text-lg font-black text-white leading-tight uppercase font-['Clash_Display']">{{ brand.label }}<br/>Collection</h3>
                    <div class="mt-3 flex items-center gap-2 text-white/60 group-hover/hero:text-white transition-colors">
                        <span class="text-[10px] font-bold uppercase tracking-wider">Shop All</span>
                        <i class="fa-solid fa-arrow-right text-[9px] transition-transform group-hover/hero:translate-x-1"></i>
                    </div>
                </div>
              </div>

              <!-- Brand Images from Stock Data -->
              <div
                v-for="product in getBrandProducts(brand.groupNames)"
                :key="'brand-'+brand.id+'-'+product.productName+'-'+loopIndex"
                class="flex-shrink-0 w-[120px] sm:w-[160px] flex flex-col group/card relative bg-white rounded-3xl shadow-card hover:shadow-float transition-all duration-300 border border-transparent"
              >
                <!-- Image Area -->
                <div 
                  class="relative w-full aspect-[4/5] bg-slate-100 rounded-t-3xl cursor-pointer" 
                  @click="$emit('open-image-popup', product)"
                >
                   <div class="absolute inset-0 rounded-t-3xl overflow-hidden">
                     <CachedImage
                        v-if="product.imageUrl"
                        :src="getOptimizedImageUrl(product.imageUrl)"
                        alt="Product"
                        class="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-110"
                      />
                      <div v-else class="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                        <i class="fa-solid fa-image text-3xl opacity-20"></i>
                      </div>

                      <!-- Floating Cart Controls -->
                      <div v-if="getCartQty(product) > 0" class="absolute bottom-2 right-2 z-20 flex items-center gap-0.5 p-0.5 bg-white/95 backdrop-blur rounded-full shadow-md border border-blue-100 animate-fade-in-up" @click.stop>
                          <button @click.stop="$emit('update-cart', product, -1)" class="w-6 h-6 flex items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 transition-colors">
                              <i class="fa-solid fa-minus text-[10px]"></i>
                          </button>
                          <span class="w-4 text-center text-xs font-bold text-slate-800">{{ getCartQty(product) }}</span>
                          <button @click.stop="$emit('update-cart', product, 1)" class="w-6 h-6 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm">
                              <i class="fa-solid fa-plus text-[10px]"></i>
                          </button>
                      </div>
                   </div>
                </div>

                <!-- Content -->
                <div class="p-2 flex flex-col flex-1 pb-2.5 relative">
                    <!-- Title -->
                    <div class="mb-1 pr-6">
                       <h3 class="text-[10px] sm:text-xs font-bold text-slate-800 leading-snug line-clamp-2 min-h-[2.5em] group-hover/card:text-blue-600 transition-colors" :title="product.productName">
                          {{ getCleanProductName(product.productName) }}
                       </h3>
                    </div>
                    
                    <!-- Details Row -->
                    <div class="flex items-center justify-between mb-1">
                        <div class="flex items-center gap-1 overflow-hidden">
                           <span v-if="getProductColor(product.productName)" 
                                 class="w-2.5 h-2.5 rounded-full shadow-sm ring-1 ring-slate-100" 
                                 :style="{ backgroundColor: getProductColor(product.productName).hex }"
                                 :title="getProductColor(product.productName).text"
                           ></span>
                           <span v-if="getProductColor(product.productName)" class="text-[9px] sm:text-[10px] font-medium text-slate-500 capitalize truncate max-w-[45px]">
                              {{ getProductColor(product.productName).text }}
                           </span>
                        </div>
                        <span v-if="getProductSize(product.productName)" class="px-1.5 py-0.5 rounded shadow-sm bg-slate-50 text-slate-600 text-[9px] sm:text-[10px] font-bold border border-slate-200">
                           {{ getProductSize(product.productName) }}
                        </span>
                    </div>

                    <!-- Footer -->
                    <div class="mt-auto flex items-end justify-between">
                        <div class="flex flex-col">
                           <span class="text-[8px] sm:text-[9px] font-semibold text-slate-400 uppercase tracking-widest">{{ getPriceInfo(product.productName).label }}</span>
                           <div class="text-sm sm:text-base font-black text-slate-900 leading-none mt-0.5">
                              <span class="text-[9px] sm:text-[10px] align-top font-medium mr-[1px]">₹</span>{{ getPriceInfo(product.productName).price }}
                           </div>
                        </div>
                        <div class="text-right flex flex-col items-end">
                           <span class="text-[10px] sm:text-xs font-bold" :class="product.quantity < 5 ? 'text-amber-500' : 'text-slate-400'">
                              {{ product.quantity }} {{ product.quantity === 1 ? 'Pair' : 'Pairs' }}
                           </span>
                        </div>
                    </div>

                    <button 
                         v-if="product.quantity > 0"
                         @click.stop="$emit('add-to-cart', product)"
                         class="absolute top-2 right-2 z-20 w-6 h-6 flex items-center justify-center rounded-full bg-white text-slate-600 shadow border border-slate-100 hover:bg-blue-600 hover:text-white transition-all hover:scale-110 active:scale-95"
                         title="Add to Cart"
                    >
                          <i class="fa-solid fa-plus text-[10px]"></i>
                    </button>
                </div>
              </div>
          </template>
        </div>
      </div>
    </div>

    <!-- GENERAL PACKING: Unique Bento/Masonry Design -->
    <div class="flex items-center gap-3 mt-12 mb-5 px-1">
      <h3 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none uppercase font-['Clash_Display'] drop-shadow-sm">General Packing</h3>
    </div>

    <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-5 mb-8">
      
      <!-- Box Packing: Large Left Feature -->
      <div 
         class="flex-1 rounded-3xl overflow-hidden relative group cursor-pointer transition-transform duration-500 hover:-translate-y-1 hover:shadow-xl bg-slate-900 aspect-square sm:aspect-auto sm:min-h-[300px]"
         @click="$emit('select-category', 'BoxPacking')"
      >
          <!-- Dynamic Images (Up to 4 images in a 2x2 grid as background) -->
          <div class="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5 opacity-50 transition-opacity duration-700 group-hover:opacity-40">
              <div v-for="(img, idx) in getImages(boxGroupNames, 4)" :key="'box-'+idx" class="w-full h-full overflow-hidden">
                 <CachedImage :src="getOptimizedImageUrl(img.imageUrl, 'w_400,h_400,c_fill')" alt="Box Packing" class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
              </div>
          </div>
          
          <div class="absolute inset-0 bg-gradient-to-tr from-blue-900/90 via-slate-900/60 to-transparent"></div>
          
          <div class="absolute inset-0 p-6 flex flex-col justify-between">
              <div class="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-white shadow-lg">
                  <i class="fa-solid fa-box text-xl"></i>
              </div>
              <div>
                  <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-200 border border-blue-400/30 text-[10px] font-bold uppercase tracking-wider mb-2 backdrop-blur-sm">
                      Premium
                  </div>
                  <h4 class="text-3xl sm:text-4xl font-black text-white leading-none uppercase font-['Clash_Display'] mb-1">Box<br/>Packing</h4>
                  <p class="text-sm text-blue-100/80 font-medium">{{ getCount(boxGroupNames) }} Products Available</p>
                  
                  <div class="mt-4 flex items-center gap-2 text-white/70 group-hover:text-white transition-colors">
                      <span class="text-xs font-bold uppercase tracking-wider">Explore Category</span>
                      <i class="fa-solid fa-arrow-right text-[10px] transition-transform group-hover:translate-x-2"></i>
                  </div>
              </div>
          </div>
      </div>

      <!-- Loose Packing: Stacked Right Features -->
      <div class="flex-1 flex flex-col gap-3 sm:gap-4 lg:gap-5">
          <!-- Top Horizontal Feature -->
          <div 
             class="flex-1 rounded-3xl overflow-hidden relative group cursor-pointer transition-transform duration-500 hover:-translate-y-1 hover:shadow-xl bg-slate-800 min-h-[140px]"
             @click="$emit('select-category', 'LoosePacking')"
          >
              <div class="absolute inset-0 flex opacity-60 transition-opacity duration-700 group-hover:opacity-50">
                  <div v-for="(img, idx) in getImages(looseGroupNames, 3)" :key="'loose-'+idx" class="flex-1 h-full overflow-hidden border-r border-slate-900/50 last:border-0">
                     <CachedImage :src="getOptimizedImageUrl(img.imageUrl, 'w_300,h_300,c_fill')" alt="Loose Packing" class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                  </div>
              </div>
              <div class="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/40 to-transparent"></div>
              
              <div class="absolute inset-0 p-5 flex items-center">
                  <div>
                      <h4 class="text-2xl font-black text-white leading-none uppercase font-['Clash_Display'] mb-1">Loose<br/>Packing</h4>
                      <p class="text-xs text-slate-300 font-medium">{{ getCount(looseGroupNames) }} Products</p>
                  </div>
                  <div class="ml-auto w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 text-white shadow-lg group-hover:bg-white/20 transition-colors">
                      <i class="fa-solid fa-arrow-right text-sm transition-transform group-hover:translate-x-1"></i>
                  </div>
              </div>
          </div>

          <!-- Bottom Banner -->
          <div 
             class="h-24 sm:flex-1 rounded-3xl overflow-hidden relative group cursor-pointer transition-transform duration-500 hover:-translate-y-1 hover:shadow-xl bg-gradient-to-br from-blue-600 to-indigo-700 p-[1px]"
             @click="$emit('select-category', 'All')"
          >
              <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyIiBjeT0iMiIgcj0iMiIgZmlsbD0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEpIi8+PC9zdmc+')] opacity-20"></div>
              <div class="w-full h-full bg-slate-900/40 backdrop-blur-md rounded-[23px] flex items-center justify-between p-5 relative z-10 overflow-hidden">
                  <div class="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/30 rounded-full blur-2xl group-hover:bg-blue-400/40 transition-colors"></div>
                  
                  <div class="flex items-center gap-3 relative z-20">
                      <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
                          <i class="fa-solid fa-layer-group text-xs"></i>
                      </div>
                      <div>
                          <h4 class="text-lg font-black text-white uppercase tracking-wide leading-none">View All</h4>
                          <span class="text-[10px] text-blue-200 uppercase font-bold tracking-widest mt-0.5 block">Entire Collection</span>
                      </div>
                  </div>
                  <i class="fa-solid fa-chevron-right text-white/50 group-hover:text-white transition-colors relative z-20"></i>
              </div>
          </div>
      </div>
    </div>

    <!-- MID BRANDS -->
    <div class="flex items-center gap-3 mt-12 mb-5 px-1">
      <h3 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none uppercase font-['Clash_Display'] drop-shadow-sm">Mid Brands</h3>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
      <SlideshowCard
        v-for="card in midBrandCards"
        :key="card.id"
        :card="card"
        :images="getImages(card.groupNames, 4)"
        :count="getCount(card.groupNames)"
        aspectClass="aspect-[4/3] sm:aspect-square"
        @click="$emit('select-category', card.id)"
      />
    </div>

    <!-- EXPLORE ALL PRODUCTS CTA -->
    <div class="mt-12 mb-8 px-4 flex justify-center">
      <button 
        @click="$emit('select-category', 'All')"
        class="group relative inline-flex items-center justify-center px-8 py-4 bg-slate-900 text-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto"
      >
        <div class="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div class="relative flex items-center gap-3">
          <span class="font-['Clash_Display'] font-bold text-lg lg:text-xl uppercase tracking-wider">Explore All Products</span>
          <i class="fa-solid fa-arrow-right-long text-xl transition-transform duration-300 group-hover:translate-x-2"></i>
        </div>
      </button>
    </div>

    <!-- Admin: Catalog Generator FAB -->
    <button
      v-if="isAdmin || isSuperAdmin"
      @click="$emit('open-catalog-gen')"
      class="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-2xl shadow-amber-500/40 flex items-center justify-center text-white text-xl hover:scale-110 active:scale-95 transition-all animate-pulse"
      title="Generate Catalog Images"
    >
      <i class="fa-solid fa-bolt"></i>
    </button>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, defineAsyncComponent } from 'vue';
import SlideshowCard from './SlideshowCard.vue';
import { isNewArrival, getOptimizedImageUrl, formatProductName } from '../../utils/formatters';
import { extractColor } from '../../utils/colors';

const CachedImage = defineAsyncComponent(() => import('./CachedImage.vue'));

const props = defineProps({
  stockData: { type: Array, default: () => [] },
  cart: { type: Array, default: () => [] },
  isAdmin: { type: Boolean, default: false },
  isSuperAdmin: { type: Boolean, default: false }
});

defineEmits(['select-category', 'add-to-cart', 'update-cart', 'open-image-popup', 'open-catalog-gen']);

const windowWidth = ref(window.innerWidth);
const updateWidth = () => { windowWidth.value = window.innerWidth; };

const allLocalImages = computed(() => {
    return Object.values(localCarousals).flat();
});

onMounted(() => { 
    window.addEventListener('resize', updateWidth); 
    animationFrameId = requestAnimationFrame(loopScroll);
});
onUnmounted(() => { 
    window.removeEventListener('resize', updateWidth); 
    cancelAnimationFrame(animationFrameId);
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
        
        // Slower panning speed: 0.02 pixels per ms
        el.scrollLeft += (delta * 0.02 * direction);

        // Infinite loop logic 
        if (direction === 1) {
            // Scrolling left: Content moves left as scrollLeft increases. 
            // Reset to 0 when half is scrolled out.
            if (el.scrollLeft >= el.scrollWidth / 2) {
                el.scrollLeft -= el.scrollWidth / 2;
            }
        } else {
            // Scrolling right: Content moves right as scrollLeft decreases.
            // Reset to half width when it hits 0.
            if (el.scrollLeft <= 0) {
                el.scrollLeft += el.scrollWidth / 2;
            }
        }
    }
    animationFrameId = requestAnimationFrame(loopScroll);
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

const getCartQty = (product) => {
    const item = props.cart.find(i => i.product.productName === product.productName);
    return item ? item.quantity : 0;
};

// Data Collection Functions
const getNewArrivalProducts = () => {
    let products = [];
    if (!props.stockData) return products;
    for (const group of props.stockData) {
        if (group.products) {
            for (const p of group.products) {
                if (isNewArrival(p) && p.imageUrl) products.push(p);
            }
        }
    }
    return products.sort((a,b) => {
      const dateA = new Date(a.firstSeenAt || a.imageUploadedAt || 0);
      const dateB = new Date(b.firstSeenAt || b.imageUploadedAt || 0);
      return dateB - dateA;
    }).slice(0, 15);
};

const getNewArrivalCount = () => {
    let count = 0;
    if (!props.stockData) return 0;
    for (const group of props.stockData) {
        if (group.products) {
            for (const p of group.products) {
                if (isNewArrival(p) && p.imageUrl) count++;
            }
        }
    }
    return count;
};

const getHeroImage = () => {
    const list = getNewArrivalProducts();
    if (list.length > 0 && list[0].imageUrl) return list[0].imageUrl;
    return null;
};

const getBrandProducts = (groupNames) => {
    let products = [];
    if (!props.stockData || !groupNames) return products;
    const lower = groupNames.map(n => n.toLowerCase());
    for (const group of props.stockData) {
        if (lower.includes(group.groupName.toLowerCase()) && group.products) {
            for (const p of group.products) {
                if (p.imageUrl) products.push(p);
            }
        }
    }
    return products.slice(0, 15);
};

import Boot1 from '../../assets/Carousal Pics/Boot-1.jpg';
import Boot2 from '../../assets/Carousal Pics/Boot-2.jpg';
import Eeken1 from '../../assets/Carousal Pics/Eeken-1.jpg';
import Eeken2 from '../../assets/Carousal Pics/Eeken-2.jpg';
import Eeken3 from '../../assets/Carousal Pics/Eeken-3.jpg';
import Eeken4 from '../../assets/Carousal Pics/Eeken-4.jpg';
import Eeken5 from '../../assets/Carousal Pics/Eeken-5.jpg';
import Eeken6 from '../../assets/Carousal Pics/Eeken-6.jpg';
import Eeken7 from '../../assets/Carousal Pics/Eeken-7.jpg';
import Eeken8 from '../../assets/Carousal Pics/Eeken-8.jpg';
import EscouteImg from '../../assets/Carousal Pics/Escoute.jpg';
import Fender from '../../assets/Carousal Pics/Fender.jpg';
import Max1 from '../../assets/Carousal Pics/Max.jpg';
import Ptoes from '../../assets/Carousal Pics/P-toes.jpg';
import ParagonGents1 from '../../assets/Carousal Pics/Paragon-gents-1.jpg';
import ParagonGents2 from '../../assets/Carousal Pics/Paragon-gents-2.jpg';
import ParagonGents3 from '../../assets/Carousal Pics/Paragon-gents-3.jpg';
import ParagonGents4 from '../../assets/Carousal Pics/Paragon-gents-4.jpg';
import ParagonLadies1 from '../../assets/Carousal Pics/Paragon-ladies-1.jpg';
import ParagonLadies2 from '../../assets/Carousal Pics/Paragon-ladies-2.jpg';
import ParagonLadies3 from '../../assets/Carousal Pics/Paragon-ladies-3.jpg';
import ParagonSchool from '../../assets/Carousal Pics/paragon-school.jpg';
import Paralite from '../../assets/Carousal Pics/Paralite.jpg';
import Walkaholic from '../../assets/Carousal Pics/Walkaholic.jpg';
import Paragon50Logo from '../../assets/Carousal Pics/Paragon 50 years logo.png';
import BoxPack from '../../assets/Carousal Pics/box.png';
import LoosePack from '../../assets/Carousal Pics/loose.png';

// Assets using Cloudinary optimized URLs
const ParagonLogo = 'https://res.cloudinary.com/dg365ewal/image/upload/v1749667072/paragonLogo_rqk3hu.webp';

const localCarousals = {
  'EEKEN': [Eeken1, Eeken2, Eeken3, Eeken4, Eeken5, Eeken6, Eeken7, Eeken8],
  'PARALITE': [Paralite],
  'PARAGON GENTS': [ParagonGents1, ParagonGents2, ParagonGents3, ParagonGents4],
  'PARAGON LADIES': [ParagonLadies1, ParagonLadies2, ParagonLadies3],
  'P-TOES PARALITE': [Ptoes],
  'Safety': [Boot1, Boot2],
  'School': [ParagonSchool],
  'Walkaholic': [Walkaholic],
  'Max': [Max1],
  'Escoute': [EscouteImg],
  'LoosePacking': [LoosePack],
  'BoxPacking': [BoxPack]
};

const getParagonImages = (card) => {
  return localCarousals[card.id] || [];
};

const getImages = (groupNames, limit=5) => {
  return []; // Only use hardcoded images from localCarousals
};

const getCount = (groupNames) => {
  if (!props.stockData || !groupNames) return 0;
  let count = 0;
  const lower = groupNames.map(n => n.toLowerCase());
  props.stockData.forEach(g => {
    if (lower.includes(g.groupName.toLowerCase())) {
      count += g.products ? g.products.length : 0;
    }
  });
  return count;
};

const looseGroupNames = ['ASHU', 'PANKAJ PLASTIC', 'TARA', 'J.K Plastic', 'MAGNET', 'MARUTI PLASTICS', 'AAGAM POLYMER', 'A G ENTERPRISES', 'NAV DURGA ENTERPRISES', 'NEXUS', 'R K TRADERS', 'SRG ENTERPRISES', 'VARDHMAN PLASTICS', 'YASH FOOTWEAR', 'KRISHNA AGENCY', 'SHYAM', 'AVTAR V V POLYMERS', 'ATHARV PLASTIC'];
const boxGroupNames = ['Mini F/w', 'ADDA', 'ADDOXY', 'AIRFAX', 'HITWAY', 'PARIS', 'TEUZ', 'VAISHNO PLASTIC', 'AGRA', 'R R POLYPLAST', 'AIRSON', 'AMBIKA FOOTWEAR', 'GOKUL FOOTWEAR', 'NEXGEN FOOTWEAR', 'Kohinoor', 'UAM FOOTWEAR'];

// Cards config
const paragonCards = [
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
  { id: 'Cubix', label: 'Cubix', groupNames: ['CUBIX', 'CUBIX 2'], logo: 'https://res.cloudinary.com/dg365ewal/image/upload/' + 'v1749667073/cubixLogo_bwawj3.jpg' },
  { id: 'Florex', label: 'Florex', groupNames: ['Florex (Swastik)'], logo: 'https://res.cloudinary.com/dg365ewal/image/upload/v1772558569/florexLogo_sqgjln.png', bg: 'bg-emerald-500' },
  { id: 'ACTION', label: 'Action', groupNames: ['ACTION'], logo: 'https://res.cloudinary.com/dg365ewal/image/upload/' + 'v1768150265/action-logo_dzd5mq.png' },
  { id: 'Reliance', label: 'Reliance', groupNames: ['RELIANCE FOOTWEAR'], logo: 'https://res.cloudinary.com/dg365ewal/image/upload/' + 'v1749667072/relianceLogo_bvgwwz.png' },
];

const marqueeBrands = [
  ...bigBrandCards,
  { id: 'EEKEN', label: 'Eeken', logo: 'https://res.cloudinary.com/dg365ewal/image/upload/v1749668232/eekenLogo_rg5xwa.webp' }
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
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

@keyframes shine {
  0% { background-position: 0% center; }
  100% { background-position: 200% center; }
}
.holographic-text {
  background: linear-gradient(to right, #2563eb, #e11d48, #2563eb);
  background-size: 200% auto;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shine 3s linear infinite;
}
</style>
