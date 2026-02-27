<template>
  <div class="flex flex-col lg:flex-row h-screen w-full bg-slate-50 font-sans text-slate-800 overflow-hidden">
    <!-- Sidebar -->
    <aside 
      class="border-r border-slate-200 bg-white flex-shrink-0 flex-col h-full z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 w-full lg:w-[480px]"
      :class="[mobileTab === 'brands' ? 'flex' : 'hidden lg:flex']"
    >
      <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10">
         <div class="flex items-center gap-2">
            <!-- Sidebar Home Button -->
            <button @click="$router.push('/')" class="w-8 h-8 flex lg:hidden items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm active:scale-95 border border-white/20 mr-1" title="Home">
               <i class="fa-solid fa-house text-xs"></i>
            </button>
            
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

         <!-- General Loose Packing (Teal) -->
         <div v-if="groupedSidebar.generalLoosePackingGroups.length > 0" class="p-2 transition-all rounded-2xl bg-teal-50/30 hover:bg-teal-50/60 border border-transparent hover:border-teal-100">
            <div class="flex items-center justify-between px-2 mb-3">
               <span class="text-xs font-black text-teal-600 uppercase tracking-widest pl-1">General Loose Packing</span>
               <input type="checkbox" :checked="isCategorySelected('generalLoosePackingGroups')" @change="toggleCategory('generalLoosePackingGroups', $event)" class="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer" />
            </div>
            <div class="grid grid-cols-2 gap-2">
               <div 
                 v-for="item in groupedSidebar.generalLoosePackingGroups" 
                 :key="item.groupName"
                 class="flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer bg-white border border-transparent hover:border-teal-200 shadow-sm hover:shadow-md select-none"
                 :class="{ '!bg-teal-50 !border-teal-200 ring-1 ring-teal-200': selectedBrands.includes(item.groupName) }"
                 @click="toggleBrand(item.groupName)"
               >
                  <input type="checkbox" :checked="selectedBrands.includes(item.groupName)" class="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-gray-300 pointer-events-none" />
                  <span class="text-sm font-semibold text-slate-700 leading-tight" :class="{ 'text-teal-800': selectedBrands.includes(item.groupName) }">{{ formatProductName(item.groupName) }}</span>
               </div>
            </div>
         </div>

         <!-- General Box Packing (Indigo) -->
         <div v-if="groupedSidebar.generalBoxPackingGroups.length > 0" class="p-2 transition-all rounded-2xl bg-indigo-50/30 hover:bg-indigo-50/60 border border-transparent hover:border-indigo-100">
            <div class="flex items-center justify-between px-2 mb-3">
               <span class="text-xs font-black text-indigo-600 uppercase tracking-widest pl-1">General Box Packing</span>
               <input type="checkbox" :checked="isCategorySelected('generalBoxPackingGroups')" @change="toggleCategory('generalBoxPackingGroups', $event)" class="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer" />
            </div>
            <div class="grid grid-cols-2 gap-2">
               <div 
                 v-for="item in groupedSidebar.generalBoxPackingGroups" 
                 :key="item.groupName"
                 class="flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer bg-white border border-transparent hover:border-indigo-200 shadow-sm hover:shadow-md select-none"
                 :class="{ '!bg-indigo-50 !border-indigo-200 ring-1 ring-indigo-200': selectedBrands.includes(item.groupName) }"
                 @click="toggleBrand(item.groupName)"
               >
                  <input type="checkbox" :checked="selectedBrands.includes(item.groupName)" class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 pointer-events-none" />
                  <span class="text-sm font-semibold text-slate-700 leading-tight" :class="{ 'text-indigo-800': selectedBrands.includes(item.groupName) }">{{ formatProductName(item.groupName) }}</span>
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

                 <!-- ZIP Mode Card -->
                 <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                       <i class="fa-solid fa-file-zipper text-yellow-500"></i> ZIP Mode
                    </h3>
                    <div class="grid grid-cols-2 gap-4">
                       <label class="cursor-pointer relative">
                          <input type="radio" v-model="zipMode" value="separate" class="peer sr-only">
                          <div class="p-4 rounded-xl border-2 border-slate-200 hover:border-emerald-400 peer-checked:border-emerald-600 peer-checked:bg-emerald-50 transition-all text-center">
                             <span class="block font-bold text-slate-700 peer-checked:text-emerald-700 mb-1">Separate Folders</span>
                             <span class="text-xs text-slate-500">One folder per brand</span>
                          </div>
                       </label>
                       <label class="cursor-pointer relative">
                          <input type="radio" v-model="zipMode" value="combined" class="peer sr-only">
                          <div class="p-4 rounded-xl border-2 border-slate-200 hover:border-emerald-400 peer-checked:border-emerald-600 peer-checked:bg-emerald-50 transition-all text-center">
                             <span class="block font-bold text-slate-700 peer-checked:text-emerald-700 mb-1">Combined (Flat)</span>
                             <span class="text-xs text-slate-500">All images in root</span>
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

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import axios from "axios";
import JSZip from "jszip";
import { saveAs } from "file-saver";

import { jsPDF } from "jspdf";
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { useBrandGroups } from '../composables/useBrandGroups';
import { useStockData } from '../composables/useStockData';

// State
const { stockData, loadStockData, loading } = useStockData(ref(false)); // Reuse existing composable
const selectedBrands = ref([]);
const onlyWithPhotos = ref(true);
const minQtyEnabled = ref(false);
const minQty = ref(5);
const pdfMode = ref("separate");
const zipMode = ref("separate");
const isGenerating = ref(false);
const isPdfGenerating = ref(false);
const isZipGenerating = ref(false);
const isSharing = ref(false);

// Batch Sharing State
const showBatchModal = ref(false);
const batchList = ref([]);
const currentBatchIndex = ref(0);

const mobileTab = ref('brands');
const currentBrand = ref("");
const completedCount = ref(0);
const showToast = ref(false);
const toastMessage = ref("");

// Computed: Brands list from stockData (for display/count if needed)
const brands = computed(() => stockData.value.map(g => g.groupName).sort());

// Use brand groups composable
const { groupedSidebar } = useBrandGroups(stockData, ref({}), ref(''));

// Native app check
const isNativeApp = computed(() => Capacitor.isNativePlatform());

onMounted(async () => {
  await loadStockData();
  
  // Hardware Back Button Listener
  App.addListener('backButton', ({ canGoBack }) => {
    if (window.location.pathname === '/pdf-gen') {
      window.history.back();
    }
  });
});

onBeforeUnmount(() => {
  App.removeAllListeners();
});

// Methods
const formatProductName = (name) => {
  if (!name) return '';
  return name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const getBrandLogo = (brandName) => {
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
};

const toggleBrand = (brandName) => {
    if (selectedBrands.value.includes(brandName)) {
        selectedBrands.value = selectedBrands.value.filter(b => b !== brandName);
    } else {
        selectedBrands.value.push(brandName);
    }
};

const isCategorySelected = (category) => {
    const group = groupedSidebar.value[category];
    if (!group || group.length === 0) return false;
    
    return group.every(item => {
         // Only topBrands uses { group: { groupName }, logo } structure
         const name = category === 'topBrands' ? item.group.groupName : item.groupName;
         return selectedBrands.value.includes(name);
    });
};

const toggleCategory = (category, event) => {
    const isChecked = event.target.checked;
    const group = groupedSidebar.value[category];
    
    if (!group) return;

    group.forEach(item => {
        // Only topBrands uses { group: { groupName }, logo } structure
        const name = category === 'topBrands' ? item.group.groupName : item.groupName;
        if (isChecked) {
            if (!selectedBrands.value.includes(name)) selectedBrands.value.push(name);
        } else {
            selectedBrands.value = selectedBrands.value.filter(b => b !== name);
        }
    });
};

const scrollToGenerate = () => {
  nextTick(() => {
    generateSection.value?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
};

// --- PDF GENERATION LOGIC (Frontend Only) ---
const generatePdfBlob = async (targetBrands) => {
    // 1. Use Cached Data
    const data = stockData.value;
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
            if (onlyWithPhotos.value && !product.imageUrl) continue;
            if (minQtyEnabled.value && product.quantity <= minQty.value) continue;

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
                    const imgData = await fetchImageAsBase64(product.imageUrl);
                    
                    // Dimensions
                    const maxWidth = pageWidth - 40;
                    const maxHeight = pageHeight - 150; 
                    
                    // We need image dimensions. 
                    // With Base64, we can load it into a temporary Image object to get dims
                    const dims = await getImageDimensions(imgData);
                    
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
};

const fetchImageAsBase64 = async (url) => {
    const res = await axios.get(url, { responseType: "arraybuffer" });
    const base64 = btoa(
        new Uint8Array(res.data).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );
    return `data:${res.headers["content-type"]};base64,${base64}`;
};

const getImageDimensions = async (base64) => {
    return new Promise((resolve) => {
        const i = new Image();
        i.onload = () => resolve({ width: i.width, height: i.height });
        i.src = base64;
    });
};

const generatePdf = async () => {
  if (!selectedBrands.value.length) {
    showToast.value = true;
    toastMessage.value = "Select at least one brand first";
    setTimeout(() => showToast.value = false, 3000);
    return;
  }

  isGenerating.value = true;
  isPdfGenerating.value = true;
  completedCount.value = 0;

  if (pdfMode.value === "combined") {
    // COMBINED PDF
    currentBrand.value = "Merging All Brands...";
    
    try {
      const blob = await generatePdfBlob(selectedBrands.value);

      const today = new Date().toISOString().split("T")[0];
      const filename = `CATALOG_COMBINED_${today}.pdf`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      window.URL.revokeObjectURL(url);

      completedCount.value = selectedBrands.value.length;
      showToast.value = true;
      toastMessage.value = "Combined PDF downloaded!";
      setTimeout(() => showToast.value = false, 4000);
    } catch (err) {
      console.error(err);
      showToast.value = true;
      toastMessage.value = "Failed to generate combined PDF";
      setTimeout(() => showToast.value = false, 5000);
    } finally {
      isGenerating.value = false;
      isPdfGenerating.value = false;
      currentBrand.value = "";
    }
  } else {
    // SEPARATE PDFs
    let successCount = 0;
    let failCount = 0;

    for (const brand of selectedBrands.value) {
      currentBrand.value = `Generating ${brand}...`;
      
      try {
         const blob = await generatePdfBlob([brand]);
         
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
      completedCount.value++;
      await new Promise(r => setTimeout(r, 500)); // Sleep briefly to not freeze UI
    }

    showToast.value = true;
    toastMessage.value = `Done! ${successCount} Success, ${failCount} Failed`;
    setTimeout(() => showToast.value = false, 4000);
    
    isGenerating.value = false;
    isPdfGenerating.value = false;
    currentBrand.value = "";
  }
};

const downloadAsImages = async () => {
  if (!selectedBrands.value.length) return;

  isGenerating.value = true;
  isPdfGenerating.value = false; 
  isZipGenerating.value = false; // Just to be safe
  completedCount.value = 0;
  let totalSuccess = 0;
  let totalFailed = 0;
  let totalImages = 0;

  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  for (const brand of selectedBrands.value) {
    currentBrand.value = `Processing: ${brand}`;
    try {
      const pdfBlob = await generatePdfBlob([brand]);
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
    completedCount.value++;
  }

  isGenerating.value = false;
  currentBrand.value = "";
  showToast.value = true;
  toastMessage.value = `Downloaded ${totalImages} images (${totalFailed} failed brands)`;
  setTimeout(() => showToast.value = false, 4000);
};

const downloadAsZip = async () => {
  if (!selectedBrands.value.length) return;

  isGenerating.value = true;
  isZipGenerating.value = true;
  completedCount.value = 0;
  const zip = new JSZip();
  
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  let totalPages = 0;
  let failedBrands = 0;
  const isCombined = zipMode.value === 'combined';
  let globalPageCounter = 0;

  for (const brand of selectedBrands.value) {
      currentBrand.value = `Zipping: ${brand}`;

       try {
          const blob = await generatePdfBlob([brand]);
          
          const pdfUrl = URL.createObjectURL(blob);
          const loadingTask = pdfjsLib.getDocument(pdfUrl);
          const pdf = await loadingTask.promise;
          
          const target = isCombined ? zip : zip.folder(brand);

          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: 2.0 }); 

                const canvas = document.createElement("canvas");
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const context = canvas.getContext("2d");
                await page.render({ canvasContext: context, viewport }).promise;

                const imgBlob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.85));
                if (isCombined) {
                    globalPageCounter++;
                    target.file(`${brand}_${String(globalPageCounter).padStart(4, '0')}.jpg`, imgBlob);
                } else {
                    target.file(`${brand}_Page_${pageNum}.jpg`, imgBlob);
                }
                totalPages++;
          }
          URL.revokeObjectURL(pdfUrl);
       } catch (e) {
              console.error(`Failed to zip ${brand}`, e);
              failedBrands++;
              showToast.value = true;
              toastMessage.value = `Failed to process ${brand}`;
              setTimeout(() => showToast.value = false, 2000);
          }
          completedCount.value++;
      }

      currentBrand.value = "Finalizing ZIP file...";
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `Catalog_Images_${new Date().toISOString().split('T')[0]}.zip`);

      isGenerating.value = false;
      isZipGenerating.value = false;
      currentBrand.value = "";
      showToast.value = true;
      toastMessage.value = `ZIP Ready! ${totalPages} images included.`;
      setTimeout(() => showToast.value = false, 4000);
};

const shareViaNativeApp = async () => {
    if (!selectedBrands.value.length) return;

    isGenerating.value = true;
    isSharing.value = true;
    completedCount.value = 0;
    
    try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        
        const fileUris = [];

        // 1. Generate All Images & Save to Temp
        for (const brand of selectedBrands.value) {
            currentBrand.value = `Preparing: ${brand}`;
            try {
                const blob = await generatePdfBlob([brand]);
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
            completedCount.value++;
        }


        // 2. Chunking Logic (Max 99 per batch to stay under WhatsApp 100 limit)
        const chunkSize = 99; 
        const batches = [];
        for (let i = 0; i < fileUris.length; i += chunkSize) {
            batches.push(fileUris.slice(i, i + chunkSize));
        }

        if (batches.length === 0) {
             showToast.value = true;
             toastMessage.value = "No images generated";
             setTimeout(() => showToast.value = false, 3000);
             isSharing.value = false;
             isGenerating.value = false;
             return;
        }

        // 3. Decide: Direct Share or Batch Mode
        if (batches.length === 1) {
             await Share.share({ files: batches[0] });
             isSharing.value = false;
             isGenerating.value = false; 
        } else {
             batchList.value = batches;
             currentBatchIndex.value = 0;
             showBatchModal.value = true;
             // Don't turn off isGenerating yet, modal handles it
        }

    } catch (err) {
        console.error("Native Share Failed", err);
        showToast.value = true;
        toastMessage.value = "Sharing cancelled or failed.";
        setTimeout(() => showToast.value = false, 3000);
        isGenerating.value = false;
        isSharing.value = false;
    } finally {
        currentBrand.value = "";
    }
};

const executeBatchShare = async () => {
    try {
        const currentFiles = batchList.value[currentBatchIndex.value];
        await Share.share({ files: currentFiles });
        
        // Move to next batch
        currentBatchIndex.value++;
        
        // Check if done
        if (currentBatchIndex.value >= batchList.value.length) {
            showBatchModal.value = false;
            isGenerating.value = false;
            isSharing.value = false;
            showToast.value = true;
            toastMessage.value = "All batches shared successfully!";
            setTimeout(() => showToast.value = false, 4000);
        }
    } catch(e) {
        console.error(e);
        // Don't advance index if failed, let them retry
    }
};

// Add missing ref for template
const generateSection = ref(null);

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