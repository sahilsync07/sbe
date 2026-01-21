<template>
  <nav class="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-slate-100 z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
    <div class="flex items-center justify-around h-[60px] px-2">
      <button
        v-for="tab in visibleTabs"
        :key="tab.id"
        @click="handleTabClick(tab)"
        class="flex flex-col items-center justify-center w-full h-full gap-1 active:scale-95 transition-transform duration-200"
      >
        <div class="relative">
          <component
            :is="tab.icon"
            :class="[
              'w-6 h-6 transition-all duration-300',
              isActive(tab) ? 'text-slate-900 fill-slate-900' : 'text-slate-400'
            ]"
            :stroke-width="isActive(tab) ? 1.5 : 2"
          />
        </div>
        <span
          :class="[
            'text-[10px] font-bold tracking-wide',
            isActive(tab) ? 'text-slate-900' : 'text-slate-400'
          ]"
        >
          {{ tab.label }}
        </span>
      </button>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import { Home, Layers, User, FileText } from 'lucide-vue-next';

const props = defineProps({
  activeTab: {
    type: String,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['tab-change', 'brands-click']);

const baseTabs = [
  {
    id: 'home',
    label: 'HOME',
    icon: Home,
  },
  {
    id: 'brands',
    label: 'BRANDS',
    icon: Layers,
  },
  {
    id: 'profile',
    label: 'PROFILE',
    icon: User,
  },
];

const visibleTabs = computed(() => {
  if (props.isAdmin) {
    const tabs = [...baseTabs];
    // Insert Catalog after Brands
    tabs.splice(2, 0, {
      id: 'pdf-gen',
      label: 'CATALOG',
      icon: FileText,
      isSpecial: true
    });
    return tabs;
  }
  return baseTabs;
});

const isActive = (tab) => {
  return props.activeTab === tab.id;
};

const handleTabClick = (tab) => {
  if (tab.id === 'brands') {
    emit('brands-click');
  } else {
    emit('tab-change', tab.id);
  }
};
</script>

<style scoped>
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
