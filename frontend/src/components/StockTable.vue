<template>
  <div class="min-h-screen w-full bg-slate-50 font-sans text-slate-800">
    <!-- Sticky Header with Glassmorphism -->
    <header
      class="sticky top-0 z-[50] w-full bg-white border-b border-slate-200 transition-all duration-300 py-2"
    >
      <div class="w-full px-2 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between gap-4">
          <!-- Left: Sidebar Toggle & Sync -->
          <div class="flex items-center gap-3">
             <button
              @click="toggleSidebar"
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

          <!-- Center: Title & Search -->
          <div class="flex-1 flex flex-col items-center justify-center px-2">
            <h1 
              class="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 select-none inline-block cursor-pointer leading-none"
              @click="promptAdminLogin"
              title="Admin Login"
            >
              <span class="text-blue-600">{{ companyName.split(' ')[0] }}</span> {{ companyName.split(' ').slice(1).join(' ') }}
            </h1>
            <span class="text-[10px] text-slate-400 font-medium mt-0.5 mb-2">
               Last Synced: {{ lastRefresh ? lastRefresh.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "Never" }}
            </span>
            
            <!-- Integrated Search Bar -->
            <div class="relative w-full max-w-md">
               <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <i class="fa-solid fa-magnifying-glass"></i>
               </span>
               <input
                 v-model="searchQuery"
                 type="text"
                 placeholder="Search items..."
                 class="w-full pl-9 pr-4 py-1.5 rounded-full bg-slate-100/50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
               />
            </div>
          </div>

          <!-- Right: Cart & Sync -->
          <div class="flex items-center justify-end gap-2">
             <!-- Compact Image Toggle -->
             <label class="hidden sm:flex items-center cursor-pointer select-none" title="Show Images Only">
                 <input type="checkbox" v-model="showImagesOnly" class="sr-only peer">
                 <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 relative"></div>
                 <i class="fa-solid fa-image text-slate-400 ml-2 text-sm peer-checked:text-blue-600"></i>
             </label>

             <button
               @click="toggleCart"
               class="relative group p-2 bg-blue-600 rounded-full hover:bg-blue-700 transition-all shadow-md active:scale-95 shrink-0"
               title="Toggle Cart"
             >
               <div v-if="cartTotalItems > 0" class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm z-10 border border-white">{{ cartTotalItems }}</div>
               <i class="fa-solid fa-cart-shopping text-white text-lg"></i>
             </button>
          </div>
        </div>
      </div>
    </header>

    <div class="flex w-full">
      <!-- Side Panel (Bird Eye View) -->
      <aside
        class="fixed inset-y-0 left-0 bg-white border-r border-slate-200 w-full sm:w-80 lg:w-80 z-[60] lg:z-40 transform transition-transform duration-300 ease-in-out pt-0 lg:pt-40"
        :class="showSidePanel ? 'translate-x-0' : '-translate-x-full'"
      >
        <div class="p-4 h-full overflow-y-auto">
           <div class="flex items-center justify-between mb-4 lg:hidden">
             <h2 class="text-lg font-bold text-slate-800">Brands</h2>
             <button @click="showSidePanel = false" class="w-auto p-2 shrink-0 transition-transform active:scale-90 bg-transparent hover:bg-transparent shadow-none border-none inline-flex items-center justify-center">
               <i class="fa-solid fa-xmark text-2xl text-blue-600"></i>
             </button>
           </div>
           <nav class="space-y-1">
              <template v-for="(group, index) in filteredStockData" :key="group.groupName">
                 <div 
                   class="flex items-center justify-between rounded-lg px-3 py-2 transition-colors group/brand mb-0.5"
                   :class="activeScrollGroup === group.groupName ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'"
                 >
                   <a
                     href="#"
                     @click.prevent="scrollToGroup(group.groupName)"
                     class="flex items-center gap-2 flex-1 min-w-0 outline-none"
                   >
                      <span class="w-1.5 h-1.5 shrink-0 rounded-full bg-slate-300 group-hover/brand:bg-blue-400 transition-colors" :class="activeScrollGroup === group.groupName ? 'bg-blue-600' : ''"></span>
                      <span class="truncate font-medium text-sm leading-none">{{ group.groupName }}</span>
                   </a>
                   <button 
                     @click.stop="shareBrand(group.groupName)"
                     class="w-8 h-8 flex items-center justify-center shrink-0 text-blue-600 transition-all sm:opacity-0 sm:group-hover/brand:opacity-100 active:scale-95 bg-transparent hover:bg-transparent shadow-none border-none"
                     title="Share Link"
                   >
                     <i class="fa-solid fa-share-nodes text-sm"></i>
                   </button>
                 </div>
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
           <button @click="closePane" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors shrink-0">
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
         class="flex-1 w-full px-2 sm:px-6 lg:px-8 pt-1 pb-6 space-y-6 min-w-0 transition-all duration-300"
         :class="{'mr-0 lg:mr-80': showCart, 'ml-0 lg:ml-80': showSidePanel}"
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
        <!-- Breadcrumb Removed -->
        
        <!-- Brand Filters (Scrollable Horizontal List) -->
        <!-- Toolbar Removed -->

        <!-- Info Bar Removed -->
        <!-- Error Bar -->
        <div v-if="error" class="flex flex-col sm:flex-row justify-end items-center text-xs text-slate-500 px-2">
          <span class="text-red-500 font-medium mt-1 sm:mt-0">{{ error }}</span>
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
            :id="'group-grid-' + normalizeId(group.groupName)"
            class="bg-transparent overflow-hidden"
          >
            <!-- Group Header -->
            <div
              @click="toggleGroup(index)"
              class="px-4 sm:px-6 py-4 cursor-pointer select-none transition-colors flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10 rounded-2xl shadow-sm border border-slate-100 mb-4"
              :class="expandedGroups[index] ? 'rounded-b-none border-b-0' : 'hover:bg-slate-50'"
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
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-4 pb-4 px-0.5">
                  <div
                    v-for="(product, pIndex) in group.products"
                    :key="product.productName"
                    class="bg-white p-1.5 sm:p-2.5 relative group flex flex-col h-full rounded-2xl shadow-sm border border-slate-200 transition-shadow hover:shadow-md"
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
                    <h3 class="text-sm font-bold text-slate-700 leading-snug line-clamp-3 mb-1 min-h-[2.5rem] text-center" :title="formatProductName(product.productName)">
                      {{ formatProductName(product.productName) }}
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

    <!-- Floating Image Toggle (Mobile, Left) - Disappears on Scroll -->
    <transition enter-active-class="transition duration-300 ease-out" enter-from-class="translate-y-10 opacity-0" enter-to-class="translate-y-0 opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <button
        v-if="!isScrolled" 
        @click="showImagesOnly = !showImagesOnly"
        class="fixed bottom-6 left-6 h-12 px-5 inline-flex w-auto items-center gap-2 rounded-full shadow-2xl transition-all z-[40] md:hidden border"
        :class="showImagesOnly ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-slate-600 border-slate-200'"
      >
        <i class="fa-solid fa-image text-lg"></i>
        <span class="text-xs font-bold">{{ showImagesOnly ? 'Images' : 'All' }}</span>
      </button>
    </transition>

    <!-- Full Screen Product Page -->
    <transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0 translate-y-4" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-4">
      <div
        v-if="showImagePopup"
        class="fixed inset-0 z-[100] bg-slate-50 overflow-y-auto overflow-x-hidden flex flex-col"
      >
        <!-- Sticky Navbar -->
        <div class="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
           <button @click="closeImagePopup" class="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-bold transition-colors px-2 py-1 rounded-lg hover:bg-slate-100">
              <i class="fa-solid fa-arrow-left"></i>
              <span>Back to Browse</span>
           </button>
           
           <div class="flex items-center gap-4">
             <!-- Desktop Nav -->
             <div class="hidden md:flex items-center gap-2">
                 <button 
                   @click="navigateImage(-1)" 
                   class="w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 hover:bg-slate-100 hover:text-blue-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                   :disabled="currentProductIndex <= 0"
                   title="Previous Product"
                 >
                   <i class="fa-solid fa-chevron-left"></i>
                 </button>
                 <button 
                   @click="navigateImage(1)" 
                   class="w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 hover:bg-slate-100 hover:text-blue-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                   :disabled="currentProductIndex >= currentGroupProducts.length - 1"
                   title="Next Product"
                 >
                    <i class="fa-solid fa-chevron-right"></i>
                 </button>
             </div>
           </div>
        </div>

        <!-- Main Content -->
        <div class="max-w-7xl mx-auto w-full flex-1 flex flex-col md:flex-row p-4 md:p-8 gap-6 md:gap-12">
            
            <!-- Image Section (Left) -->
            <div class="flex-1 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center p-6 sm:p-10 relative overflow-hidden min-h-[40vh] md:min-h-[60vh]">
               <img
                 v-if="currentProduct.imageUrl"
                 :src="getOptimizedUrl(currentProduct.imageUrl)"
                 class="w-full h-full object-contain max-h-[70vh] drop-shadow-xl transition-all duration-300"
                 :key="currentProduct.imageUrl" 
               />
               <div v-else class="flex flex-col items-center gap-4 text-slate-300">
                  <i class="fa-solid fa-image text-6xl opacity-20"></i>
                  <span class="font-medium">No Image Available</span>
               </div>
            </div>

            <!-- Details Section (Right) -->
            <div class="w-full md:w-[400px] lg:w-[480px] flex flex-col gap-8 py-4">
               
               <div>
                  <div class="flex items-center gap-2 mb-3">
                     <span class="px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">{{ currentGroupName }}</span>
                     <span v-if="currentProduct.imageUploadedAt" class="px-2.5 py-1 rounded-md bg-green-50 text-green-600 text-xs font-bold uppercase tracking-wider">New Arrival</span>
                  </div>
                  <h1 class="text-2xl md:text-4xl font-black text-slate-800 leading-tight mb-4">
                    {{ currentProduct.productName }}
                  </h1>
                  
                  <div class="flex items-center gap-3">
                     <div class="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg flex items-center gap-2 border border-blue-100">
                        <i class="fa-solid fa-cubes"></i>
                        <span class="font-bold text-lg">{{ currentProduct.quantity }}</span> 
                        <span class="text-xs uppercase font-bold tracking-wider opacity-70">Stock</span>
                     </div>
                  </div>
               </div>

               <hr class="border-slate-100" />

               <!-- Action Area -->
               <div class="space-y-4">
                  <div v-if="getCartQty(currentProduct) > 0" class="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between">
                      <span class="font-bold text-slate-700">In your cart</span>
                      <div class="flex items-center gap-3">
                         <button @click="updateCart(currentProduct, -1)" class="w-10 h-10 flex items-center justify-center bg-white border border-blue-200 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-colors shadow-sm active:scale-95">
                           <i class="fa-solid fa-minus"></i>
                         </button>
                         <span class="text-xl font-black text-blue-700 min-w-[2rem] text-center">{{ getCartQty(currentProduct) }}</span>
                         <button @click="updateCart(currentProduct, 1)" class="w-10 h-10 flex items-center justify-center bg-white border border-blue-200 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-colors shadow-sm active:scale-95">
                           <i class="fa-solid fa-plus"></i>
                         </button>
                      </div>
                  </div>

                  <button 
                    v-else
                    @click="addToCart(currentProduct)"
                    class="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-blue-600 shadow-xl shadow-slate-900/10 hover:shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-3 text-lg"
                  >
                    <i class="fa-solid fa-cart-shopping"></i>
                    Add to Cart
                  </button>
                  
                  <p class="text-xs text-center text-slate-400 mt-2">
                     Tap 'Add to Cart' to include this in your order list.
                  </p>
               </div>
               
               <!-- Mobile Only Nav (Fixed Bottom relative to this col, or standard flow) -->
               <div class="md:hidden grid grid-cols-2 gap-4 mt-auto pt-8">
                   <button 
                     @click="navigateImage(-1)" 
                     class="py-3 px-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl active:scale-95 transition-all disabled:opacity-50"
                     :disabled="currentProductIndex <= 0"
                   >
                     Previous
                   </button>
                   <button 
                     @click="navigateImage(1)" 
                     class="py-3 px-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl active:scale-95 transition-all disabled:opacity-50"
                     :disabled="currentProductIndex >= currentGroupProducts.length - 1"
                   >
                     Next
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
      selectedGroup: "All",
      showGoToTop: false,
      isScrolled: false,
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
      // Search actual groups
      const groupMatch = this.stockData.find(g => g.groupName.toLowerCase() === paramLower);
      if (groupMatch) {
         this.$nextTick(() => {
            this.scrollToGroup(groupMatch.groupName);
         });
      }
    }

    // Check for URL param "product" (Deep Linking)
    const productParam = params.get('product');
    if (productParam) {
       // Search for product across all groups (including filtered/hidden ones)
       // We should search in `this.stockData` to be safe, but `filteredStockData` drives the UI groups.
       // However, `filteredStockData` might be empty if filters are weird? No, usually it has "All".
       // Let's search `this.stockData` to find the Group Index and Product.
       
       let found = false;
       for (let gIndex = 0; gIndex < this.stockData.length; gIndex++) {
          const group = this.stockData[gIndex];
          const pIndex = group.products.findIndex(p => p.productName === productParam);
          if (pIndex !== -1) {
             // Found it!
             this.openImagePopup(group.products[pIndex], gIndex);
             found = true;
             break;
          }
       }
       if (!found) {
          console.warn("Deep linked product not found:", productParam);
          // Optional: clear param if invalid?
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
    window.addEventListener("popstate", this.handlePopState);

    // Deep Linking Fix: If product is present, replace root then push product
    const initialParams = new URLSearchParams(window.location.search);
    if (initialParams.get('product')) {
       const pParam = initialParams.get('product');
       // Replace current (product) with Root
       const rootUrl = new URL(window.location);
       rootUrl.searchParams.delete('product');
       window.history.replaceState(null, '', rootUrl);
       // Push Product
       const prodUrl = new URL(window.location);
       prodUrl.searchParams.set('product', pParam);
       window.history.pushState(null, '', prodUrl);
    }
  },
  beforeUnmount() {
    window.removeEventListener("scroll", this.handleScroll);
    window.removeEventListener("popstate", this.handlePopState);
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
    formatProductName(name) {
      if (!name) return '';
      // First letter capital, rest small for every word
      return name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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
      
      // Update URL
      const url = new URL(window.location);
      url.searchParams.set('product', product.productName);
      window.history.pushState({}, '', url);
    },
    closeImagePopup(isPop = false) {
      this.showImagePopup = false;
      this.currentProduct = {};
      this.currentGroupIndex = null;
      this.currentGroupProducts = [];
      this.currentGroupName = "";
      this.currentProductIndex = 0;
      
      // Navigate Back (undo pushState)
      if (!isPop) {
         window.history.back();
      }
    },
    navigateImage(direction) {
      const newIndex = this.currentProductIndex + direction;
      if (newIndex >= 0 && newIndex < this.currentGroupProducts.length) {
        this.currentProductIndex = newIndex;
        this.currentProductIndex = newIndex;
        this.currentProduct = this.currentGroupProducts[newIndex];
        
        // Update URL
        const url = new URL(window.location);
        url.searchParams.set('product', this.currentProduct.productName);
        window.history.replaceState({}, '', url);
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
    // Pane Management
    toggleSidebar() {
      if (this.showSidePanel) this.closePane();
      else this.openSidebar();
    },
    toggleCart() {
      if (this.showCart) this.closePane();
      else this.openCart();
    },
    openSidebar() {
       this.showSidePanel = true;
       window.history.pushState({ pane: 'side' }, '');
    },
    openCart() {
       this.showCart = true;
       window.history.pushState({ pane: 'cart' }, '');
    },
    closePane() {
       window.history.back();
    },
    handlePopState(event) {
       // Close modal if open
       if (this.showImagePopup) {
           this.closeImagePopup(true); // true = don't call back()
           return;
       }
       // Close sidebars
       if (this.showSidePanel) {
           this.showSidePanel = false;
           return;
       }
       if (this.showCart) {
           this.showCart = false;
           return;
       }
    },
    handleScroll() {
      this.showGoToTop = window.scrollY > 300;
      this.isScrolled = window.scrollY > 20;
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
    
    // Update URL
    const url = new URL(window.location);
    url.searchParams.set('brand', groupName);
    window.history.replaceState(null, '', url);

    // Close sidebar on mobile after selection
        if (window.innerWidth < 1024) {
             // We pushed state when opening. Now we selected.
             // We should Back to close.
            this.closePane();
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
