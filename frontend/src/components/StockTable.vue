<template>
  <div class="min-h-screen w-full bg-slate-50 font-sans text-slate-800">
    <!-- Sticky Header with Glassmorphism -->
    <header
      class="sticky top-0 z-[50] w-full bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all duration-300"
    >
      <div class="w-full px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Left: Sidebar Toggle & Sync -->
          <div class="flex items-center gap-3">
             <button
              @click="showSidePanel = !showSidePanel"
              class="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>

            <button
              v-if="isAdmin && !isSuperAdmin"
              @click="updateStockData"
              class="p-2 rounded-full bg-transparent hover:bg-gray-100 transition-colors relative group"
              title="Sync Data"
            >
              <img
                :src="`https://res.cloudinary.com/${cloudName}/image/upload/v1749701539/cloud-sync_nznxzz.png`"
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
                :src="`https://res.cloudinary.com/${cloudName}/image/upload/v1753616091/accounting-book_vh3kg5.png`"
                alt="Ledger"
                class="w-6 h-6 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
              />
            </button>
            <!-- Spacer for non-admin layout balance -->
            <div v-if="!isAdmin && !isSuperAdmin" class="hidden sm:block w-10"></div>
          </div>

          <!-- Center: Title -->
          <div class="flex-1 text-center">
            <h1 
              class="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 select-none inline-block cursor-pointer"
              @click="promptAdminLogin"
              title="Admin Login"
            >
              <span class="text-blue-600">{{ companyName.split(' ')[0] }}</span> {{ companyName.split(' ').slice(1).join(' ') }}
            </h1>
          </div>

          <!-- Right: Cart & Sync -->
          <div class="flex items-center justify-end gap-2">
             <button
              @click="showCart = !showCart"
              class="relative group p-2 bg-blue-600 rounded-full hover:bg-blue-700 transition-all shadow-md active:scale-95"
              title="Toggle Cart"
            >
              <div v-if="cartTotalItems > 0" class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm z-10 border border-white">{{ cartTotalItems }}</div>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </button>
          </div>
        </div>
      </div>
    </header>

    <div class="flex w-full">
      <!-- Side Panel (Bird Eye View) -->
      <aside
        class="fixed inset-y-0 left-0 bg-white border-r border-slate-200 w-64 z-40 transform transition-transform duration-300 ease-in-out pt-16"
        :class="showSidePanel ? 'translate-x-0' : '-translate-x-full'"
      >
        <div class="p-4 h-full overflow-y-auto">
           <div class="flex items-center justify-between mb-4 lg:hidden">
             <h2 class="text-lg font-bold text-slate-800">Brands</h2>
             <button @click="showSidePanel = false" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 shrink-0">
               <i class="fa-solid fa-xmark text-xl text-slate-500"></i>
             </button>
           </div>
           <nav class="space-y-1">
             <template v-for="(group, index) in filteredStockData" :key="group.groupName">
                <a
                  href="#"
                  @click.prevent="scrollToGroup(group.groupName)"
                  class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-blue-50 hover:text-blue-600 group"
                  :class="activeScrollGroup === group.groupName ? 'bg-blue-50 text-blue-600' : 'text-slate-600'"
                >
                   <span class="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-blue-400" :class="activeScrollGroup === group.groupName ? 'bg-blue-600' : ''"></span>
                   <span class="truncate">{{ group.groupName }}</span>
                </a>
             </template>
           </nav>
        </div>
      </aside>

      <!-- Overlay for mobile sidebar -->
      <div 
        v-if="showSidePanel" 
        class="fixed inset-0 bg-black/50 z-30 lg:hidden"
        @click="showSidePanel = false"
      ></div>

      <!-- Cart Sidebar (Right Side - Push Layout) -->
      <aside
        class="fixed inset-y-0 right-0 bg-white border-l border-slate-200 w-80 z-[60] transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col"
        :class="showCart ? 'translate-x-0' : 'translate-x-full'"
        style="height: 100vh; top: 0;" 
      >
        <div class="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
           <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
             Your Cart <span v-if="cart.length" class="text-sm font-normal text-slate-500">({{ cartTotalItems }})</span>
           </h2>
           <button @click="showCart = false" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors shrink-0">
             <i class="fa-solid fa-xmark text-xl"></i>
           </button>
        </div>
        
        <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
           <div v-if="cart.length === 0" class="flex flex-col items-center justify-center h-64 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              <p class="text-sm font-medium">Your cart is empty</p>
              <button @click="showCart = false" class="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors">Start Browsing</button>
           </div>
           
           <div v-for="(item, index) in cart" :key="index" class="flex gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm relative group hover:border-blue-200 transition-colors">
              <!-- Mini Thumbnail -->
              <div class="w-16 h-16 bg-slate-50 rounded-lg border border-slate-100 shrink-0 overflow-hidden">
                 <img v-if="item.product.imageUrl" :src="getOptimizedUrl(item.product.imageUrl)" class="w-full h-full object-cover" />
                 <div v-else class="w-full h-full flex items-center justify-center text-[8px] text-slate-400 text-center p-1">No Image</div>
              </div>
              
               <div class="flex-1 min-w-0">
                 <h4 class="text-xs font-semibold text-slate-800 line-clamp-2 leading-tight mb-1">{{ item.product.productName }}</h4>
                 <div class="flex items-center justify-between mt-2">
                    <div class="flex items-center gap-2">
                       <button @click="updateCartQuantity(index, -1)" class="w-6 h-6 flex items-center justify-center text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-all">-</button>
                       <span class="text-xs font-bold text-slate-800 min-w-[3rem] text-center">{{ item.quantity }} {{ item.quantity > 1 ? 'Sets' : 'Set' }}</span>
                       <button @click="updateCartQuantity(index, 1)" class="w-6 h-6 flex items-center justify-center text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-all">+</button>
                    </div>
                     <button @click="removeFromCart(index)" class="shrink-0 w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white rounded-lg transition-all shadow-sm">
                        <i class="fa-solid fa-trash"></i>
                     </button>
                 </div>
              </div>
           </div>
        </div>
        
        <div class="p-4 border-t border-slate-100 bg-slate-50">
            <div class="flex justify-between items-center mb-4">
               <span class="text-slate-600 font-medium text-sm">Total Quantity</span>
               <span class="text-xl font-extrabold text-blue-600">{{ cartTotalItems }} Sets</span>
            </div>
            <button 
              @click="sendOrderToWhatsapp"
              class="w-full py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-xl shadow-lg shadow-green-900/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
              Send Order via WhatsApp
            </button>
        </div>
      </aside>

      <main 
         class="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 min-w-0 transition-all duration-300"
         :class="{'mr-0 lg:mr-80': showCart, 'ml-0 lg:ml-64': showSidePanel}"
      >
      
      <!-- Ledger View Placeholder -->
      <div
        v-if="showLedgerView"
        class="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-300"
      >
        <div class="text-xl font-semibold text-slate-500">Tally Ledger Work in Progress</div>
      </div>

      <!-- Main Content -->
      <div v-else class="space-y-6">
        <!-- New Breadcrumb / Sidebar Toggle for Mobile -->
        <div class="lg:hidden flex items-center justify-between">
           <span class="text-sm font-semibold text-slate-500">
             Showing {{ activeScrollGroup || 'All Brands' }}
           </span>
        </div>
        
        <!-- Brand Filters (Scrollable Horizontal List) -->
        <!-- Brand Filters (Hidden) -->
        <div class="hidden overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 gap-2 no-scrollbar">
          <!-- ... brand carousel content preserved but hidden ... -->
        </div>

        <!-- Toolbar: Search, Filter, View Toggle -->
        <div class="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl shadow-sm border border-slate-100 transition-all">
          
          <!-- Search (Grows to fill space, wraps if < 240px space) -->
          <div class="relative flex-grow basis-[240px] min-w-[240px]">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search..."
              class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            />
          </div>

          <!-- Group Select Dropdown (Grows, wraps if < 200px) -->
          <div class="relative flex-grow basis-[200px] min-w-[200px]">
             <select
               v-model="selectedGroup"
               @change="selectGroup($event.target.value)"
               class="w-full appearance-none px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium"
             >
               <option value="All">All Categories</option>
               <option v-for="filter in toolbarFilters.filter(f => !['All', 'Brands'].includes(f.id))" :key="filter.id" :value="filter.id">
                 {{ filter.label }}
               </option>
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

           <!-- Toggles & View Options -->
          <div class="flex flex-wrap items-center gap-2 flex-grow basis-auto justify-between sm:justify-end">
             <!-- Filter Checkboxes -->
             <div class="flex flex-wrap gap-2 flex-grow sm:flex-grow-0 justify-center">
               <label class="relative inline-flex items-center cursor-pointer select-none">
                 <input type="checkbox" v-model="showImagesOnly" class="sr-only peer">
                 <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                 <span class="ml-3 text-sm font-medium text-slate-700">Only with Images</span>
               </label>
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
                <tr :id="'group-row-' + index" class="bg-slate-50/50 hover:bg-slate-100 transition-colors cursor-pointer" @click="toggleGroup(index)">
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
                  <td class="px-6 py-6">
                    <p class="text-sm font-medium text-slate-800 line-clamp-1 group-hover/row:text-blue-600 transition-colors">{{ product.productName }}</p>
                  </td>
                  <td class="px-6 py-6">
                     <span class="inline-block px-2 py-1 text-xs font-bold text-blue-700 bg-blue-50 rounded-md">
                       {{ product.quantity }} pcs
                     </span>
                     <button 
                       @click.stop="addToCart(product)"
                       class="ml-2 w-7 h-7 inline-flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 transition-all shadow-md"
                       title="Add to Cart"
                     >
                       <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                     </button>
                  </td>
                  <td class="px-6 py-6 text-center">
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
        <div class="space-y-6 sm:space-y-10">
          <div
            v-for="(group, index) in filteredStockData"
            :key="group.groupName"
            :id="normalizeId(group.groupName)"
            class="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
          >
            <!-- Group Header -->
            <div
              @click="toggleGroup(index)"
              class="px-4 sm:px-6 py-4 cursor-pointer select-none transition-colors border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10"
              :class="expandedGroups[index] ? 'bg-white' : 'hover:bg-slate-50'"
            >
              <div class="flex items-center gap-3 overflow-hidden">
                <!-- Special Rainbow Header for New Arrivals -->
                <h2 v-if="group.isSpecial" class="text-2xl sm:text-3xl font-black tracking-tight holographic-text truncate">
                   ✨ {{ group.groupName }}
                </h2>
                <!-- Standard Header -->
                <h2 v-else class="text-lg sm:text-xl font-bold text-slate-800 truncate">
                  {{ group.groupName }}
                  <span class="ml-2 text-sm font-medium text-slate-400">
                    ({{ group.products.length }})
                  </span>
                </h2>
              </div>
              <div class="flex items-center gap-3 shrink-0">
                 <!-- No Sort/Filter buttons for New Arrivals -->
                 <span v-if="!group.isSpecial" class="text-slate-300">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 transform transition-transform duration-300"
                      :class="expandedGroups[index] ? 'rotate-180' : ''"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                 </span>
              </div>
            </div>

            <!-- Group Content -->
            <transition
              enter-active-class="transition-all duration-300 ease-out"
              enter-from-class="opacity-0 max-h-0"
              enter-to-class="opacity-100 max-h-[5000px]"
              leave-active-class="transition-all duration-200 ease-in"
              leave-from-class="opacity-100 max-h-[5000px]"
              leave-to-class="opacity-0 max-h-0"
            >
              <div v-show="expandedGroups[index]">
                <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-px bg-slate-100 border-b border-slate-100">
                  <div
                    v-for="(product, pIndex) in group.products"
                    :key="product.productName"
                    class="bg-white p-3 sm:p-4 relative group flex flex-col h-full"
                  >
                    
                    <!-- Image Area (Portrait 3:4) -->
                    <div class="relative aspect-[3/4] bg-slate-100 overflow-hidden mb-3 rounded-xl border border-slate-100 shadow-inner group-hover:shadow-md transition-shadow">
                      <img
                        v-if="product.imageUrl"
                        :src="getOptimizedUrl(product.imageUrl)"
                        alt="Product"
                        class="w-full h-full object-cover cursor-pointer transition-transform duration-500 group-hover:scale-105"
                        @click="openImagePopup(product, index)"
                      />
                      
                      <!-- Empty State (No Image) -->
                      <div
                         v-else
                         class="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50"
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>

                      <!-- Admin Controls Overlay -->
                      <div
                        v-if="isAdmin || isSuperAdmin"
                        class="absolute inset-0 bg-black/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4 z-10"
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
                            {{ uploading[product.productName] ? 'Wait...' : (product.imageUrl ? 'Replace' : 'Upload') }}
                            <input type="file" accept="image/*" @change="handleFileChange($event, product.productName)" class="hidden" :disabled="uploading[product.productName]" />
                         </label>
                         
                         <button
                           v-if="imageFiles[product.productName]"
                           @click="uploadImage(product.productName)"
                           class="px-3 py-1.5 bg-blue-600 text-xs font-bold text-white rounded-lg hover:bg-blue-500 shadow-lg"
                         >
                           Confirm
                         </button>
                      </div>
                    </div>

                  <div class="p-2.5 flex flex-col justify-between flex-grow bg-white">
                    <h3 class="text-[11px] font-semibold text-slate-700 leading-snug line-clamp-3 mb-1 min-h-[2.5rem] text-center" :title="product.productName">
                      {{ product.productName }}
                    </h3>
                    <div class="flex items-end justify-center border-t border-slate-50 pt-2 mt-auto">
                       <!-- Old Stock Display Removed -->
                       
                       <!-- Conditional Cart Control (Side by Side) -->
                       <div v-if="getCartQty(product) > 0" class="flex flex-col items-center gap-1">
                          <span class="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-0.5">Stock: {{ product.quantity }}</span>
                          <div class="flex items-center gap-2">
                             <button @click.stop="updateCart(product, -1)" class="w-8 h-8 flex items-center justify-center bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-bold active:scale-90 transition-all">
                                <i class="fa-solid fa-minus text-xs"></i>
                             </button>
                             <span class="text-sm font-extrabold text-blue-700 min-w-[1.2rem] text-center">{{ getCartQty(product) }}</span>
                             <button @click.stop="updateCart(product, 1)" class="w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold active:scale-90 transition-all shadow-md shadow-blue-200">
                                <i class="fa-solid fa-plus text-xs"></i>
                             </button>
                          </div>
                       </div>
                       
                       <!-- Initial Add Button (Grey Squircle) -->
                       <div v-else class="flex flex-col items-center gap-1">
                           <span class="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-0.5">Stock: {{ product.quantity }}</span>
                           <button 
                             @click.stop="addToCart(product)"
                             class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:bg-blue-600 hover:text-white border border-transparent transition-all active:scale-90"
                             title="Add to Cart"
                           >
                             <i class="fa-solid fa-plus"></i>
                           </button>
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
          </transition>
        </div>
      </div>

      </div>
    </main>
    </div>

    <!-- Floating To Top Button -->
    <transition enter-active-class="transition duration-300 ease-out" enter-from-class="translate-y-10 opacity-0" enter-to-class="translate-y-0 opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <button
        v-if="showGoToTop"
        @click="scrollToTop"
        class="fixed bottom-6 right-6 w-14 h-14 flex items-center justify-center bg-slate-900/90 text-white rounded-full shadow-2xl hover:bg-black transition-all hover:-translate-y-1 hover:shadow-black/20 backdrop-blur-sm z-30"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
      </button>
    </transition>

    <!-- Modern Image Modal -->
    <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div
        v-if="showImagePopup"
        class="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8"
        role="dialog"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/90 backdrop-blur-sm" @click="closeImagePopup"></div>

        <!-- content -->
        <div
          class="relative w-full max-w-6xl max-h-[85vh] flex flex-col md:flex-row bg-slate-900 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10"
          @touchstart="handleTouchStart"
          @touchend="handleTouchEnd"
        >
          
          <!-- Image Section (Left/Top) -->
          <div class="flex-1 relative bg-black flex items-center justify-center p-4 min-h-[40vh] md:min-h-0 overflow-hidden">
             <img
               v-if="currentProduct.imageUrl"
               :src="getOptimizedUrl(currentProduct.imageUrl)"
               class="w-full h-full object-contain drop-shadow-2xl"
               draggable="false"
             />
             <div v-else class="text-white/50">No High-Res Image Available</div>

             <!-- Desktop Nav Buttons (Floating) -->
             <button
               v-if="currentProductIndex > 0"
               @click="navigateImage(-1)"
               class="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all hidden md:flex hover:scale-110"
               title="Previous"
             >
               <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
             </button>
             <button
               v-if="currentProductIndex < currentGroupProducts.length - 1"
               @click="navigateImage(1)"
               class="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all hidden md:flex hover:scale-110"
               title="Next"
             >
               <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
             </button>
          </div>

          <!-- Details Section (Right/Bottom) -->
          <div class="w-full md:w-[320px] lg:w-[380px] flex flex-col bg-slate-800 border-l border-white/5 z-20 shrink-0">
             
             <!-- Header / Close -->
             <div class="p-6 flex justify-between items-start">
                <div class="flex-1 pr-4">
                  <span class="block text-xs font-bold tracking-widest text-slate-400 uppercase mb-2">{{ currentGroupName }}</span>
                  <h2 class="text-lg md:text-xl font-bold text-white leading-snug break-words">
                    {{ currentProduct.productName }}
                  </h2>
                </div>
                <button @click="closeImagePopup" class="p-2 -mr-2 -mt-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-full transition-colors flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
             </div>

             <!-- Info Content -->
             <div class="px-6 flex-1 overflow-y-auto">
                <div class="p-4 bg-slate-700/30 rounded-xl border border-white/5 space-y-2 mb-4">
                   <div class="text-sm text-slate-400 font-medium">Available Stock</div>
                   <div class="text-3xl font-bold text-blue-400 tracking-tight">{{ currentProduct.quantity }} <span class="text-sm font-normal text-slate-500 ml-1">pairs/pcs</span></div>
                </div>
             </div>

             <!-- Mobile Nav Controls (Footer) -->
             <div class="p-4 flex gap-3 md:hidden bg-slate-900 border-t border-white/5 mt-auto">
                <button 
                  @click="navigateImage(-1)" 
                  class="flex-1 py-3 px-4 bg-slate-800 text-white text-sm font-bold rounded-xl disabled:opacity-30 active:scale-95 transition-all"
                  :disabled="currentProductIndex <= 0"
                >
                  Previous
                </button>
                <button 
                  @click="navigateImage(1)" 
                  class="flex-1 py-3 px-4 bg-blue-600 text-white text-sm font-bold rounded-xl disabled:opacity-30 active:scale-95 transition-all shadow-lg shadow-blue-900/20"
                  :disabled="currentProductIndex >= currentGroupProducts.length - 1"
                >
                  Next Product
                </button>
             </div>
          </div>

        </div>
      </div>
    </transition>

    <!-- Order Details Modal -->
    <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
      <div v-if="showOrderDetailsModal" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showOrderDetailsModal = false"></div>
        <div class="relative bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
          <div class="p-6">
            <h3 class="text-xl font-bold text-slate-800 mb-2">Finalize Your Order</h3>
            <p class="text-sm text-slate-500 mb-6">Please provide your details to send the order via WhatsApp.</p>
            
            <div class="space-y-4">
               <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-1">Your Name</label>
                  <input 
                    v-model="customerName" 
                    type="text" 
                    placeholder="e.g. Sahil Kumar"
                    class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
                  >
               </div>
               <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input 
                    v-model="customerPhone" 
                    type="tel" 
                    placeholder="e.g. 9348343310"
                    class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
                  >
               </div>
            </div>

            <div class="flex gap-3 mt-8">
               <button 
                 @click="showOrderDetailsModal = false"
                 class="flex-1 py-3 px-4 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
               >
                 Cancel
               </button>
               <button 
                 @click="finalizeOrderAndSend"
                 class="flex-1 py-3 px-4 bg-[#25D366] text-white font-bold rounded-xl hover:bg-[#128C7E] shadow-lg shadow-green-900/10 transition-all active:scale-95"
               >
                 Send Order
               </button>
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
      cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
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
      config: {},
      companyName: "",
      brands: [], // Loaded from config
      toolbarFilters: [], // Loaded from config
      showImagesOnly: true, // Default to true

      showNoImagesOnly: false,
      showSidePanel: false,
      activeScrollGroup: '',
      hideOldArticles: true,
      showCart: false,
      cart: [],
      showOrderDetailsModal: false,
      customerName: '',
      customerPhone: '',
    };
  },
  watch: {
    showImagesOnly(val) {
      if (val) this.showNoImagesOnly = false;
    },
    showNoImagesOnly(val) {
      if (val) this.showImagesOnly = false;
    },
    // Persist cart
    cart: {
      handler(val) {
        localStorage.setItem('sbe_cart', JSON.stringify(val));
      },
      deep: true
    },
    // Update URL when group changes
    selectedGroup(newVal) {
      const url = new URL(window.location);
      if (newVal && newVal !== 'All') {
        url.searchParams.set('brand', newVal);
      } else {
        url.searchParams.delete('brand');
      }
      window.history.replaceState(null, '', url);
    }
  },
  computed: {
    cartTotalItems() {
      return this.cart.reduce((total, item) => total + item.quantity, 0);
    },

    // ... data properties updated below ...
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

      // Filter by No Images Only (if enabled)
      if (this.showNoImagesOnly) {
         filtered = filtered.map(group => ({
            ...group,
            products: group.products.filter(p => !p.imageUrl)
         })).filter(group => group.products.length > 0);
      }

      // Filter by Hide Old Articles
      if (this.hideOldArticles) {
        filtered = filtered.filter(group => !group.groupName.toLowerCase().includes('old'));
      }
      
      const normalize = (name) => name ? name.toLowerCase().trim() : '';

      if (this.selectedGroup !== "All") {
        const groupKey = this.selectedGroup;

        // New Arrivals Logic
        if (groupKey === "NewArrivals") {
           const cutoff = new Date();
           cutoff.setMonth(cutoff.getMonth() - 1);
           
           filtered = filtered.map(group => ({
             ...group,
             products: group.products.filter(p => {
               if (!p.imageUrl) return false;
               // If timestamp exists, check if recent. If missing, assume old (Nov 2025).
               const uploadDate = p.imageUploadedAt ? new Date(p.imageUploadedAt) : new Date('2025-11-01');
               return uploadDate > cutoff;
             })
           })).filter(g => g.products.length > 0);
        }
        // Check if it's a Brand Group (e.g. Paragon, Florex)
        else if (this.config.brandGroups && this.config.brandGroups[groupKey]) {
           const allowedSubgroups = this.config.brandGroups[groupKey].map(g => normalize(g));
           filtered = filtered.filter(g => allowedSubgroups.includes(normalize(g.groupName)));
        }  
        // Check if it's a Custom Filter (Regex based like Kids, Hawai)
        else if (this.config.customFilters && this.config.customFilters[groupKey]) {
           const keywords = this.config.customFilters[groupKey];
           filtered = filtered.map(group => ({
             ...group,
             products: group.products.filter(p => 
               keywords.some(k => p.productName.toLowerCase().includes(k.toLowerCase()))
             )
           })).filter(g => g.products.length > 0);
        }
        // Specific Group Name match
        else {
           filtered = filtered.filter(g => g.groupName === groupKey);
        }
      }
      
      
      // Sort the standard groups
      filtered.sort(this.compareGroups);
      
      // Inject "New Arrivals" at the top if viewing "All"
      if (this.selectedGroup === 'All') {
         const cutoff = new Date();
         cutoff.setMonth(cutoff.getMonth() - 1);
         const minDate = new Date('2025-11-01'); // Treat undated as old

         const newProducts = [];
         
         // Iterate all groups to find new products
         this.stockData.forEach(g => {
            g.products.forEach(p => {
               if (!p.imageUrl) return;
                const uploadDate = p.imageUploadedAt ? new Date(p.imageUploadedAt) : minDate;
                if (uploadDate > cutoff) {
                   // Avoid duplicates if multiple groups share products? (Usually not case here)
                   newProducts.push(p);
                }
            });
         });

         if (newProducts.length > 0) {
            // Flatten/Dedup if needed, assume unique productName
            // Sort new products by date desc?
            newProducts.sort((a,b) => {
                const dA = a.imageUploadedAt ? new Date(a.imageUploadedAt) : minDate;
                const dB = b.imageUploadedAt ? new Date(b.imageUploadedAt) : minDate;
                return dB - dA;
            });
            
            filtered.unshift({
               groupName: "New Arrivals",
               products: newProducts,
               isSpecial: true
            });
            
            // Should we collapse 'New Arrivals' by default? Maybe not.
            // Check expandedGroups default.
         }
      }

      return filtered;
    },
    sortedStockDataForDropdown() {
      // Exclude "New Arrivals" from dropdown list
      return [...this.stockData].sort(this.compareGroups);
    },

  },
  async mounted() {
    // Inject FontAwesome
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    document.head.appendChild(link);

    await this.loadConfig();
    await this.loadStockData();
    
    // Check for URL param "brand"
    const params = new URLSearchParams(window.location.search);
    const brandParam = params.get('brand');
    
    if (brandParam) {
      const paramLower = brandParam.toLowerCase();
      
      // 1. Check Toolbar Filters
      const filterMatch = this.toolbarFilters.find(f => f.id.toLowerCase() === paramLower);
      if (filterMatch) {
         this.selectedGroup = filterMatch.id;
      } else {
         // 2. Check Actual Groups (Stock Data)
         const groupMatch = this.stockData.find(g => g.groupName.toLowerCase() === paramLower);
         if (groupMatch) {
            this.selectedGroup = groupMatch.groupName;
         }
      }
    }

    // Load Cart
    const savedCart = localStorage.getItem('sbe_cart');
    if (savedCart) {
      try {
        this.cart = JSON.parse(savedCart);
      } catch (e) {
        console.error("Failed to load cart");
      }
    }
    this.applyTheme();
    this.expandedGroups = this.stockData.reduce(
      (acc, _, index) => ({ ...acc, [index]: true }),
      {}
    );
    // Expand New Arrivals (index 0) by default if it exists
    this.$nextTick(() => {
       if (this.filteredStockData.length > 0 && this.filteredStockData[0].isSpecial) {
           this.expandedGroups[0] = true;
       }
    });
    
    window.addEventListener("scroll", this.handleScroll);
  },
  beforeUnmount() {
    window.removeEventListener("scroll", this.handleScroll);
  },
  methods: {
    async loadConfig() {
      try {
        const configFile = import.meta.env.VITE_CONFIG_FILE || 'sbe.json';
        const response = await fetch(`${import.meta.env.BASE_URL}config/${configFile}`);
        const config = await response.json();
        
        this.config = config;
        this.brands = config.brands;
        this.companyName = config.companyName;
        this.toolbarFilters = config.toolbarFilters || [];
        
        // Populate specific subgroups for backward compatibility if needed, 
        // but logic is now dynamic.
      } catch (err) {
        console.error("Failed to load company config", err);
        toast.error("Failed to load app configuration");
      }
    },
    getCartQty(product) {
       const item = this.cart.find(i => i.product.productName === product.productName);
       return item ? item.quantity : 0;
    },
    updateCart(product, change) {
       const index = this.cart.findIndex(i => i.product.productName === product.productName);
       if (index !== -1) {
          const newQty = this.cart[index].quantity + change;
          if (newQty <= 0) {
             this.cart.splice(index, 1);
          } else {
             this.cart[index].quantity = newQty;
          }
       } else if (change > 0) {
          this.addToCart(product);
       }
    },
    sendOrderToWhatsapp() {
      if (this.cart.length === 0) return;
      this.showOrderDetailsModal = true;
    },
    finalizeOrderAndSend() {
      if (!this.customerName.trim()) {
        toast.error("Please enter your name", { autoClose: 2000 });
        return;
      }
      if (!this.customerPhone.trim()) {
        toast.error("Please enter your phone number", { autoClose: 2000 });
        return;
      }

      const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'numeric', year: 'numeric' });
      
      let message = `Order for ${this.config.companyName || 'SBE'}\n`;
      message += `From: ${this.customerName} (${this.customerPhone})\n\n`;
      message += `Order Summary\n`;
      message += `------------------\n`;
      
      this.cart.forEach((item) => {
        const qtyLabel = item.quantity > 1 ? 'Sets' : 'Set';
        message += `\n*${item.product.productName}*\n`;
        message += `> ${item.quantity} ${qtyLabel}\n`;
      });
      
      message += `\n_Generated on ${date}_\n`;
      
      const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
      this.showOrderDetailsModal = false;
    },
    addToCart(product) {
      const existingItem = this.cart.find(item => item.product.productName === product.productName);
      if (existingItem) {
        existingItem.quantity++;
        toast.success("Increased quantity in cart", { autoClose: 1000 });
      } else {
        this.cart.push({ product, quantity: 1 });
        toast.success("Added to cart", { autoClose: 1500 });
      }
      // Note: Auto-open disabled per request
      // this.showCart = true; 
    },
    removeFromCart(index) {
      this.cart.splice(index, 1);
    },
    updateCartQuantity(index, diff) {
      const item = this.cart[index];
      const newQty = item.quantity + diff;
      if (newQty <= 0) {
        this.removeFromCart(index);
      } else {
        item.quantity = newQty;
      }
    },
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
          const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/stock`);
          data = response.data;
        } else {
          const response = await fetch(`${import.meta.env.BASE_URL}assets/stock-data.json`);
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
          `${import.meta.env.VITE_BACKEND_URL}/api/updateStockData`
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
      if (!password) return; // User cancelled or entered empty
      
      if (password === "admin123") {
        this.isAdmin = true;
        this.isSuperAdmin = false;
        toast.success("Admin Mode Enabled", { autoClose: 2000 });
      } else if (password === "superadmin") {
        this.isAdmin = false;
        this.isSuperAdmin = true;
        toast.success("Super Admin Mode Enabled", { autoClose: 2000 });
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
        formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );
        const data = await response.json();
        if (!data.secure_url) {
          throw new Error("Upload failed");
        }
        await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/updateImage`, {
          productName,
          imageUrl: data.secure_url,
        });
        this.stockData = this.stockData.map((group) => ({
          ...group,
          products: group.products.map((product) =>
            product.productName === productName
              ? { ...product, imageUrl: data.secure_url, imageUploadedAt: new Date().toISOString() }
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
        await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/removeImage`, {
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
    scrollToGroup(groupName) {
      const id = 'group-grid-' + this.normalizeId(groupName);
      const element = document.getElementById(id);
      if (element) {
        // Adjust for sticky header
        const y = element.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
        
        this.activeScrollGroup = groupName;
        // Close sidebar on mobile after selection
        if (window.innerWidth < 1024) {
            this.showSidePanel = false;
        }
      }
    },
    normalizeId(name) {
      if (!name) return '';
      return name.replace(/\s+/g, '-').replace(/[^\w-]/g, '').toLowerCase();
    },
    // New Reusable Sort Logic
    compareGroups(a, b) {
      const normalize = (name) => name ? name.toLowerCase().trim() : '';
      const nameA = normalize(a.groupName);
      const nameB = normalize(b.groupName);
      
      const sortList = this.config.sortPriority || [];
      
      const indexA = sortList.findIndex((key) => nameA.includes(key));
      const indexB = sortList.findIndex((key) => nameB.includes(key));
      
      // If both match logic, compare their indices in priority list
      if (indexA !== -1 && indexB !== -1) {
         // But wait, if they match DIFFERENT keys, we respect the order of keys.
         // If they match the SAME key (e.g. both 'paragon'), we might want alpha sort?
         // This simple check assumes strict ordering in config.
         return indexA - indexB;
      }
      
      if (indexA !== -1) return -1; // A has priority
      if (indexB !== -1) return 1;  // B has priority
      
      // "Old" Check - Force to bottom (should be last rule)
      const isOldA = nameA.includes('old');
      const isOldB = nameB.includes('old');
      if (isOldA && !isOldB) return 1;
      if (!isOldA && isOldB) return -1;
      
      // Default: Alphabetical
      return nameA.localeCompare(nameB);
    },
    applyTheme() {
       const theme = this.config.theme || 'blue';
       const colors = {
          blue: { 600: '#2563eb', 500: '#3b82f6', 50: '#eff6ff', 100: '#dbeafe' },
          green: { 600: '#16a34a', 500: '#22c55e', 50: '#f0fdf4', 100: '#dcfce7' },
          orange: { 600: '#ea580c', 500: '#f97316', 50: '#fff7ed', 100: '#ffedd5' },
       };
       
       const c = colors[theme] || colors.blue;
       
       const styleId = 'sbe-theme-styles';
       let styleEl = document.getElementById(styleId);
       if (!styleEl) {
          styleEl = document.createElement('style');
          styleEl.id = styleId;
          document.head.appendChild(styleEl);
       }
       
       styleEl.innerHTML = `
         /* Override Blue Utils with Request Theme */
         .text-blue-600 { color: ${c[600]} !important; }
         .bg-blue-600 { background-color: ${c[600]} !important; }
         .border-blue-600 { border-color: ${c[600]} !important; }
         
         .bg-blue-50 { background-color: ${c[50]} !important; }
         .hover\\:bg-blue-50:hover { background-color: ${c[50]} !important; }
         
         .text-blue-500 { color: ${c[500]} !important; }
         .border-blue-500 { border-color: ${c[500]} !important; }
         
        /* Holographic Text Effect */
        .holographic-text {
            background-image: linear-gradient(
                135deg, 
                #ff00cc 0%, 
                #3333ff 25%, 
                #00dbde 50%, 
                #9900ff 75%, 
                #ff00cc 100%
            );
            background-size: 200% auto;
            color: transparent;
            -webkit-background-clip: text;
            background-clip: text;
            animation: holographic-shimmer 3s linear infinite;
            text-shadow: 0px 2px 4px rgba(0,0,0,0.1);
            filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.5));
        }

        @keyframes holographic-shimmer {
            0% { background-position: 0% 50%; }
            100% { background-position: 200% 50%; }
        }
       `;
    }
  },
};
</script>

<style scoped>
img {
  max-width: 100%;
  max-height: 100%;
}
</style>
