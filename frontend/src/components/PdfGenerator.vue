<template>
  <div class="flex flex-col lg:flex-row h-screen w-full bg-slate-50 font-sans text-slate-800 overflow-hidden">
    <!-- Sidebar -->
    <aside 
      class="border-r border-slate-200 bg-white flex-shrink-0 flex-col h-full z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 w-full lg:w-[480px]"
      :class="[mobileTab === 'brands' ? 'flex' : 'hidden lg:flex']"
    >
      <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10">
         <div class="flex items-center gap-2">
            <h2 class="text-xl font-black text-slate-800 tracking-tight">Brands</h2>
            <span class="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">{{ brands.length }}</span>
         </div>
         <button @click="selectedBrands = []" class="text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors" v-if="selectedBrands.length > 0">Clear</button>
      </div>
      
      <div class="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar pb-24 lg:pb-4">
         
         <!-- Paragon Section -->
         <div v-if="groupedSidebar.paragon.length > 0" class="p-2 transition-all rounded-2xl bg-red-50/30 hover:bg-red-50/60 border border-transparent hover:border-red-100">
            <div class="flex items-center justify-between px-2 mb-3">
               <div class="flex items-center gap-2">
                  <img src="https://res.cloudinary.com/dg365ewal/image/upload/v1749667072/paragonLogo_rqk3hu.webp" alt="Paragon" class="h-6 object-contain" />
               </div>
               <input type="checkbox" :checked="isCategorySelected('paragon')" @change="toggleCategory('paragon', $event)" class="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer" />
            </div>
            <div class="grid grid-cols-2 gap-2">
               <div 
                 v-for="item in groupedSidebar.paragon" 
                 :key="item.groupName"
                 class="flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer bg-white border border-transparent hover:border-red-200 shadow-sm hover:shadow-md select-none"
                 :class="{ '!bg-red-50 !border-red-200 ring-1 ring-red-200': selectedBrands.includes(item.groupName) }"
                 @click="toggleBrand(item.groupName)"
               >
                  <input type="checkbox" :checked="selectedBrands.includes(item.groupName)" class="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-gray-300 pointer-events-none" />
                  <span class="text-sm font-semibold text-slate-700 leading-tight" :class="{ 'text-red-800': selectedBrands.includes(item.groupName) }">{{ formatProductName(item.groupName) }}</span>
               </div>
            </div>
         </div>

         <!-- Top Brands Section -->
         <div v-if="groupedSidebar.topBrands.length > 0" class="p-2 transition-all rounded-2xl bg-amber-50/30 hover:bg-amber-50/60 border border-transparent hover:border-amber-100">
            <div class="flex items-center justify-between px-2 mb-3">
               <span class="text-xs font-black text-amber-600 uppercase tracking-widest pl-1">Top Brands</span>
               <input type="checkbox" :checked="isCategorySelected('topBrands')" @change="toggleCategory('topBrands', $event)" class="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer" />
            </div>
            <div class="grid grid-cols-2 gap-2">
               <div 
                 v-for="item in groupedSidebar.topBrands" 
                 :key="item.group.groupName"
                 class="flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer bg-white border border-transparent hover:border-amber-200 shadow-sm hover:shadow-md select-none"
                 :class="{ '!bg-amber-50 !border-amber-200 ring-1 ring-amber-200': selectedBrands.includes(item.group.groupName) }"
                 @click="toggleBrand(item.group.groupName)"
               >
                  <input type="checkbox" :checked="selectedBrands.includes(item.group.groupName)" class="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-gray-300 pointer-events-none" />
                  <div class="flex items-center gap-2 overflow-hidden">
                     <div class="w-6 h-6 rounded-full bg-white border border-amber-100 p-0.5 shrink-0 overflow-hidden shadow-sm flex items-center justify-center">
                        <img v-if="item.logo" :src="item.logo" class="w-full h-full object-contain" />
                        <span v-else class="text-[8px] font-bold text-amber-600">{{ item.group.groupName[0] }}</span>
                     </div>
                     <span class="text-sm font-semibold text-slate-700 leading-tight truncate" :class="{ 'text-amber-800': selectedBrands.includes(item.group.groupName) }">{{ formatProductName(item.group.groupName) }}</span>
                  </div>
               </div>
            </div>
         </div>

         <!-- Mid Brands (Purple) -->
         <div v-if="groupedSidebar.midBrands.length > 0" class="p-2 transition-all rounded-2xl bg-purple-50/30 hover:bg-purple-50/60 border border-transparent hover:border-purple-100">
            <div class="flex items-center justify-between px-2 mb-3">
               <span class="text-xs font-black text-purple-600 uppercase tracking-widest pl-1">Mid Brands</span>
               <input type="checkbox" :checked="isCategorySelected('midBrands')" @change="toggleCategory('midBrands', $event)" class="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer" />
            </div>
            <div class="grid grid-cols-2 gap-2">
               <div 
                 v-for="item in groupedSidebar.midBrands" 
                 :key="item.groupName"
                 class="flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer bg-white border border-transparent hover:border-purple-200 shadow-sm hover:shadow-md select-none"
                 :class="{ '!bg-purple-50 !border-purple-200 ring-1 ring-purple-200': selectedBrands.includes(item.groupName) }"
                 @click="toggleBrand(item.groupName)"
               >
                  <input type="checkbox" :checked="selectedBrands.includes(item.groupName)" class="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-gray-300 pointer-events-none" />
                  <span class="text-sm font-semibold text-slate-700 leading-tight" :class="{ 'text-purple-800': selectedBrands.includes(item.groupName) }">{{ formatProductName(item.groupName) }}</span>
               </div>
            </div>
         </div>

         <!-- Socks (Cyan) -->
         <div v-if="groupedSidebar.socksGroups.length > 0" class="p-2 transition-all rounded-2xl bg-cyan-50/30 hover:bg-cyan-50/60 border border-transparent hover:border-cyan-100">
            <div class="flex items-center justify-between px-2 mb-3">
               <span class="text-xs font-black text-cyan-600 uppercase tracking-widest pl-1">Socks</span>
               <input type="checkbox" :checked="isCategorySelected('socksGroups')" @change="toggleCategory('socksGroups', $event)" class="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer" />
            </div>
            <div class="grid grid-cols-2 gap-2">
               <div 
                 v-for="item in groupedSidebar.socksGroups" 
                 :key="item.groupName"
                 class="flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer bg-white border border-transparent hover:border-cyan-200 shadow-sm hover:shadow-md select-none"
                 :class="{ '!bg-cyan-50 !border-cyan-200 ring-1 ring-cyan-200': selectedBrands.includes(item.groupName) }"
                 @click="toggleBrand(item.groupName)"
               >
                  <input type="checkbox" :checked="selectedBrands.includes(item.groupName)" class="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-gray-300 pointer-events-none" />
                  <span class="text-sm font-semibold text-slate-700 leading-tight" :class="{ 'text-cyan-800': selectedBrands.includes(item.groupName) }">{{ formatProductName(item.groupName) }}</span>
               </div>
            </div>
         </div>
         
         <!-- General & Clubs Wrapper -->
         <div class="p-4 bg-emerald-50/40 border border-emerald-100 rounded-2xl space-y-6">
            
            <!-- General Items -->
            <div v-if="groupedSidebar.general.length > 0">
                <div class="flex items-center justify-between px-2 mb-3">
                   <span class="text-xs font-black text-emerald-600 uppercase tracking-widest pl-1">General</span>
                   <input type="checkbox" :checked="isCategorySelected('general')" @change="toggleCategory('general', $event)" class="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer" />
                </div>
                 <div class="grid grid-cols-2 gap-2">
                   <div 
                     v-for="item in groupedSidebar.general" 
                     :key="item.groupName"
                     class="flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer bg-white border border-transparent hover:border-emerald-200 shadow-sm hover:shadow-md select-none"
                     :class="{ '!bg-emerald-50 !border-emerald-200 ring-1 ring-emerald-200': selectedBrands.includes(item.groupName) }"
                     @click="toggleBrand(item.groupName)"
                   >
                      <input type="checkbox" :checked="selectedBrands.includes(item.groupName)" class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 pointer-events-none" />
                      <span class="text-sm font-semibold text-slate-700 leading-tight" :class="{ 'text-emerald-800': selectedBrands.includes(item.groupName) }">{{ formatProductName(item.groupName) }}</span>
                   </div>
                </div>
            </div>
            
             <!-- Bansal Club -->
            <div v-if="groupedSidebar.bansalGroups.length > 0">
                <div class="flex items-center justify-between px-2 mb-3">
                   <span class="text-xs font-black text-emerald-600 uppercase tracking-widest pl-1">BANSAL CLUB</span>
                   <input type="checkbox" :checked="isCategorySelected('bansalGroups')" @change="toggleCategory('bansalGroups', $event)" class="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer" />
                </div>
                 <div class="grid grid-cols-2 gap-2">
                   <div 
                     v-for="item in groupedSidebar.bansalGroups" 
                     :key="item.groupName"
                     class="flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer bg-white border border-transparent hover:border-emerald-200 shadow-sm hover:shadow-md select-none"
                     :class="{ '!bg-emerald-50 !border-emerald-200 ring-1 ring-emerald-200': selectedBrands.includes(item.groupName) }"
                     @click="toggleBrand(item.groupName)"
                   >
                      <input type="checkbox" :checked="selectedBrands.includes(item.groupName)" class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 pointer-events-none" />
                      <span class="text-sm font-semibold text-slate-700 leading-tight" :class="{ 'text-emerald-800': selectedBrands.includes(item.groupName) }">{{ formatProductName(item.groupName) }}</span>
                   </div>
                </div>
            </div>

            <!-- Airson Club -->
            <div v-if="groupedSidebar.airsonGroups.length > 0">
                <div class="flex items-center justify-between px-2 mb-3">
                   <span class="text-xs font-black text-emerald-600 uppercase tracking-widest pl-1">AIRSON CLUB</span>
                   <input type="checkbox" :checked="isCategorySelected('airsonGroups')" @change="toggleCategory('airsonGroups', $event)" class="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer" />
                </div>
                 <div class="grid grid-cols-2 gap-2">
                   <div 
                     v-for="item in groupedSidebar.airsonGroups" 
                     :key="item.groupName"
                     class="flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer bg-white border border-transparent hover:border-emerald-200 shadow-sm hover:shadow-md select-none"
                     :class="{ '!bg-emerald-50 !border-emerald-200 ring-1 ring-emerald-200': selectedBrands.includes(item.groupName) }"
                     @click="toggleBrand(item.groupName)"
                   >
                      <input type="checkbox" :checked="selectedBrands.includes(item.groupName)" class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 pointer-events-none" />
                      <span class="text-sm font-semibold text-slate-700 leading-tight" :class="{ 'text-emerald-800': selectedBrands.includes(item.groupName) }">{{ formatProductName(item.groupName) }}</span>
                   </div>
                </div>
            </div>

            <!-- Kohinoor Club -->
            <div v-if="groupedSidebar.kohinoorGroups.length > 0">
                <div class="flex items-center justify-between px-2 mb-3">
                   <span class="text-xs font-black text-emerald-600 uppercase tracking-widest pl-1">KOHINOOR CLUB</span>
                   <input type="checkbox" :checked="isCategorySelected('kohinoorGroups')" @change="toggleCategory('kohinoorGroups', $event)" class="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer" />
                </div>
                 <div class="grid grid-cols-2 gap-2">
                   <div 
                     v-for="item in groupedSidebar.kohinoorGroups" 
                     :key="item.groupName"
                     class="flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer bg-white border border-transparent hover:border-emerald-200 shadow-sm hover:shadow-md select-none"
                     :class="{ '!bg-emerald-50 !border-emerald-200 ring-1 ring-emerald-200': selectedBrands.includes(item.groupName) }"
                     @click="toggleBrand(item.groupName)"
                   >
                      <input type="checkbox" :checked="selectedBrands.includes(item.groupName)" class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 pointer-events-none" />
                      <span class="text-sm font-semibold text-slate-700 leading-tight" :class="{ 'text-emerald-800': selectedBrands.includes(item.groupName) }">{{ formatProductName(item.groupName) }}</span>
                   </div>
                </div>
            </div>

            <!-- Naresh Club -->
            <div v-if="groupedSidebar.nareshGroups.length > 0">
                <div class="flex items-center justify-between px-2 mb-3">
                   <span class="text-xs font-black text-emerald-600 uppercase tracking-widest pl-1">NARESH CLUB</span>
                   <input type="checkbox" :checked="isCategorySelected('nareshGroups')" @change="toggleCategory('nareshGroups', $event)" class="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer" />
                </div>
                 <div class="grid grid-cols-2 gap-2">
                   <div 
                     v-for="item in groupedSidebar.nareshGroups" 
                     :key="item.groupName"
                     class="flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer bg-white border border-transparent hover:border-emerald-200 shadow-sm hover:shadow-md select-none"
                     :class="{ '!bg-emerald-50 !border-emerald-200 ring-1 ring-emerald-200': selectedBrands.includes(item.groupName) }"
                     @click="toggleBrand(item.groupName)"
                   >
                      <input type="checkbox" :checked="selectedBrands.includes(item.groupName)" class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 pointer-events-none" />
                      <span class="text-sm font-semibold text-slate-700 leading-tight" :class="{ 'text-emerald-800': selectedBrands.includes(item.groupName) }">{{ formatProductName(item.groupName) }}</span>
                   </div>
                </div>
            </div>

         </div>

         <!-- Others -->
         <div v-if="groupedSidebar.others.length > 0" class="p-2 transition-all rounded-2xl bg-slate-50 border border-transparent hover:border-slate-200">
            <div class="flex items-center justify-between px-2 mb-3">
               <span class="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Others</span>
               <input type="checkbox" :checked="isCategorySelected('others')" @change="toggleCategory('others', $event)" class="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer" />
            </div>
            <div class="grid grid-cols-2 gap-2">
               <div 
                 v-for="item in groupedSidebar.others" 
                 :key="item.groupName"
                 class="flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer bg-white border border-transparent hover:border-slate-300 shadow-sm hover:shadow-md select-none"
                 :class="{ '!bg-slate-100 !border-slate-300 ring-1 ring-slate-300': selectedBrands.includes(item.groupName) }"
                 @click="toggleBrand(item.groupName)"
               >
                  <input type="checkbox" :checked="selectedBrands.includes(item.groupName)" class="w-4 h-4 rounded text-slate-600 focus:ring-slate-500 border-gray-300 pointer-events-none" />
                  <span class="text-sm font-semibold text-slate-700 leading-tight" :class="{ 'text-slate-900': selectedBrands.includes(item.groupName) }">{{ formatProductName(item.groupName) }}</span>
               </div>
            </div>
         </div>

      </div>
    </aside>

    <!-- Main Content -->
    <main 
      class="flex-1 flex-col h-full relative overflow-hidden bg-slate-50/50"
      :class="[mobileTab === 'export' ? 'flex' : 'hidden lg:flex']"
    >
       <div class="flex h-full flex-col lg:flex-row w-full"> 
          <!-- Settings & Actions Area -->
          <div class="flex-1 overflow-y-auto p-4 lg:p-10 pb-24 lg:pb-10 w-full">
              <header class="mb-8 flex items-center gap-4">
                  <button @click="$router.push('/')" class="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md active:scale-95 border border-white/20" title="Home">
                     <i class="fa-solid fa-house"></i>
                  </button>
                  <div>
                      <h1 class="text-3xl font-black text-slate-800 tracking-tight">Generate Catalog</h1>
                      <p class="text-slate-500 font-medium">Configure your export settings</p>
                  </div>
              </header>



              <div class="space-y-6 max-w-2xl">
                 <!-- Filters Card -->
                 <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                       <i class="fa-solid fa-filter text-blue-500"></i> Filters
                    </h3>
                    <div class="space-y-4">
                       <label class="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all">
                          <input type="checkbox" v-model="onlyWithPhotos" class="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                          <span class="font-medium text-slate-700">Only include products with photos</span>
                       </label>

                       <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <div class="flex items-center justify-between mb-2">
                             <label class="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" v-model="minQtyEnabled" class="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                                <span class="font-medium text-slate-700">Minimum Quantity Filter</span>
                             </label>
                             <div class="flex items-center gap-2" :class="{ 'opacity-50 pointer-events-none': !minQtyEnabled }">
                                <input type="number" v-model.number="minQty" class="w-16 text-center font-bold bg-white border border-slate-300 rounded-lg py-1 focus:ring-2 focus:ring-blue-500 outline-none" />
                                <span class="text-sm font-semibold text-slate-400">pairs</span>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>

                 <!-- PDF Mode Card -->
                 <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                       <i class="fa-solid fa-file-pdf text-red-500"></i> PDF Mode
                    </h3>
                    <div class="grid grid-cols-2 gap-4">
                       <label class="cursor-pointer relative">
                          <input type="radio" v-model="pdfMode" value="separate" class="peer sr-only">
                          <div class="p-4 rounded-xl border-2 border-slate-200 hover:border-blue-400 peer-checked:border-blue-600 peer-checked:bg-blue-50 transition-all text-center">
                             <span class="block font-bold text-slate-700 peer-checked:text-blue-700 mb-1">Separate Files</span>
                             <span class="text-xs text-slate-500">One PDF per brand</span>
                          </div>
                       </label>
                       <label class="cursor-pointer relative">
                          <input type="radio" v-model="pdfMode" value="combined" class="peer sr-only">
                          <div class="p-4 rounded-xl border-2 border-slate-200 hover:border-blue-400 peer-checked:border-blue-600 peer-checked:bg-blue-50 transition-all text-center">
                             <span class="block font-bold text-slate-700 peer-checked:text-blue-700 mb-1">Combined Catalog</span>
                             <span class="text-xs text-slate-500">All brands in one PDF</span>
                          </div>
                       </label>
                    </div>
                 </div>

                 <!-- Action Area -->
                 <div class="grid grid-cols-1 gap-3 pt-4">
                    <button 
                      @click="generatePdf" 
                      :disabled="selectedBrands.length === 0 || isGenerating"
                      class="w-full py-4 bg-slate-900 hover:bg-black disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-lg"
                    >
                       <span v-if="isGenerating && isPdfGenerating" class="flex items-center gap-2">
                          <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          {{ pdfMode === 'combined' ? 'Merging PDF...' : `Generating PDF (${completedCount}/${selectedBrands.length})` }}
                       </span>
                       <span v-else>Download PDF Catalog</span>
                    </button>

                    <div class="grid grid-cols-2 gap-3">
                       <button 
                         @click="downloadAsImages"
                         :disabled="selectedBrands.length === 0 || isGenerating"
                         class="py-3 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                       >
                         <span v-if="isGenerating && !isPdfGenerating && !isZipGenerating" class="flex items-center gap-2">
                            <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Creating Images ({{ completedCount }}/{{selectedBrands.length}})
                         </span>
                         <span v-else>Download Images</span>
                       </button>

                       <button 
                         @click="downloadAsZip"
                         :disabled="selectedBrands.length === 0 || isGenerating"
                         class="py-3 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                       >
                         <span v-if="isGenerating && isZipGenerating" class="flex items-center gap-2">
                            <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Zipping ({{ completedCount }}/{{selectedBrands.length}})
                         </span>
                         <span v-else>Download Images (ZIP)</span>
                       </button>
                    </div>

                    <!-- Native App Share Button (WhatsApp/etc) -->
                    <button 
                      v-if="isNativeApp"
                      @click="shareViaNativeApp" 
                      :disabled="selectedBrands.length === 0 || isGenerating"
                      class="w-full mt-3 py-4 bg-[#25D366] hover:bg-[#128C7E] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-lg"
                    >
                       <span v-if="isGenerating && isSharing" class="flex items-center gap-2">
                          <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          Preparing Share ({{ completedCount }}/{{selectedBrands.length}})
                       </span>
                       <span v-else class="flex items-center gap-2">
                         <i class="fa-brands fa-whatsapp text-2xl"></i>
                         Share on WhatsApp
                       </span>
                    </button>

                    <!-- Progress Bar -->
                    <div v-if="isGenerating" class="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2">
                        <div class="flex justify-between text-xs font-bold text-blue-800 uppercase tracking-widest">
                           <span>Processing: {{ currentBrand }}</span>
                           <span>{{ Math.round((completedCount / selectedBrands.length) * 100) }}%</span>
                        </div>
                        <div class="h-2 w-full bg-blue-100 rounded-full overflow-hidden">
                           <div class="h-full bg-blue-500 rounded-full transition-all duration-300" :style="{ width: `${(completedCount / selectedBrands.length) * 100}%` }"></div>
                        </div>
                        <div class="text-[10px] text-blue-600/70 text-center font-medium">Please wait, larger brands may take a minute...</div>
                    </div>
                 </div>

              </div>
          </div>

          <!-- Summary Sidebar (Right) -->
          <div class="w-80 border-l border-slate-200 bg-white p-6 overflow-y-auto hidden xl:block">
              <div class="mb-6">
                 <h2 class="text-lg font-black text-slate-800 uppercase tracking-widest mb-1">Summary</h2>
                 <p class="text-sm text-slate-500 font-medium">{{ selectedBrands.length }} brands selected</p>
              </div>

              <div v-if="selectedBrands.length === 0" class="text-center py-10 opacity-50">
                 <div class="text-4xl mb-2">📋</div>
                 <p class="text-sm font-medium">No brands selected</p>
              </div>

              <div v-else class="space-y-2">
                 <div 
                   v-for="brand in selectedBrands" 
                   :key="brand"
                   class="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 group"
                 >
                    <span class="text-xs font-bold text-slate-700 truncate pr-2">{{ formatProductName(brand) }}</span>
                    <button @click="toggleBrand(brand)" class="text-slate-400 hover:text-red-500 transition-colors">
                       <i class="fa-solid fa-xmark"></i>
                    </button>
                 </div>
              </div>
          </div>
       </div>
    </main>

    <!-- Mobile Bottom Navigation -->
    <div class="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 flex justify-around items-center h-16 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe">
        <button 
           @click="mobileTab = 'brands'"
           class="flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors outline-none bg-transparent rounded-none hover:bg-transparent shadow-none"
           :class="mobileTab === 'brands' ? 'text-blue-600' : 'text-slate-400'"
        >
           <span class="text-[10px] font-bold uppercase tracking-wide">Brands</span>
        </button>
        
        <div class="h-8 w-[1px] bg-slate-100"></div>

        <button 
           @click="mobileTab = 'export'"
           class="flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors outline-none bg-transparent rounded-none hover:bg-transparent shadow-none"
           :class="mobileTab === 'export' ? 'text-blue-600' : 'text-slate-400'"
        >
           <div class="relative">
             <span v-if="selectedBrands.length > 0" class="absolute -top-1.5 -right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">{{ selectedBrands.length }}</span>
           </div>
           <span class="text-[10px] font-bold uppercase tracking-wide">Export</span>
        </button>
    </div>
    
    
    <!-- Toast -->
    <div v-if="showToast" class="fixed bottom-6 right-6 z-[60] animate-bounce-in">
       <div class="bg-slate-800 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3">
          <i class="fa-solid fa-circle-check text-green-400"></i>
          <span class="font-medium">{{ toastMessage }}</span>
       </div>
    </div>

    <!-- Batch Share Modal -->
    <div v-if="showBatchModal" class="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
        <div class="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-6">
            <div class="text-center space-y-2">
                <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fa-brands fa-whatsapp text-3xl text-green-600"></i>
                </div>
                <h3 class="text-xl font-black text-slate-800">Share Batch {{ currentBatchIndex + 1 }} / {{ batchList.length }}</h3>
                <p class="text-slate-500 font-medium">Sending {{ batchList[currentBatchIndex].length }} images in this batch.</p>
            </div>

            <!-- Progress Bar -->
            <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-green-500 rounded-full transition-all duration-300" :style="{ width: `${((currentBatchIndex) / batchList.length) * 100}%` }"></div>
            </div>

            <button 
                @click="executeBatchShare" 
                class="w-full py-4 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-xl shadow-xl active:scale-[0.95] transition-all flex items-center justify-center gap-3 text-lg"
            >
                <span>Share Batch {{ currentBatchIndex + 1 }}</span>
                <i class="fa-solid fa-arrow-right"></i>
            </button>
            
            <button @click="showBatchModal = false; isSharing = false;" class="w-full py-3 text-slate-400 font-bold hover:text-slate-600">
                Cancel
            </button>
        </div>
    </div>

  </div>
</template>

<script>
import axios from "axios";
import JSZip from "jszip";
import { saveAs } from "file-saver";

import { jsPDF } from "jspdf";
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export default {
  data() {
    return {
      brands: [],
      selectedBrands: [],
      onlyWithPhotos: true,
      minQtyEnabled: false,
      minQty: 5,
      minQty: 5,
      pdfMode: "separate",
      isGenerating: false,
      isPdfGenerating: false,
      isPdfGenerating: false,
      isZipGenerating: false,
      isSharing: false,
      
      // Batch Sharing State
      showBatchModal: false,
      batchList: [], // Array of Array of Strings (URIs)
      currentBatchIndex: 0,

      mobileTab: 'brands', // 'brands' | 'export'
      currentBrand: "",
      completedCount: 0,
      showToast: false,
      toastMessage: "",

      // Brand Lists Configuration
      bansalList: [
        'SRG Enterprises', 'NAV DURGA ENTERPRISES', 'AAGAM POLYMERE', 
        'R K TRADERS', 'A G ENTERPRISES', 'NEXUS', 'YASH FOOTWEAR',
        'AAGAM POLYMER', 'Vardhman Plastics'
      ],
      airsonList: ['AIRSON', 'AMBIKA FOOTWEAR', 'GOKUL FOOTWEAR', 'NEXGEN FOOTWEAR'],
      kohinoorList: ['KOHINOOR', 'UAM FOOTWEAR'],
      nareshList: ['KRishna Agency', 'SHYAM'],
      socksList: ['BArun', 'PAreek Soucks', 'LEo'],
      paragonList: [
        'Paragon Gents', 'Paragon Ladies', 'Eeken', 'Meriva', 'Paragon',  
        'Paragon Blot', 'Max', 'Paralite', 'P-TOES', 'Hawai Chappal', 
        'Stimulus', 'Escoute', 'Safety', 'Walkaholic', 'School'
      ],
      topBrandsConfig: [
        { name: 'Cubix', logo: 'https://res.cloudinary.com/dg365ewal/image/upload/v1749667073/cubixLogo_bwawj3.jpg' },
        { name: 'CUBIX 2', logo: 'https://res.cloudinary.com/dg365ewal/image/upload/v1749667073/cubixLogo_bwawj3.jpg' },
        { name: 'Florex (Swastik)', logo: 'https://res.cloudinary.com/dg365ewal/image/upload/v1749667072/florexLogo_wn50tj.jpg' },
        { name: 'RELIANCE FOOTWEAR', logo: 'https://res.cloudinary.com/dg365ewal/image/upload/v1749667072/relianceLogo_bvgwwz.png' },
        { name: 'Action', logo: 'https://res.cloudinary.com/dg365ewal/image/upload/v1768150265/action-logo_dzd5mq.png' }
      ],
      midBrandsConfig: [
         'AIRFAX', 'TEUZ', 'Paris', 'Hitway', 'PANKAJ PLASTIC', 'VAISHNO PLASTIC', 'TARA', 'ADDA', 'ASHU', 'ADDOXY'
      ],
      generalList: ['Maruti Plastics', 'Magnet', 'J.K Plastic', 
        'R R POLYPLAST', 'AGRA'
      ],
    };
  },

  computed: {
    groupedSidebar() {
       const normalize = (name) => name ? name.toLowerCase().trim() : '';

       // Helper sets
       const paragonSet = new Set(this.paragonList.map(n => normalize(n)));
       const topBrandNames = this.topBrandsConfig.map(c => normalize(c.name));
       const topBrandSet = new Set(topBrandNames);
       const midBrandSet = new Set(this.midBrandsConfig.map(n => normalize(n)));
       const socksSet = new Set(this.socksList.map(n => normalize(n)));
       const generalSet = new Set(this.generalList.map(n => normalize(n)));

       // Club sets
       const bansalSet = new Set(this.bansalList.map(n => normalize(n)));
       const airsonSet = new Set(this.airsonList.map(n => normalize(n)));
       const kohinoorSet = new Set(this.kohinoorList.map(n => normalize(n)));
       const nareshSet = new Set(this.nareshList.map(n => normalize(n)));

       const paragon = [];
       const topBrands = [];
       const midBrands = [];
       const socksGroups = [];
       const general = [];
       const bansalGroups = [];
       const airsonGroups = [];
       const kohinoorGroups = [];
       const nareshGroups = [];
       const others = [];
       
       const brands = this.brands.map(b => ({ groupName: b }));

       brands.forEach(group => {
           const nName = normalize(group.groupName);
           
           if (paragonSet.has(nName)) {
               paragon.push(group);
           } else if (topBrandSet.has(nName)) {
               const config = this.topBrandsConfig.find(c => normalize(c.name) === nName);
               topBrands.push({ group, logo: config ? config.logo : null }); 
           } else if (midBrandSet.has(nName)) {
               midBrands.push(group);
           } else if (socksSet.has(nName)) {
               socksGroups.push(group);
           } else if (generalSet.has(nName)) {
               general.push(group);
           } else if (bansalSet.has(nName)) {
               bansalGroups.push(group);
           } else if (airsonSet.has(nName)) {
               airsonGroups.push(group);
           } else if (kohinoorSet.has(nName)) {
               kohinoorGroups.push(group);
           } else if (nareshSet.has(nName)) {
               nareshGroups.push(group);
           } else {
               others.push(group);
           }
       });

       return { paragon, topBrands, midBrands, socksGroups, general, bansalGroups, airsonGroups, kohinoorGroups, nareshGroups, others };
    },
    isNativeApp() {
        return Capacitor.isNativePlatform();
    }
  },

  async mounted() {
    this.loadBrands();
    this.loadBrands();
  },

  methods: {
    formatProductName(name) {
      if (!name) return '';
      return name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    },
    getBrandLogo(brandName) {
        const logos = {
            "Paragon": "https://res.cloudinary.com/dg365ewal/image/upload/v1749667072/paragonLogo_rqk3hu.webp",
            "Reliance": "https://res.cloudinary.com/dg365ewal/image/upload/v1749667072/relianceLogo_bvgwwz.png",
            "Cubix": "https://res.cloudinary.com/dg365ewal/image/upload/v1749667073/cubixLogo_bwawj3.jpg",
            "Florex": "https://res.cloudinary.com/dg365ewal/image/upload/v1749667072/florexLogo_wn50tj.jpg",
            "Eeken": "https://res.cloudinary.com/dg365ewal/image/upload/v1749668232/eekenLogo_rg5xwa.webp",
            "Escoute": "https://res.cloudinary.com/dg365ewal/image/upload/v1749667072/escouteLogo_maieji.jpg"
        };
        // Fuzzy match logic
        const lowerName = brandName.toLowerCase();
        const key = Object.keys(logos).find(k => lowerName.includes(k.toLowerCase()));
        return key ? logos[key] : null;
    },
    toggleBrand(brandName) {
        if (this.selectedBrands.includes(brandName)) {
            this.selectedBrands = this.selectedBrands.filter(b => b !== brandName);
        } else {
            this.selectedBrands.push(brandName);
        }
    },
    isCategorySelected(category) {
        const group = this.groupedSidebar[category];
        if (!group || group.length === 0) return false;
        
        // For topBrands, item has { group: { groupName: ... } }, for others item is { groupName: ... }
        // Actually looking at update, topBrands now has structure: { group: { groupName: ... }, logo: ... }
        // BUT wait, my computed property for topBrands pushes: { group, logo: ... }
        // So item.group.groupName is correct.
        // For others, we pushed `group` which is { groupName: ... }.
        // So we need to handle that distinction.
        
        return group.every(item => {
             const name = category === 'topBrands' ? item.group.groupName : item.groupName;
             return this.selectedBrands.includes(name);
        });
    },
    toggleCategory(category, event) {
        const isChecked = event.target.checked;
        const group = this.groupedSidebar[category];
        
        if (!group) return;

        group.forEach(item => {
            const name = category === 'topBrands' ? item.group.groupName : item.groupName;
            if (isChecked) {
                if (!this.selectedBrands.includes(name)) this.selectedBrands.push(name);
            } else {
                this.selectedBrands = this.selectedBrands.filter(b => b !== name);
            }
        });
    },
    scrollToGenerate() {
      this.$nextTick(() => {
        this.$refs.generateSection?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    },

    async loadBrands() {
      try {
        const res = await axios.get("https://raw.githubusercontent.com/sahilsync07/sbe/main/frontend/public/assets/stock-data.json");
        this.brands = [...new Set(res.data.map(g => g.groupName))].sort();
      } catch (err) {
        this.showToast = true;
        this.toastMessage = "Failed to load brands — check internet";
        setTimeout(() => this.showToast = false, 3000);
      }
    },

    // --- PDF GENERATION LOGIC (Frontend Only) ---
    async generatePdfBlob(targetBrands) {
        // 1. Fetch Data
        const jsonUrl = "https://raw.githubusercontent.com/sahilsync07/sbe/main/frontend/public/assets/stock-data.json";
        const response = await axios.get(jsonUrl);
        const data = response.data;
        const filteredGroups = data.filter((group) => targetBrands.includes(group.groupName));
        
        // 2. Setup PDF
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "pt", // using points to match pdfkit somewhat closer (72 dpi vs pdfkit default)
            format: "a4"
        });
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        let hasAddedPage = false;

        for (const group of filteredGroups) {
            let isFirstProductInBrand = true;

            for (const product of group.products) {
                if (this.onlyWithPhotos && !product.imageUrl) continue;
                if (this.minQtyEnabled && product.quantity <= this.minQty) continue;

                if (hasAddedPage) {
                    doc.addPage();
                }
                hasAddedPage = true;

                // A. Background (Light beige)
                doc.setFillColor("#faf8f6");
                doc.rect(0, 0, pageWidth, pageHeight, "F");

                // B. Waves
                doc.setDrawColor("#e0e0e0");
                doc.setLineWidth(3);

                // Top Wave
                doc.path([
                    { op: 'm', c: [0, 0] },
                    { op: 'l', c: [200, 80] },
                    { op: 'c', c: [266, 26, 400, 33, 600, 100] }
                ]);
                doc.stroke();

                // Bottom Wave
                const h = pageHeight;
                doc.path([
                    { op: 'm', c: [0, h] },
                    { op: 'l', c: [250, h - 100] },
                    { op: 'c', c: [316, h - 33, 433, h - 16, 600, h - 50] }
                ]);
                doc.stroke();

                // C. Brand Name (First product only)
                if (isFirstProductInBrand) {
                    doc.setTextColor(0, 0, 0); // Black
                    // doc.setFillOpacity(0.2); // jsPDF doesn't handle fillOpacity easily for text, using light grey instead
                    doc.setTextColor(200, 200, 200); // Light Grey to simulate opacity
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(28);
                    doc.text(group.groupName, pageWidth / 2, 35, { align: "center" });
                    isFirstProductInBrand = false;
                }

                // D. Product Image
                if (product.imageUrl) {
                    try {
                        // Fetch image as blobs
                        const imgData = await this.fetchImageAsBase64(product.imageUrl);
                        
                        // Dimensions
                        const maxWidth = pageWidth - 40;
                        const maxHeight = pageHeight - 150; 
                        
                        // We need image dimensions. 
                        // With Base64, we can load it into a temporary Image object to get dims
                        const dims = await this.getImageDimensions(imgData);
                        
                        const scale = Math.min(maxWidth / dims.width, maxHeight / dims.height, 1);
                        const finalWidth = dims.width * scale;
                        const finalHeight = dims.height * scale;
                        
                        const x = (pageWidth - finalWidth) / 2;
                        const y = 60; 
                        
                        doc.addImage(imgData, "JPEG", x, y, finalWidth, finalHeight);

                        const textY = y + finalHeight + 25;

                        // E. Text
                        doc.setTextColor(0, 0, 0);
                        doc.setFont("helvetica", "bold");
                        doc.setFontSize(16);
                        doc.text(product.productName, pageWidth / 2, textY, { align: "center" });

                        doc.setTextColor(212, 0, 0); // #d40000
                        doc.setFontSize(18);
                        doc.text(`Qty: ${product.quantity}`, pageWidth / 2, textY + 30, { align: "center" });

                    } catch (imgErr) {
                        console.error(`Image failed: ${product.productName}`, imgErr);
                        doc.setTextColor(0);
                        doc.setFontSize(16);
                        doc.text("Image Load Failed", pageWidth / 2, pageHeight / 2, { align: "center" });
                    }
                } else {
                    doc.setTextColor(0);
                    doc.setFontSize(20);
                    doc.text(product.productName, pageWidth / 2, pageHeight / 2 - 20, { align: "center" });
                    doc.text(`Qty: ${product.quantity}`, pageWidth / 2, pageHeight / 2 + 20, { align: "center" });
                }
            }
        }
        
        return doc.output("blob");
    },
    
    async fetchImageAsBase64(url) {
        const res = await axios.get(url, { responseType: "arraybuffer" });
        const base64 = btoa(
            new Uint8Array(res.data).reduce((data, byte) => data + String.fromCharCode(byte), "")
        );
        return `data:${res.headers["content-type"]};base64,${base64}`;
    },

    async getImageDimensions(base64) {
        return new Promise((resolve) => {
            const i = new Image();
            i.onload = () => resolve({ width: i.width, height: i.height });
            i.src = base64;
        });
    },

    async generatePdf() {
      if (!this.selectedBrands.length) {
        this.showToast = true;
        this.toastMessage = "Select at least one brand first";
        setTimeout(() => this.showToast = false, 3000);
        return;
      }

      this.isGenerating = true;
      this.isPdfGenerating = true;
      this.completedCount = 0;

      if (this.pdfMode === "combined") {
        // COMBINED PDF
        this.currentBrand = "Merging All Brands...";
        
        try {
          const blob = await this.generatePdfBlob(this.selectedBrands);

          const today = new Date().toISOString().split("T")[0];
          const filename = `CATALOG_COMBINED_${today}.pdf`;

          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = filename; a.click();
          window.URL.revokeObjectURL(url);

          this.completedCount = this.selectedBrands.length;
          this.showToast = true;
          this.toastMessage = "Combined PDF downloaded!";
          setTimeout(() => this.showToast = false, 4000);
        } catch (err) {
          console.error(err);
          this.showToast = true;
          this.toastMessage = "Failed to generate combined PDF";
          setTimeout(() => this.showToast = false, 5000);
        } finally {
          this.isGenerating = false;
          this.isPdfGenerating = false;
          this.currentBrand = "";
        }
      } else {
        // SEPARATE PDFs
        let successCount = 0;
        let failCount = 0;

        for (const brand of this.selectedBrands) {
          this.currentBrand = `Generating ${brand}...`;
          
          try {
             const blob = await this.generatePdfBlob([brand]);
             
             const today = new Date().toISOString().split("T")[0];
             const safe = brand.replace(/[^a-zA-Z0-9]/g, "_");
             const filename = `${safe}_${today}.pdf`;

             const url = window.URL.createObjectURL(blob);
             const a = document.createElement("a");
             a.href = url; a.download = filename; a.click();
             window.URL.revokeObjectURL(url);
             
             successCount++;
          } catch(e) {
             console.error(`Failed ${brand}`, e);
             failCount++;
          }
          this.completedCount++;
          await new Promise(r => setTimeout(r, 500)); // Sleep briefly to not freeze UI
        }

        this.showToast = true;
        this.toastMessage = `Done! ${successCount} Success, ${failCount} Failed`;
        setTimeout(() => this.showToast = false, 4000);
        
        this.isGenerating = false;
        this.isPdfGenerating = false;
        this.currentBrand = "";
      }
    },

    async downloadAsImages() {
      if (!this.selectedBrands.length) return;

      this.isGenerating = true;
      this.isPdfGenerating = false; 
      this.isZipGenerating = false; // Just to be safe
      this.completedCount = 0;
      let totalSuccess = 0;
      let totalFailed = 0;
      let totalImages = 0;

      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      for (const brand of this.selectedBrands) {
        this.currentBrand = `Processing: ${brand}`;
        try {
          const pdfBlob = await this.generatePdfBlob([brand]);
          const pdfUrl = URL.createObjectURL(pdfBlob);

          const loadingTask = pdfjsLib.getDocument(pdfUrl);
          const pdf = await loadingTask.promise;

          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2.5 });

            const canvas = document.createElement("canvas");
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const context = canvas.getContext("2d");

            await page.render({ canvasContext: context, viewport }).promise;

            const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png", 0.95));
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `${brand.replace(/[^a-zA-Z0-9]/g, "_")}_Image_${String(pageNum).padStart(3, "0")}.png`;
            a.click();
            URL.revokeObjectURL(url);

            totalImages++;
          }

          URL.revokeObjectURL(pdfUrl);
          totalSuccess++;
        } catch (err) {
          console.error("Failed for brand:", brand, err);
          totalFailed++;
        }
        this.completedCount++;
      }

      this.isGenerating = false;
      this.currentBrand = "";
      this.showToast = true;
      this.toastMessage = `Downloaded ${totalImages} images (${totalFailed} failed brands)`;
      setTimeout(() => this.showToast = false, 4000);
    },

    async downloadAsZip() {
      if (!this.selectedBrands.length) return;

      this.isGenerating = true;
      this.isZipGenerating = true;
      this.completedCount = 0;
      const zip = new JSZip();
      
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      let totalPages = 0;
      let failedBrands = 0;

      for (const brand of this.selectedBrands) {
          this.currentBrand = `Zipping: ${brand}`;

           try {
              const blob = await this.generatePdfBlob([brand]);
              
              const pdfUrl = URL.createObjectURL(blob);
              const loadingTask = pdfjsLib.getDocument(pdfUrl);
              const pdf = await loadingTask.promise;
              
              const brandFolder = zip.folder(brand);

              for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                    const page = await pdf.getPage(pageNum);
                    const viewport = page.getViewport({ scale: 2.0 }); 

                    const canvas = document.createElement("canvas");
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    const context = canvas.getContext("2d");
                    await page.render({ canvasContext: context, viewport }).promise;

                    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.85));
                    brandFolder.file(`${brand}_Page_${pageNum}.jpg`, blob);
                    totalPages++;
              }
              URL.revokeObjectURL(pdfUrl);

          } catch (e) {
              console.error(`Failed to zip ${brand}`, e);
              failedBrands++;
              this.showToast = true;
              this.toastMessage = `Failed to process ${brand}`;
              setTimeout(() => this.showToast = false, 2000);
          }
          this.completedCount++;
      }

      this.currentBrand = "Finalizing ZIP file...";
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `Catalog_Images_${new Date().toISOString().split('T')[0]}.zip`);

      this.isGenerating = false;
      this.isZipGenerating = false;
      this.currentBrand = "";
      this.showToast = true;
      this.toastMessage = `ZIP Ready! ${totalPages} images included.`;
      setTimeout(() => this.showToast = false, 4000);
    },

    async shareViaNativeApp() {
        if (!this.selectedBrands.length) return;

        this.isGenerating = true;
        this.isSharing = true;
        this.completedCount = 0;
        
        try {
            const pdfjsLib = await import("pdfjs-dist");
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
            
            const fileUris = [];

            // 1. Generate All Images & Save to Temp
            for (const brand of this.selectedBrands) {
                this.currentBrand = `Preparing: ${brand}`;
                try {
                    const blob = await this.generatePdfBlob([brand]);
                    const pdfUrl = URL.createObjectURL(blob);
                    const loadingTask = pdfjsLib.getDocument(pdfUrl);
                    const pdf = await loadingTask.promise;
                    
                    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                            const page = await pdf.getPage(pageNum);
                            // Scale 1.5 is good balance for WhatsApp (lighter than print)
                            const viewport = page.getViewport({ scale: 1.5 });

                            const canvas = document.createElement("canvas");
                            canvas.width = viewport.width;
                            canvas.height = viewport.height;
                            const context = canvas.getContext("2d");
                            await page.render({ canvasContext: context, viewport }).promise;

                            // Convert to Base64 (needed for Filesystem.writeFile)
                            const base64 = canvas.toDataURL("image/jpeg", 0.8).split(',')[1];
                            const fileName = `${brand.replace(/[^a-zA-Z0-9]/g, "")}_${pageNum}.jpg`;
                            
                            // Save to Cache Directory
                            const savedFile = await Filesystem.writeFile({
                                path: fileName,
                                data: base64,
                                directory: Directory.Cache
                            });
                            
                            fileUris.push(savedFile.uri);
                    }
                    URL.revokeObjectURL(pdfUrl);
                } catch (e) {
                    console.error("Native Gen Error", e);
                }
                this.completedCount++;
            }


            // 2. Chunking Logic (Max 99 per batch to stay under WhatsApp 100 limit)
            const chunkSize = 99; 
            const batches = [];
            for (let i = 0; i < fileUris.length; i += chunkSize) {
                batches.push(fileUris.slice(i, i + chunkSize));
            }

            if (batches.length === 0) {
                 this.showToast = true;
                 this.toastMessage = "No images generated";
                 setTimeout(() => this.showToast = false, 3000);
                 this.isSharing = false;
                 this.isGenerating = false;
                 return;
            }

            // 3. Decide: Direct Share or Batch Mode
            if (batches.length === 1) {
                 await Share.share({ files: batches[0] });
                 this.isSharing = false;
                 this.isGenerating = false; 
            } else {
                 this.batchList = batches;
                 this.currentBatchIndex = 0;
                 this.showBatchModal = true;
                 // Don't turn off isGenerating yet, modal handles it
            }

        } catch (err) {
            console.error("Native Share Failed", err);
            this.showToast = true;
            this.toastMessage = "Sharing cancelled or failed.";
            setTimeout(() => this.showToast = false, 3000);
            this.isGenerating = false;
            this.isSharing = false;
        } finally {
            this.currentBrand = "";
        }
    },

    async executeBatchShare() {
        try {
            const currentFiles = this.batchList[this.currentBatchIndex];
            await Share.share({ files: currentFiles });
            
            // Move to next batch
            this.currentBatchIndex++;
            
            // Check if done
            if (this.currentBatchIndex >= this.batchList.length) {
                this.showBatchModal = false;
                this.isGenerating = false;
                this.isSharing = false;
                this.showToast = true;
                this.toastMessage = "All batches shared successfully!";
                setTimeout(() => this.showToast = false, 4000);
            }
        } catch(e) {
            console.error(e);
            // Don't advance index if failed, let them retry
        }
    },
  },


};
</script>

<style scoped>
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 20px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background-color: #94a3b8;
}

@keyframes bounceIn {
  0% { opacity: 0; transform: scale(0.3) translateY(20px); }
  50% { opacity: 0.9; transform: scale(1.05); }
  80% { opacity: 1; transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
.animate-bounce-in {
  animation: bounceIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
</style>