<template>
  <header class="sticky top-0 z-50 bg-white shadow-sm text-slate-900 border-b border-gray-100">
    <!-- Top Row: Icons & Logo -->
    <div class="relative flex items-center justify-between px-4 py-3 pt-safe">
      <!-- Left: Menu -->
      <button
        @click="$emit('menu-click')"
        class="p-2 -ml-2 rounded-full hover:bg-slate-100 active:scale-95 transition-all duration-200 z-10"
        aria-label="Open menu"
      >
        <Menu class="w-6 h-6 text-slate-700" :stroke-width="2" />
      </button>

      <!-- Center: Logo (Absolute) -->
      <div class="absolute left-1/2 top-safe -translate-x-1/2 flex flex-col items-center justify-center pointer-events-none w-full max-w-[60%]">
          <div class="flex items-center gap-1.5 justify-center w-full">
            <span class="text-lg font-black tracking-tighter text-slate-900 truncate">SBE</span>
            <span class="text-[10px] font-bold text-slate-500 tracking-widest uppercase bg-slate-100 px-1.5 py-0.5 rounded-sm shrink-0">Rayagada</span>
          </div>
          <span v-if="lastSyncFormatted" class="text-[10px] text-slate-500 font-bold tracking-tight mt-0.5 whitespace-nowrap">
             Last Synced: {{ lastSyncFormatted }}
          </span>
      </div>

      <!-- Right: Actions -->
      <div class="flex items-center gap-1 z-10">
        <!-- Admin Toggle -->
        <button
            @click="$emit('admin-toggle')"
            :class="[ 
              'p-2 rounded-full transition-all duration-300',
              isAdmin 
                ? 'bg-emerald-50 text-emerald-600' 
                : 'hover:bg-slate-100 text-slate-400'
            ]"
            aria-label="Toggle admin mode"
        >
            <ShieldCheck class="w-6 h-6" :stroke-width="isAdmin ? 2.5 : 2" />
        </button>

        <button
          @click="$emit('cart-click')"
          class="p-2 -mr-2 rounded-full hover:bg-slate-100 active:scale-95 transition-all duration-200 relative overflow-visible"
          aria-label="Open cart"
        >
          <ShoppingBag class="w-6 h-6 text-slate-700" :stroke-width="2" />
          <span
            v-if="cartItemCount > 0"
            class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-600 text-[10px] font-bold rounded-full flex items-center justify-center text-white shadow-sm ring-2 ring-white z-20"
          >
            {{ cartItemCount > 99 ? "99+" : cartItemCount }}
          </span>
        </button>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="px-4 pb-3">
      <div class="relative">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" :stroke-width="2" />
        <input
          type="text"
          placeholder="Search items..."
          :value="searchQuery"
          @input="$emit('search-change', $event.target.value)"
          class="w-full pl-10 pr-4 py-2.5 bg-slate-100 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white text-sm font-medium transition-all duration-200 border-none"
        />
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { Menu, ShoppingBag, Search, ShieldCheck } from 'lucide-vue-next';

const props = defineProps({
  cartItemCount: {
    type: Number,
    default: 0
  },
  searchQuery: {
    type: String,
    default: ''
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  lastSyncTime: {
    type: [String, Date, Number],
    default: null
  }
});

const emit = defineEmits(['menu-click', 'cart-click', 'search-change', 'admin-toggle']);

const lastSyncFormatted = computed(() => {
    if (!props.lastSyncTime) return null;
    const date = new Date(props.lastSyncTime);
    // Format: "HH:MM AM/PM"
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
});

</script>

<style scoped>
.pt-safe {
  padding-top: env(safe-area-inset-top, 24px); 
}
.top-safe {
  top: calc(env(safe-area-inset-top, 24px) + 0.5rem);
}
</style>
