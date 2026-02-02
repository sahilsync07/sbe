
<template>
  <div>
    <!-- Backdrop -->
    <div 
      v-if="showSidePanel"
      @click="$emit('update:showSidePanel', false)"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] transition-opacity duration-300"
    ></div>

    <!-- Side Panel -->
    <aside
      class="fixed inset-y-0 left-0 w-full sm:w-96 lg:w-96 border-r border-slate-200 z-[80] transform transition-transform duration-300 ease-in-out bg-white shadow-2xl"
      :class="showSidePanel ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="h-full flex flex-col">
        <!-- Header -->
        <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <h2 class="text-xl font-bold text-slate-800 font-heading">Brands</h2>
          <button 
             @click="$emit('update:showSidePanel', false)"
             class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div class="p-4 overflow-y-auto overscroll-contain flex-1 pb-24">
          <nav class="space-y-6">
          
          <!-- Paragon Legend -->
          <div v-if="groupedSidebar.paragon && groupedSidebar.paragon.length > 0" class="p-3 bg-red-50/50 border border-red-100 rounded-2xl">
              <div class="mb-3 px-1">
                <img src="https://res.cloudinary.com/dg365ewal/image/upload/v1749667072/paragonLogo_rqk3hu.webp" alt="Paragon" class="h-8 object-contain" />
              </div>
              <div class="grid grid-cols-2 gap-1">
                <div 
                  v-for="group in groupedSidebar.paragon" 
                  :key="group.groupName"
                  class="flex items-center justify-between rounded-lg px-2 py-1 transition-colors group/brand cursor-pointer"
                  :class="activeScrollGroup === group.groupName ? 'bg-red-100 text-red-700' : 'text-slate-600 hover:bg-white hover:shadow-sm'"
                  @click="handleSidebarClick(group)"
                >
                  <div class="flex items-center gap-2 flex-1 min-w-0 outline-none">
                      <span class="w-1.5 h-1.5 shrink-0 rounded-full bg-red-200 group-hover/brand:bg-red-400 transition-colors" :class="activeScrollGroup === group.groupName ? 'bg-red-600' : ''"></span>
                      <span class="font-medium text-sm leading-snug break-words">{{ formatProductName(group.groupName) }}</span>
                  </div>
                </div>
              </div>
          </div>

          <!-- Top Brands -->
          <div v-if="groupedSidebar.topBrands && groupedSidebar.topBrands.length > 0" class="p-3 bg-amber-50/50 border border-amber-100 rounded-2xl">
              <h3 class="px-1 text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">Top Brands</h3>
              <div class="grid grid-cols-2 gap-1">
                <div 
                  v-for="item in groupedSidebar.topBrands" 
                  :key="item.group.groupName"
                  class="flex items-center justify-between rounded-lg px-2 py-1 transition-colors group/brand cursor-pointer"
                  :class="activeScrollGroup === item.group.groupName ? 'bg-amber-100 text-amber-700' : 'text-slate-600 hover:bg-white hover:shadow-sm'"
                  @click="handleSidebarClick(item.group)"
                >
                  <div class="flex items-center gap-3 flex-1 min-w-0 outline-none">
                      <div class="w-6 h-6 rounded-full bg-white border border-amber-200 p-0.5 shrink-0 overflow-hidden">
                        <img v-if="item.logo" :src="item.logo" class="w-full h-full object-contain" />
                        <span v-else class="w-full h-full flex items-center justify-center text-[8px] bg-amber-50 text-amber-600">{{ item.group.groupName[0] }}</span>
                      </div>
                      <span class="font-medium text-sm leading-snug break-words">{{ formatProductName(item.group.groupName) }}</span>
                  </div>
                </div>
              </div>
          </div>

          <!-- Mid Brands -->
          <div v-if="groupedSidebar.midBrands && groupedSidebar.midBrands.length > 0" class="p-3 bg-purple-50/50 border border-purple-100 rounded-2xl">
              <h3 class="px-1 text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">Mid Brands</h3>
              <div class="grid grid-cols-2 gap-1">
                <div 
                  v-for="item in groupedSidebar.midBrands" 
                  :key="item.group.groupName"
                  class="flex items-center justify-between rounded-lg px-2 py-1 transition-colors group/brand cursor-pointer"
                  :class="activeScrollGroup === item.group.groupName ? 'bg-purple-100 text-purple-700' : 'text-slate-600 hover:bg-white hover:shadow-sm'"
                  @click="handleSidebarClick(item.group)"
                >
                  <div class="flex items-center gap-2 flex-1 min-w-0 outline-none">
                      <span class="w-1.5 h-1.5 shrink-0 rounded-full bg-purple-200 group-hover/brand:bg-purple-400 transition-colors" :class="activeScrollGroup === item.group.groupName ? 'bg-purple-600' : ''"></span>
                      <span class="font-medium text-sm leading-snug break-words">{{ formatProductName(item.group.groupName) }}</span>
                  </div>
                </div>
              </div>
          </div>

          <!-- Socks -->
          <div v-if="groupedSidebar.socksGroups && groupedSidebar.socksGroups.length > 0" class="p-3 bg-cyan-50/50 border border-cyan-100 rounded-2xl">
              <h3 class="px-1 text-xs font-bold text-cyan-600 uppercase tracking-wider mb-2">Socks</h3>
              <div class="grid grid-cols-2 gap-1">
                <div 
                  v-for="item in groupedSidebar.socksGroups" 
                  :key="item.group.groupName"
                  class="flex items-center justify-between rounded-lg px-2 py-1 transition-colors group/brand cursor-pointer"
                  :class="activeScrollGroup === item.group.groupName ? 'bg-cyan-100 text-cyan-700' : 'text-slate-600 hover:bg-white hover:shadow-sm'"
                  @click="handleSidebarClick(item.group)"
                >
                  <div class="flex items-center gap-2 flex-1 min-w-0 outline-none">
                      <span class="w-1.5 h-1.5 shrink-0 rounded-full bg-cyan-200 group-hover/brand:bg-cyan-400 transition-colors" :class="activeScrollGroup === item.group.groupName ? 'bg-cyan-600' : ''"></span>
                      <span class="font-medium text-sm leading-snug break-words">{{ formatProductName(item.group.groupName) }}</span>
                  </div>
                </div>
              </div>
          </div>

          <!-- General Brands -->
          <div v-if="(groupedSidebar.general && groupedSidebar.general.length > 0) || bansalExists" class="p-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
              <h3 class="px-1 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">General Brands</h3>
              <div class="grid grid-cols-2 gap-1">
                
                <div 
                  v-for="group in groupedSidebar.general" 
                  :key="group.groupName"
                  class="flex items-center justify-between rounded-lg px-2 py-1 transition-colors group/brand cursor-pointer"
                  :class="activeScrollGroup === group.groupName ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-white hover:shadow-sm'"
                  @click="handleSidebarClick(group)"
                >
                  <div class="flex items-center gap-2 flex-1 min-w-0 outline-none">
                      <span class="w-1.5 h-1.5 shrink-0 rounded-full bg-emerald-200 group-hover/brand:bg-emerald-400 transition-colors" :class="activeScrollGroup === group.groupName ? 'bg-emerald-600' : ''"></span>
                      <span class="font-medium text-sm leading-snug break-words">{{ formatProductName(group.groupName) }}</span>
                  </div>
                </div>

                <!-- Clubs -->
                <template v-for="club in ['Bansal', 'Airson', 'Kohinoor', 'Naresh']" :key="club">
                   <div 
                     v-if="groupedSidebar[club.toLowerCase() + 'Groups'] && groupedSidebar[club.toLowerCase() + 'Groups'].length > 0"
                     class="flex items-center justify-between rounded-lg px-2 py-1 transition-colors group/brand cursor-pointer"
                     :class="selectedGroup === club ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-white hover:shadow-sm'"
                     @click="handleClubClick(club)"
                   >
                     <div class="flex items-center gap-2 flex-1 min-w-0 outline-none">
                        <span class="w-1.5 h-1.5 shrink-0 rounded-full bg-emerald-200 group-hover/brand:bg-emerald-400 transition-colors" :class="selectedGroup === club ? 'bg-emerald-600' : ''"></span>
                        <span class="font-medium text-sm leading-snug break-words">{{ club }}</span>
                     </div>
                   </div>

                   <!-- Sub-list (Full width) -->
                   <div v-if="groupedSidebar[club.toLowerCase() + 'Groups'] && groupedSidebar[club.toLowerCase() + 'Groups'].length > 0" class="col-span-2 pl-4 pr-1 py-1 space-y-1 relative before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-200">
                      <div 
                        v-for="bGroup in groupedSidebar[club.toLowerCase() + 'Groups']" 
                        :key="bGroup.groupName"
                        class="flex items-center px-2 py-1 rounded-lg transition-colors cursor-pointer"
                         :class="activeScrollGroup === bGroup.groupName ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'"
                        @click="handleSidebarClick(bGroup)"
                      >
                         <span class="text-xs truncate">{{ formatProductName(bGroup.groupName) }}</span>
                      </div>
                   </div>
                </template>

              </div>
          </div>

          <!-- Others -->
          <div v-if="groupedSidebar.others && groupedSidebar.others.length > 0" class="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
              <h3 class="px-1 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Others</h3>
              <div class="grid grid-cols-2 gap-1">
                <div 
                  v-for="group in groupedSidebar.others" 
                  :key="group.groupName"
                  class="flex items-center justify-between rounded-lg px-2 py-1 transition-colors group/brand cursor-pointer"
                  :class="activeScrollGroup === group.groupName ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:bg-white hover:shadow-sm'"
                  @click="handleSidebarClick(group)"
                >
                  <div class="flex items-center gap-2 flex-1 min-w-0 outline-none">
                      <span class="w-1.5 h-1.5 shrink-0 rounded-full bg-slate-300 group-hover/brand:bg-blue-400 transition-colors" :class="activeScrollGroup === group.groupName ? 'bg-blue-600' : ''"></span>
                      <span class="font-medium text-sm leading-snug break-words">{{ formatProductName(group.groupName) }}</span>
                  </div>
                </div>
              </div>
          </div>

        </nav>
      </div>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  showSidePanel: Boolean,
  groupedSidebar: {
    type: Object,
    default: () => ({})
  },
  activeScrollGroup: String,
  selectedGroup: String
});

const emit = defineEmits(['update:showSidePanel', 'sidebarClick', 'clubClick']);

const bansalExists = computed(() => {
   return props.groupedSidebar && props.groupedSidebar.bansalGroups && props.groupedSidebar.bansalGroups.length > 0;
});

const handleSidebarClick = (group) => {
    emit('sidebarClick', group);
    emit('update:showSidePanel', false);
};

const handleClubClick = (clubName) => {
    emit('clubClick', clubName);
    emit('update:showSidePanel', false);
};

const formatProductName = (name) => {
  if (!name) return '';
  return name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};
</script>
