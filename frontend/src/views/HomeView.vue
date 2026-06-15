<template>
  <div class="home-shell min-h-screen w-full font-sans text-slate-800 flex">
    <main class="w-full min-h-screen flex flex-col flex-1 min-w-0" :class="showBlackNavbar ? 'pt-[54px] lg:pt-[72px]' : 'pt-2 sm:pt-4'">
      <!-- Header -->
      <div class="home-header-sticky sticky z-40 px-2.5 pt-2 pb-1.5 sm:px-5 sm:pt-4 sm:pb-2 lg:px-6 xl:px-10" :class="showBlackNavbar ? 'top-[54px] lg:top-[72px]' : 'top-0'">
        <div class="home-header-card mx-auto flex w-full max-w-3xl flex-col gap-2 p-3 sm:p-5">
          <div class="flex items-center justify-between gap-2 sm:gap-4">
            <div class="flex items-center gap-2 sm:gap-4">
              <button type="button" @click="router.push('/')" class="home-back-btn flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-slate-600 transition-all active:scale-95 sm:h-12 sm:w-12" title="Back">
                <i class="fa-solid fa-arrow-left text-sm sm:text-[15px]"></i>
              </button>
              <div>
                <h1 class="text-lg font-bold tracking-tight text-slate-950 sm:text-2xl">SBE Hub</h1>
                <p class="text-[11px] text-slate-500 sm:text-xs">Quick access to all tools</p>
              </div>
            </div>
            
            <button
               v-if="isAdmin && !isSuperAdmin"
               @click="updateStockData"
               class="home-back-btn flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-blue-600 transition-all active:scale-95 sm:h-12 sm:w-12 hover:text-blue-700"
               title="Sync Data"
            >
              <i class="fa-solid fa-rotate" :class="{ 'animate-spin': isSyncing }"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="flex-1 px-2.5 pt-2 pb-16 sm:px-5 sm:pt-4 lg:px-6 xl:px-10">
        <div class="mx-auto w-full max-w-3xl">
          <div class="grid grid-cols-2 gap-3 sm:gap-4">
            <router-link v-for="item in filteredLinks" :key="item.path" :to="item.path"
              class="home-card group flex flex-col items-center gap-3 rounded-2xl p-5 text-center transition-all duration-200 active:scale-[0.97] sm:rounded-[1.75rem] sm:gap-4 sm:p-7 hover:-translate-y-1">
              <div class="flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-transform duration-200 group-hover:scale-110 sm:h-16 sm:w-16 sm:rounded-[1.25rem]"
                :style="{ background: item.gradient, boxShadow: item.shadow }">
                <i :class="['fa-solid', item.icon, 'text-xl text-white sm:text-2xl']"></i>
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-900 sm:text-base">{{ item.label }}</h3>
                <p class="mt-0.5 text-[10px] leading-snug text-slate-400 sm:text-xs">{{ item.desc }}</p>
              </div>
            </router-link>
          </div>
        </div>
      </div>
    </main>

    <!-- Admin Console Viewer (Visible on Desktop only) -->
    <aside v-if="isAdmin || isSuperAdmin" class="hidden lg:block w-1/5 shrink-0 border-l border-slate-200 bg-slate-950 h-screen sticky top-0">
      <ConsoleViewer />
    </aside>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAdmin } from '../composables/useAdmin';
import { useStockData } from '../composables/useStockData';
import ConsoleViewer from '../components/ConsoleViewer.vue';

const router = useRouter();
const { isAdmin, isSuperAdmin } = useAdmin();
const showBlackNavbar = computed(() => !(isAdmin.value || isSuperAdmin.value));
const isLocal = ref(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const { updateStockData, loading: isSyncing } = useStockData(isLocal);

const links = [
  {
    path: '/ledger',
    label: 'Ledger',
    desc: 'Account balances & entries',
    icon: 'fa-book-open',
    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    shadow: '0 8px 24px -4px rgba(99,102,241,0.4)',
  },
  {
    path: '/sample-room',
    label: 'Sample Room',
    desc: 'Track present samples',
    icon: 'fa-box-open',
    gradient: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
    shadow: '0 8px 24px -4px rgba(14,165,233,0.4)',
  },
  {
    path: '/stock-trend',
    label: 'Stock Trends',
    desc: 'Movement & reorder insights',
    icon: 'fa-chart-line',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    shadow: '0 8px 24px -4px rgba(245,158,11,0.4)',
  },
  {
    path: '/pdf-gen',
    label: 'PDF Generator',
    desc: 'One-touch share & batches',
    icon: 'fa-file-pdf',
    gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
    shadow: '0 8px 24px -4px rgba(239,68,68,0.4)',
  },
  {
    path: '/daybook',
    label: 'Daybook',
    desc: 'Daily voucher transactions',
    icon: 'fa-calendar-day',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
    shadow: '0 8px 24px -4px rgba(16,185,129,0.4)',
  },
  {
    path: '/',
    label: 'Stock Table',
    desc: 'Product catalog & images',
    icon: 'fa-table-cells-large',
    gradient: 'linear-gradient(135deg, #64748b, #475569)',
    shadow: '0 8px 24px -4px rgba(100,116,139,0.4)',
  },
  {
    path: '/rate-chart',
    label: 'Rate Chart',
    desc: 'Print brand price lists',
    icon: 'fa-file-invoice-dollar',
    gradient: 'linear-gradient(135deg, #ec4899, #be185d)',
    shadow: '0 8px 24px -4px rgba(236,72,153,0.4)',
  },
  {
    path: '/line-list',
    label: 'Line List',
    desc: 'Print area debtor balances',
    icon: 'fa-map-location-dot',
    gradient: 'linear-gradient(135deg, #8b5cf6, #db2777)',
    shadow: '0 8px 24px -4px rgba(139,92,246,0.4)',
  },
  {
    path: '/quotation',
    label: 'Quotation & Bill',
    desc: 'Generate general & tax bills',
    icon: 'fa-file-invoice',
    gradient: 'linear-gradient(135deg, #22c55e, #16a34a)',
    shadow: '0 8px 24px -4px rgba(34,197,94,0.4)',
  },
  {
    path: '/old-stock',
    label: 'Old Stock',
    desc: 'View discontinued items',
    icon: 'fa-box-archive',
    gradient: 'linear-gradient(135deg, #a8a29e, #78716c)',
    shadow: '0 8px 24px -4px rgba(168,162,158,0.4)',
  },
];

const filteredLinks = computed(() => {
  return links.filter(item => {
    if ((item.path === '/ledger' || item.path === '/daybook' || item.path === '/line-list' || item.path === '/quotation') && !isAdmin.value && !isSuperAdmin.value) {
      return false;
    }
    return true;
  });
});
</script>

<style scoped>
.home-shell {
  background-color: #fafafa;
  background-image:
    radial-gradient(1000px 500px at 50% -5%, rgba(99,102,241,0.12), transparent 50%),
    radial-gradient(800px 400px at 80% 80%, rgba(14,165,233,0.08), transparent 45%);
}
.home-header-sticky { pointer-events: none; }
.home-header-sticky > * { pointer-events: auto; }
.home-header-card {
  border-radius: 1.75rem;
  background: rgba(255,255,255,0.75);
  backdrop-filter: blur(20px) saturate(1.35);
  -webkit-backdrop-filter: blur(20px) saturate(1.35);
  box-shadow: 0 1px 0 rgba(255,255,255,0.9) inset, 0 20px 40px -18px rgba(15,23,42,0.12), 0 0 0 1px rgba(255,255,255,0.5);
}
.home-back-btn {
  background: #fff;
  box-shadow: 0 4px 14px rgba(15,23,42,0.08), 0 0 0 1px rgba(226,232,240,0.9);
}
.home-card {
  background: rgba(255,255,255,0.9);
  box-shadow: 0 16px 36px -16px rgba(15,23,42,0.12), 0 0 0 1px rgba(255,255,255,0.8) inset;
}
.home-card:hover {
  box-shadow: 0 24px 48px -16px rgba(15,23,42,0.18), 0 0 0 1px rgba(255,255,255,0.9) inset;
}
</style>
