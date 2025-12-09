<template>
  <div class="min-h-screen w-full bg-slate-50 font-sans text-slate-800">
    <!-- Sticky Header with Glassmorphism -->
    <header
      class="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all duration-300"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Left: Sync/Ledger Actions -->
          <div class="flex items-center gap-3">
            <button
              v-if="isAdmin && !isSuperAdmin"
              @click="updateStockData"
              class="p-2 rounded-full hover:bg-slate-100 transition-colors relative group"
              title="Sync Data"
            >
              <img
                src="https://res.cloudinary.com/dg365ewal/image/upload/v1749701539/cloud-sync_nznxzz.png"
                alt="Refresh"
                class="w-6 h-6 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                :class="{ 'animate-spin': loading }"
              />
            </button>
            <button
              v-if="isSuperAdmin"
              @click="toggleLedgerView"
              class="p-2 rounded-full hover:bg-slate-100 transition-colors group"
              title="Ledger View"
            >
              <img
                src="https://res.cloudinary.com/dg365ewal/image/upload/v1753616091/accounting-book_vh3kg5.png"
                alt="Ledger"
                class="w-6 h-6 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
              />
            </button>
            <!-- Spacer for non-admin layout balance -->
            <div v-if="!isAdmin && !isSuperAdmin" class="w-10"></div>
          </div>

          <!-- Center: Title -->
          <div class="flex-1 text-center">
            <h1 class="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              <span class="text-blue-600">SBE</span> Rayagada
            </h1>
          </div>

          <!-- Right: Admin Login -->
          <div class="flex items-center justify-end">
            <button
              v-if="!isAdmin && !isSuperAdmin"
              @click="promptAdminLogin"
              class="p-2 rounded-full hover:bg-slate-100 transition-colors opacity-70 hover:opacity-100"
              title="Admin Login"
            >
              <img
                src="https://res.cloudinary.com/dg365ewal/image/upload/v1749669514/software-engineer_dek6dl.png"
                alt="Admin"
                class="w-8 h-8 object-contain"
              />
            </button>
            <div v-else class="w-10"></div>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      <!-- Ledger View Placeholder -->
      <div
        v-if="showLedgerView"
        class="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-300"
      >
        <div class="text-xl font-semibold text-slate-500">Tally Ledger Work in Progress</div>
      </div>

      <!-- Main Content -->
      <div v-else class="space-y-6">
        
        <!-- Brand Filters (Scrollable Horizontal List) -->
        <div class="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 gap-2 no-scrollbar">
          <button
            @click="selectGroup('All')"
            class="whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border"
            :class="selectedGroup === 'All' ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'"
          >
            All Items
          </button>

          <!-- Dynamic Brands -->
          <button
            v-for="brand in brands"
            :key="brand.name"
            @click="selectGroup(brand.name)"
            class="flex items-center justify-center px-4 py-1.5 rounded-full border transition-all duration-200 min-w-[80px]"
            :class="selectedGroup === brand.name ? 'bg-white border-blue-500 ring-2 ring-blue-100' : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'"
          >
            <img :src="brand.logo" :alt="brand.name" class="h-6 object-contain" />
          </button>

          <!-- Static Filters (Capsule Style) -->
          <button
             v-for="filter in ['Kids', 'Hawai', 'Loose', 'Box', 'Shoe', 'Maruti', 'Magnet', 'rktraders', 'jkplastic', 'airson', 'GeneralItems']"
             :key="filter"
             @click="selectGroup(filter)"
             class="whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border capitalize"
             :class="selectedGroup === filter ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'"
          >
            {{ filter === 'rktraders' ? 'R.K.Traders' : filter === 'jkplastic' ? 'J.K.Plastic' : filter === 'airson' ? 'Airson' : filter === 'GeneralItems' ? 'General Items' : filter }}
          </button>
        </div>

        <!-- Toolbar: Search, Filter, View Toggle -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          
          <!-- Search -->
          <div class="md:col-span-12 lg:col-span-5 relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search products..."
              class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            />
          </div>

          <!-- Group Select Dropdown -->
          <div class="md:col-span-6 lg:col-span-3">
             <div class="relative">
               <select
                 v-model="selectedGroup"
                 @change="selectGroup($event.target.value)"
                 class="w-full appearance-none px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium"
               >
                 <option value="All">All Categories</option>
                 <option value="Kids">Kids Only</option>
                 <option value="Hawai">Hawai Only</option>
                 <option value="Loose">Loose Items</option>
                 <option value="Box">Box Items</option>
                 <option value="Shoe">Shoes</option>
                 <option disabled>──────────</option>
                 <option
                   v-for="group in sortedStockDataForDropdown"
                   :key="group.groupName"
                   :value="group.groupName"
                 >
                   {{ group.groupName }}
                 </option>
               </select>
               <span class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
               </span>
             </div>
          </div>

          <!-- Toggles -->
          <div class="md:col-span-6 lg:col-span-4 flex items-center justify-between gap-3">
            <label class="flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 px-3 py-2.5 rounded-xl border border-slate-200 transition-colors flex-1 justify-center">
              <input type="checkbox" v-model="showImagesOnly" class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500">
              <span class="text-sm font-medium text-slate-700">Images Only</span>
            </label>

            <div class="flex bg-slate-100 p-1 rounded-xl">
               <button
                 @click="viewMode = 'list'"
                 class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                 :class="viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
                 title="List View"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
               </button>
               <button
                 @click="viewMode = 'image'"
                 class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                 :class="viewMode === 'image' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
                 title="Grid View"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
               </button>
            </div>
          </div>
        </div>

        <!-- Info Bar -->
        <div class="flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 px-2">
          <span>
            Last Synced: 
            <span class="font-semibold text-slate-700">
               {{ lastRefresh ? lastRefresh.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "Never" }}
            </span>
          </span>
          <span v-if="error" class="text-red-500 font-medium mt-1 sm:mt-0">{{ error }}</span>
        </div>

        <!-- View: List -->
        <div v-if="viewMode === 'list'" class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table class="w-full text-left border-collapse">
            <thead class="bg-slate-50 border-b border-slate-200 uppercase text-xs font-semibold text-slate-500">
              <tr>
                <th class="px-6 py-4 w-1/3">Product Name</th>
                <th class="px-6 py-4 w-1/6">Stock</th>
                <th class="px-6 py-4 w-1/2 text-center">Preview</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <template v-for="(group, index) in filteredStockData" :key="index">
                <tr class="bg-slate-50/50 hover:bg-slate-100 transition-colors cursor-pointer" @click="toggleGroup(index)">
                  <td colspan="3" class="px-6 py-3 font-bold text-slate-700 text-sm flex items-center gap-2">
                    <span class="transform transition-transform text-slate-400" :class="{ 'rotate-90': expandedGroups[index] }">▸</span>
                    {{ group.groupName }}
                  </td>
                </tr>
                <tr
                  v-for="(product, pIndex) in group.products"
                  :key="`${index}-${pIndex}`"
                  v-show="expandedGroups[index]"
                  class="group/row hover:bg-blue-50/30 transition-colors"
                >
                  <td class="px-6 py-3">
                    <p class="text-sm font-medium text-slate-800 line-clamp-1 group-hover/row:text-blue-600 transition-colors">{{ product.productName }}</p>
                  </td>
                  <td class="px-6 py-3">
                     <span class="inline-block px-2 py-1 text-xs font-bold text-blue-700 bg-blue-50 rounded-md">
                       {{ product.quantity }} pcs
                     </span>
                  </td>
                  <td class="px-6 py-3 text-center">
                    <div class="relative w-12 h-12 mx-auto rounded-lg bg-slate-100 border border-slate-200 overflow-hidden">
                       <img v-if="product.imageUrl" :src="getOptimizedUrl(product.imageUrl)" class="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform" @click="openImagePopup(product, index)" />
                       <span v-else class="flex items-center justify-center w-full h-full text-[9px] text-slate-400">N/A</span>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <!-- View: Image Grid -->
        <div v-else class="space-y-8">
          <div v-for="(group, index) in filteredStockData" :key="index" class="space-y-4">
            <!-- Group Header -->
            <div
               class="flex items-center gap-3 cursor-pointer group select-none"
               @click="toggleGroup(index)"
            >
               <h2 class="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{{ group.groupName }}</h2>
               <div class="h-px flex-1 bg-slate-200 group-hover:bg-blue-100 transition-colors"></div>
               <span class="text-slate-400 transform transition-transform duration-300" :class="{ 'rotate-180': expandedGroups[index] }">▼</span>
            </div>

            <!-- Grid Content -->
            <div v-show="expandedGroups[index]" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              <div
                v-for="(product, pIndex) in group.products"
                :key="`${index}-${pIndex}`"
              >
                <div class="bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-slate-100 overflow-hidden h-full flex flex-col group/card relative">
                  
                  <!-- Image Area (Portrait 3:4) -->
                  <div class="relative aspect-[3/4] bg-slate-100 overflow-hidden">
                    <img
                      v-if="product.imageUrl"
                      :src="getOptimizedUrl(product.imageUrl)"
                      alt="Product"
                      class="w-full h-full object-cover cursor-pointer transition-transform duration-500 group-hover/card:scale-105"
                      @click="openImagePopup(product, index)"
                    />
                    
                    <!-- Admin Controls Overlay -->
                    <div
                      v-if="isAdmin || isSuperAdmin"
                      class="absolute inset-0 bg-black/40 backdrop-blur-[1px] opacity-0 group-hover/card:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4"
                    >
                       <button
                         v-if="product.imageUrl"
                         @click.stop="deleteImage(product.productName)"
                         class="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors"
                         title="Delete Image"
                       >
                         <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                       </button>

                       <label class="px-3 py-1.5 bg-white/90 text-xs font-bold text-slate-800 rounded-lg cursor-pointer hover:bg-white transition-colors shadow-lg">
                          {{ uploading[product.productName] ? 'Wait...' : 'Update Img' }}
                          <input type="file" accept="image/*" @change="handleFileChange($event, product.productName)" class="hidden" :disabled="uploading[product.productName]" />
                       </label>
                       
                       <button
                         v-if="imageFiles[product.productName]"
                         @click="uploadImage(product.productName)"
                         class="px-3 py-1.5 bg-blue-600 text-xs font-bold text-white rounded-lg hover:bg-blue-500 shadow-lg"
                       >
                         Upload Now
                       </button>
                    </div>

                    <!-- Empty State Placeholder -->
                    <div
                       v-else-if="!isAdmin && !isSuperAdmin"
                       class="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2"
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>

                    <!-- Admin Empty State -->
                    <div v-else class="absolute inset-0 flex items-center justify-center bg-slate-50 group-hover/card:bg-slate-100 transition-colors">
                        <label class="cursor-pointer flex flex-col items-center justify-center h-full w-full">
                           <span class="text-xs font-medium text-slate-400 mb-1">+ Add</span>
                           <input type="file" accept="image/*" @change="handleFileChange($event, product.productName); uploadImage(product.productName)" class="hidden" />
                        </label>
                    </div>
                  </div>

                  <!-- Card Footer -->
                  <div class="p-3 flex flex-col justify-between flex-grow bg-white">
                    <h3 class="text-xs font-semibold text-slate-700 leading-tight line-clamp-2 mb-2 h-8" :title="product.productName">
                      {{ product.productName }}
                    </h3>
                    <div class="flex items-end justify-between border-t border-slate-50 pt-2">
                       <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Stock</div>
                       <div class="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                         {{ product.quantity }}
                       </div>
                    </div>
                  </div>

                  <!-- Upload Error Toast embedded in card -->
                  <div v-if="uploadErrors[product.productName]" class="absolute bottom-0 inset-x-0 bg-red-500 text-white text-[10px] py-1 text-center z-20">
                    Failed
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>

    <!-- Floating To Top Button -->
    <transition enter-active-class="transition duration-300 ease-out" enter-from-class="translate-y-10 opacity-0" enter-to-class="translate-y-0 opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <button
        v-if="showGoToTop"
        @click="scrollToTop"
        class="fixed bottom-6 right-6 p-4 bg-slate-900/90 text-white rounded-full shadow-2xl hover:bg-black transition-all hover:-translate-y-1 hover:shadow-black/20 backdrop-blur-sm z-30"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
      </button>
    </transition>

    <!-- Modern Image Modal -->
    <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div
        v-if="showImagePopup"
        class="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
        role="dialog"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="closeImagePopup"></div>

        <!-- content -->
        <div
          class="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-transparent rounded-2xl overflow-hidden shadow-2xl"
          @touchstart="handleTouchStart"
          @touchend="handleTouchEnd"
        >
          <!-- Modal Header -->
          <div class="bg-black/50 backdrop-blur-md text-white px-6 py-4 flex items-center justify-between border-b border-white/10 z-10">
             <div class="flex flex-col">
                <span class="text-xs uppercase tracking-widest opacity-70">{{ currentGroupName }}</span>
                <span class="text-lg font-bold truncate max-w-[200px] sm:max-w-md">{{ currentProduct.productName }}</span>
             </div>
             <button @click="closeImagePopup" class="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
          </div>

          <!-- Main Image Area -->
          <div class="flex-1 relative flex items-center justify-center bg-black/90 p-4">
             <img
               v-if="currentProduct.imageUrl"
               :src="getOptimizedUrl(currentProduct.imageUrl)"
               class="max-w-full max-h-[70vh] object-contain drop-shadow-2xl rounded-lg"
               draggable="false"
             />
             <div v-else class="text-white/50">No High-Res Image Available</div>

             <!-- Nav Buttons -->
             <button
               v-if="currentProductIndex > 0"
               @click="navigateImage(-1)"
               class="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all sm:flex hidden"
             >
               <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
             </button>
             <button
               v-if="currentProductIndex < currentGroupProducts.length - 1"
               @click="navigateImage(1)"
               class="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all sm:flex hidden"
             >
               <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
             </button>
          </div>

          <!-- Bottom Bar -->
          <div class="bg-black/80 backdrop-blur-md p-4 text-center border-t border-white/10">
             <div class="inline-block px-4 py-1.5 bg-blue-600 rounded-full text-white font-bold text-sm shadow-lg shadow-blue-500/30">
                Current Stock: {{ currentProduct.quantity }} units
             </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import axios from "axios";
import { toast } from "vue3-toastify";
import "vue3-toastify/dist/index.css";

export default {
  name: "StockTable",
  data() {
    return {
      stockData: [],
      loading: false,
      error: null,
      lastRefresh: null,
      expandedGroups: {},
      imageFiles: {},
      uploading: {},
      uploadErrors: {},
      searchQuery: "",
      selectedGroup: "All",
      showGoToTop: false,
      isLocal:
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1",
      isAdmin: false,
      isSuperAdmin: false,
      showImagePopup: false,
      currentProduct: {},
      currentGroupIndex: null,
      currentProductIndex: 0,
      currentGroupProducts: [],
      currentGroupName: "",
      touchStartX: 0,
      viewMode: "image",
      showLedgerView: false,
      brands: [
        {
          name: "Paragon",
          logo: "https://res.cloudinary.com/dg365ewal/image/upload/v1749667072/paragonLogo_rqk3hu.webp",
        },
        {
          name: "Reliance",
          logo: "https://res.cloudinary.com/dg365ewal/image/upload/v1749667072/relianceLogo_bvgwwz.png",
        },
        {
          name: "Cubix",
          logo: "https://res.cloudinary.com/dg365ewal/image/upload/v1749667073/cubixLogo_bwawj3.jpg",
        },
        {
          name: "Florex",
          logo: "https://res.cloudinary.com/dg365ewal/image/upload/v1749667072/florexLogo_wn50tj.jpg",
        },
        {
          name: "EEKEN",
          logo: "https://res.cloudinary.com/dg365ewal/image/upload/v1749668232/eekenLogo_rg5xwa.webp",
        },
        {
          name: "Escoute",
          logo: "https://res.cloudinary.com/dg365ewal/image/upload/v1749667072/escouteLogo_maieji.jpg",
        },
      ],
      paragonSubgroups: [
        "Walkaholic",
        "VERTEX, SLICKERS & FENDER",
        "Stimulus",
        "Solea & Meriva , Mascara",
        "P-TOES",
        "Paralite",
        "PARAGON COMFY",
        "Paragon Blot",
        "PARAGON",
        "Max",
        "Hawai Chappal",
      ],
      marutiSubgroups: ["MARUTI PLASTICS"],
      magnetSubgroups: ["Magnet"],
      rktradersSubgroups: ["R K TRADERS"], // Kept for safety, though moved to general
      jkplasticSubgroups: ["J.K Plastic"],
      airsonSubgroups: ["Airsun"],

      // NEW: General Items Group (Updated Order)
      generalItemsSubgroups: [
        "AIRFAX",
        "Airsun",
        "J.K Plastic",
        "SRG ENTERPRISES",
        "VARDHMAN PLASTICS",
        "NAV DURGA ENTERPRISES",
        "AAGAM POLYMER",
        "Magnet",
        "MARUTI PLASTICS",
        "Fencer",
        "PANKAJ PLASTIC",
        "PARIS",
        "PU-LION",
        "SHYAM",
        "TEUZ",
        "UAM FOOTWEAR",
        "Xpania",
        "R K TRADERS",
        "Maruti",
        "rktraders",
        "jkplastic",
        "airson"
      ],
      showImagesOnly: true, // Default to true
    };
  },
  computed: {
    filteredStockData() {
      let filtered = this.stockData;
      if (this.searchQuery) {
        filtered = filtered
          .map((group) => ({
            ...group,
            products: group.products.filter((product) =>
              product.productName
                .toLowerCase()
                .includes(this.searchQuery.toLowerCase())
            ),
          }))
          .filter((group) => group.products.length > 0);
      }
      
      // Filter by Images Only (if enabled)
      if (this.showImagesOnly) {
         filtered = filtered.map(group => ({
            ...group,
            products: group.products.filter(p => !!p.imageUrl)
         })).filter(group => group.products.length > 0);
      }
      
      if (this.selectedGroup !== "All") {
        if (this.selectedGroup === "Paragon") {
          filtered = filtered.filter((group) =>
            this.paragonSubgroups.includes(group.groupName)
          );
        } else if (this.selectedGroup === "Reliance") {
          filtered = filtered.filter(
            (group) => group.groupName === "RELIANCE FOOTWEAR"
          );
        } else if (this.selectedGroup === "Florex") {
          filtered = filtered.filter(
            (group) => group.groupName === "Florex (Swastik)"
          );
        } else if (this.selectedGroup === "Cubix") {
          filtered = filtered.filter((group) => group.groupName === "CUBIX");
        } else if (this.selectedGroup === "EEKEN") {
          filtered = filtered.filter((group) => group.groupName === "EEKEN");
        } else if (this.selectedGroup === "Maruti") {
          filtered = filtered.filter((group) =>
            this.marutiSubgroups.includes(group.groupName)
          );
        } else if (this.selectedGroup === "Magnet") {
          filtered = filtered.filter((group) =>
            this.magnetSubgroups.includes(group.groupName)
          );
        } else if (this.selectedGroup === "rktraders") {
          filtered = filtered.filter((group) =>
            this.rktradersSubgroups.includes(group.groupName)
          );
        } else if (this.selectedGroup === "jkplastic") {
          filtered = filtered.filter((group) =>
            this.jkplasticSubgroups.includes(group.groupName)
          );
        } else if (this.selectedGroup === "airson") {
          filtered = filtered.filter((group) =>
            this.airsonSubgroups.includes(group.groupName)
          );
        }
        // NEW: General Items Filter
        else if (this.selectedGroup === "GeneralItems") {
          filtered = filtered.filter(g => this.generalItemsSubgroups.includes(g.groupName));
        }
        else if (this.selectedGroup === "Kids") {
          filtered = filtered
            .map((group) => ({
              ...group,
              products: group.products.filter((product) =>
                product.productName
                  .toLowerCase()
                  .match(/kid|toes|boy|girl|chu|1\*|child/)
              ),
            }))
            .filter((group) => group.products.length > 0);
        } else if (this.selectedGroup === "Hawai") {
          filtered = filtered
            .map((group) => ({
              ...group,
              products: group.products.filter((product) =>
                product.productName
                  .toLowerCase()
                  .match(/hawai|walkaholic|cushion/)
              ),
            }))
            .filter((group) => group.products.length > 0);
        } else if (this.selectedGroup === "Loose") {
          filtered = filtered
            .map((group) => ({
              ...group,
              products: group.products.filter((product) =>
                product.productName
                  .toLowerCase()
                  .match(/loose|era ladies|bond|r.k|r k/)
              ),
            }))
            .filter((group) => group.products.length > 0);
        } else if (this.selectedGroup === "Box") {
          filtered = filtered
            .map((group) => ({
              ...group,
              products: group.products.filter((product) =>
                product.productName
                  .toLowerCase()
                  .match(/seltos|airson|airsun|lion/)
              ),
            }))
            .filter((group) => group.products.length > 0);
        } else if (this.selectedGroup === "Shoe") {
          filtered = filtered
            .map((group) => ({
              ...group,
              products: group.products.filter((product) =>
                product.productName.toLowerCase().match(/shoe/)
              ),
            }))
            .filter((group) => group.products.length > 0);
        } else {
          filtered = filtered.filter(
            (group) => group.groupName === this.selectedGroup
          );
        }
      }
      
      // --- Sorting Logic Implementation ---
      // Order: Cubix -> Florex -> Paragon (Ordered) -> General Items (Ordered) -> Others
      
      const normalize = (name) => name ? name.toLowerCase().trim() : '';
      
      const sorted = filtered.sort((a, b) => {
          const nameA = normalize(a.groupName);
          const nameB = normalize(b.groupName);
          
          // 1. Cubix
          const isCubixA = nameA.includes('cubix');
          const isCubixB = nameB.includes('cubix');
          if (isCubixA && !isCubixB) return -1;
          if (!isCubixA && isCubixB) return 1;
          
          // 2. Florex
          const isFlorexA = nameA.includes('florex');
          const isFlorexB = nameB.includes('florex');
          if (isFlorexA && !isFlorexB) return -1;
          if (!isFlorexA && isFlorexB) return 1;
          
          // 3. Paragon Subgroups (Explicit Order)
          const pIndexA = this.paragonSubgroups.findIndex(p => normalize(p) === nameA);
          const pIndexB = this.paragonSubgroups.findIndex(p => normalize(p) === nameB);
          
          if (pIndexA !== -1 && pIndexB !== -1) return pIndexA - pIndexB;
          if (pIndexA !== -1) return -1;
          if (pIndexB !== -1) return 1;
          
          // 4. General Items Subgroups (Explicit Order)
          const gIndexA = this.generalItemsSubgroups.findIndex(g => normalize(g) === nameA);
          const gIndexB = this.generalItemsSubgroups.findIndex(g => normalize(g) === nameB);
          
          if (gIndexA !== -1 && gIndexB !== -1) return gIndexA - gIndexB;
          if (gIndexA !== -1) return -1;
          if (gIndexB !== -1) return 1;
          
          return 0;
      });

      return sorted;
    },
    sortedStockDataForDropdown() {
      // Create a sorted list of all groups for the dropdown to match the display order preference
      const normalize = (name) => name ? name.toLowerCase().trim() : '';
      return [...this.stockData].sort((a, b) => {
          const nameA = normalize(a.groupName);
          const nameB = normalize(b.groupName);
          
          const isCubixA = nameA.includes('cubix');
          const isCubixB = nameB.includes('cubix');
          if (isCubixA && !isCubixB) return -1;
          if (!isCubixA && isCubixB) return 1;
          
          const isFlorexA = nameA.includes('florex');
          const isFlorexB = nameB.includes('florex');
          if (isFlorexA && !isFlorexB) return -1;
          if (!isFlorexA && isFlorexB) return 1;
          
          const pIndexA = this.paragonSubgroups.findIndex(p => normalize(p) === nameA);
          const pIndexB = this.paragonSubgroups.findIndex(p => normalize(p) === nameB);
          if (pIndexA !== -1 && pIndexB !== -1) return pIndexA - pIndexB;
          if (pIndexA !== -1) return -1;
          if (pIndexB !== -1) return 1;
          
          const gIndexA = this.generalItemsSubgroups.findIndex(g => normalize(g) === nameA);
          const gIndexB = this.generalItemsSubgroups.findIndex(g => normalize(g) === nameB);
          if (gIndexA !== -1 && gIndexB !== -1) return gIndexA - gIndexB;
          if (gIndexA !== -1) return -1;
          if (gIndexB !== -1) return 1;
          
          return 0;
      });
    }
  },
  async mounted() {
    await this.loadStockData();
    this.expandedGroups = this.stockData.reduce(
      (acc, _, index) => ({ ...acc, [index]: true }),
      {}
    );
    window.addEventListener("scroll", this.handleScroll);
  },
  beforeUnmount() {
    window.removeEventListener("scroll", this.handleScroll);
  },
  methods: {
    toggleLedgerView() {
      this.showLedgerView = !this.showLedgerView;
    },
    getOptimizedUrl(imageUrl) {
      if (!imageUrl) return null;
      try {
        const parts = imageUrl.split("/upload/");
        if (parts.length !== 2) return imageUrl;
        const transformation = "w_1000,q_70,f_auto";
        return `${parts[0]}/upload/${transformation}/${parts[1]}`;
      } catch (e) {
        return imageUrl;
      }
    },
    async loadStockData() {
      try {
        let data = [];
        if (false) {
          const response = await axios.get("http://localhost:3000/api/stock");
          data = response.data;
        } else {
          const response = await fetch("/sbe/assets/stock-data.json");
          data = await response.json();
        }

        // Check for Metadata
        const metaIndex = data.findIndex((g) => g.groupName === "_META_DATA_");
        if (metaIndex !== -1) {
          const meta = data[metaIndex];
          if (meta.lastSync) {
            this.lastRefresh = new Date(meta.lastSync);
          }
          // Remove metadata from display list
          data.splice(metaIndex, 1);
        } else {
           // Fallback if no meta found
           this.lastRefresh = null; 
        }

        this.stockData = data;
        this.error = null;
      } catch (error) {
        this.error = this.isLocal
          ? error.response?.data?.error || "Failed to fetch stock data"
          : "Failed to load stock-data.json";
        this.stockData = [];
        toast.error(this.error, { autoClose: 3000 });
      }
    },
    async updateStockData() {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.post(
          "http://localhost:3000/api/updateStockData"
        );
        let data = response.data.data;

        // Check for Metadata
        const metaIndex = data.findIndex((g) => g.groupName === "_META_DATA_");
        if (metaIndex !== -1) {
          const meta = data[metaIndex];
          if (meta.lastSync) {
            this.lastRefresh = new Date(meta.lastSync);
          }
          data.splice(metaIndex, 1);
        } else {
           this.lastRefresh = new Date(); 
        }

        this.stockData = data;
        this.expandedGroups = this.stockData.reduce(
          (acc, _, index) => ({ ...acc, [index]: true }),
          {}
        );
        toast.success("Stock data updated successfully!", { autoClose: 2500 });
      } catch (error) {
        this.error =
          error.response?.data?.error || "Failed to update stock data";
        toast.error(this.error, { autoClose: 3000 });
      } finally {
        this.loading = false;
      }
    },
    promptAdminLogin() {
      const password = prompt("Enter admin password:");
      if (password === "admin123") {
        this.isAdmin = true;
        this.isSuperAdmin = false;
      } else if (password === "superadmin") {
        this.isAdmin = false;
        this.isSuperAdmin = true;
      } else {
        toast.error("Incorrect password", { autoClose: 3000 });
      }
    },
    toggleGroup(index) {
      this.expandedGroups[index] = !this.expandedGroups[index];
    },
    handleFileChange(event, productName) {
      this.imageFiles[productName] = event.target.files[0];
      this.uploadErrors[productName] = null;
    },
    async uploadImage(productName) {
      if (!this.imageFiles[productName]) return;
      this.uploading[productName] = true;
      this.uploadErrors[productName] = null;
      try {
        const formData = new FormData();
        formData.append("file", this.imageFiles[productName]);
        formData.append("upload_preset", "sbe-stock");
        const response = await fetch(
          "https://api.cloudinary.com/v1_1/dg365ewal/image/upload",
          {
            method: "POST",
            body: formData,
          }
        );
        const data = await response.json();
        if (!data.secure_url) {
          throw new Error("Upload failed");
        }
        await axios.post("http://localhost:3000/api/updateImage", {
          productName,
          imageUrl: data.secure_url,
        });
        this.stockData = this.stockData.map((group) => ({
          ...group,
          products: group.products.map((product) =>
            product.productName === productName
              ? { ...product, imageUrl: data.secure_url }
              : product
          ),
        }));
        toast.success("Image uploaded and stock data updated!", {
          autoClose: 2500,
        });
      } catch (error) {
        this.uploadErrors[productName] = "Failed to load image";
        toast.error(this.uploadErrors[productName], { autoClose: 3000 });
      } finally {
        this.uploading[productName] = false;
        this.imageFiles[productName] = null;
      }
    },
    async deleteImage(productName) {
      try {
        await axios.post("http://localhost:3000/api/removeImage", {
          productName,
        });
        this.stockData = this.stockData.map((group) => ({
          ...group,
          products: group.products.map((product) =>
            product.productName === productName
              ? { ...product, imageUrl: null }
              : product
          ),
        }));
        toast.success(`Image removed for ${productName}.`, { autoClose: 2500 });
      } catch (error) {
        toast.error("Failed to remove image", { autoClose: 3000 });
      }
    },
    openImagePopup(product, groupIndex) {
      this.currentProduct = product;
      this.currentGroupIndex = groupIndex;
      this.currentGroupProducts = this.filteredStockData[groupIndex].products;
      this.currentGroupName = this.filteredStockData[groupIndex].groupName;
      this.currentProductIndex = this.currentGroupProducts.findIndex(
        (p) => p.productName === product.productName
      );
      this.showImagePopup = true;
    },
    closeImagePopup() {
      this.showImagePopup = false;
      this.currentProduct = {};
      this.currentGroupIndex = null;
      this.currentGroupProducts = [];
      this.currentGroupName = "";
      this.currentProductIndex = 0;
    },
    navigateImage(direction) {
      const newIndex = this.currentProductIndex + direction;
      if (newIndex >= 0 && newIndex < this.currentGroupProducts.length) {
        this.currentProductIndex = newIndex;
        this.currentProduct = this.currentGroupProducts[newIndex];
      }
    },
    handleTouchStart(event) {
      this.touchStartX = event.touches[0].clientX;
    },
    handleTouchEnd(event) {
      const touchEndX = event.changedTouches[0].clientX;
      const diff = this.touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          this.navigateImage(1);
        } else {
          this.navigateImage(-1);
        }
      }
    },
    selectGroup(groupName) {
      this.selectedGroup = groupName;
    },
    handleScroll() {
      this.showGoToTop = window.scrollY > 300;
    },
    scrollToTop() {
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
  },
};
</script>

<style scoped>
img {
  max-width: 100%;
  max-height: 100%;
}
</style>
