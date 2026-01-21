
<template>
  <div>
    <!-- Side Panel -->
    <aside
      class="fixed inset-y-0 left-0 w-full sm:w-96 lg:w-96 border-r border-slate-200 z-[50] transform transition-transform duration-300 ease-in-out bg-white/95 backdrop-blur-sm sm:bg-white pt-[118px] lg:pt-40"
      :class="showSidePanel ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="p-4 h-full overflow-y-auto overscroll-contain">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-slate-800">Brands</h2>
        </div>
        <nav class="space-y-6 pb-20">
          
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

                   <!-- Sub-list -->
                   <div v-if="groupedSidebar[club.toLowerCase() + 'Groups'] && groupedSidebar[club.toLowerCase() + 'Groups'].length > 0" class="col-span-2 grid grid-cols-2 gap-1">
                      <div 
                        v-for="bGroup in groupedSidebar[club.toLowerCase() + 'Groups']" 
                        :key="bGroup.groupName"
                        class="flex items-center justify-between rounded-lg px-2 py-1 transition-colors group/brand cursor-pointer"
                        :class="activeScrollGroup === bGroup.groupName ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-white hover:shadow-sm'"
                        @click="handleSidebarClick(bGroup)"
                      >
                         <div class="flex items-center gap-2 flex-1 min-w-0 outline-none">
                            <i class="fa-solid fa-circle text-[4px] shrink-0 text-slate-300"></i>
                            <span class="text-xs font-light leading-snug break-words">{{ formatProductName(bGroup.groupName) }}</span>
                         </div>
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
    </aside>

    <!-- Overlay for mobile sidebar -->
    <div 
      v-if="showSidePanel" 
      class="fixed inset-0 bg-black/50 z-30 lg:hidden"
      @click="$emit('update:showSidePanel', false)"
    ></div>
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
};

const handleClubClick = (clubName) => {
    emit('clubClick', clubName);
};

const formatProductName = (name) => {
  if (!name) return '';
  return name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};
</script>
