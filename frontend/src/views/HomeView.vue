<template>
  <div class="h-screen h-[100dvh] max-h-[100dvh] flex flex-col bg-[#f8f6f1] relative text-slate-800 antialiased overflow-hidden font-sans" style="background-image: radial-gradient(circle at 85% 15%, rgba(253, 230, 138, 0.35) 0%, rgba(251, 191, 36, 0.1) 35%, transparent 70%), radial-gradient(circle at 15% 85%, rgba(196, 181, 253, 0.25) 0%, rgba(139, 92, 246, 0.08) 35%, transparent 65%); background-repeat: no-repeat; background-attachment: fixed; background-size: cover;">
    
    <!-- ═══════════════════════════════════════════════════════════
         1. FIXED TOP PART: LOCATION, TOPBAR, SBE HUB TITLE & SYNC
         ═══════════════════════════════════════════════════════════ -->
    <header class="flex-shrink-0 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-8 py-3 shadow-2xs z-30 transition-all duration-300" style="padding-top: max(env(safe-area-inset-top, 24px), 12px);">
      <div class="max-w-6xl mx-auto w-full">
        <!-- Top Bar Row -->
        <div class="flex items-center justify-between gap-3">
          <!-- Left: Location / Date -->
          <div class="flex items-center gap-2.5 min-w-0">
            <button v-if="route.path !== '/home' && route.path !== '/'" type="button" @click="router.push('/')" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 flex items-center justify-center transition-all flex-shrink-0 cursor-pointer shadow-2xs" title="Back to Stock">
              <i class="fa-solid fa-arrow-left text-xs"></i>
            </button>
            <div class="min-w-0">
              <div class="flex items-center gap-1.5 cursor-pointer">
                <i class="fa-solid fa-location-dot text-amber-600 text-xs"></i>
                <span class="text-xs sm:text-sm font-black text-slate-900 leading-tight truncate">Sri Brundabana Enterprises</span>
              </div>
              <p class="text-[10px] text-slate-400 font-semibold truncate leading-none mt-0.5">
                {{ currentDay }}, {{ currentDate }} • Rayagada
              </p>
            </div>
          </div>

          <!-- Right: Controls -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <VersionBadge />

            <button
              v-if="isAdmin && !isSuperAdmin"
              @click="updateStockData"
              class="w-8 h-8 rounded-full bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-600 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
              title="Sync Data"
            >
              <i class="fa-solid fa-rotate text-xs" :class="{ 'animate-spin': isSyncing }"></i>
            </button>
            
            <button
              v-if="isAdmin || isSuperAdmin"
              @click="toggleConsole"
              class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 hidden lg:flex items-center justify-center transition-all cursor-pointer shadow-2xs"
              :class="{ 'bg-slate-900 text-white': showConsole }"
              title="Toggle Console"
            >
              <i class="fa-solid fa-terminal text-xs"></i>
            </button>

            <button
              v-if="!isAdmin && !isSuperAdmin"
              @click="$router.push({ query: { login: 'admin' } })"
              class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
              title="Admin Login"
            >
              <i class="fa-solid fa-lock text-xs"></i>
            </button>

            <button
              v-if="isAdmin || isSuperAdmin"
              @click="handleLogout"
              class="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-600 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
              title="Logout"
            >
              <i class="fa-solid fa-right-from-bracket text-xs"></i>
            </button>
          </div>
        </div>

        <!-- SBE Hub Hero Branding Row (Fixed with Last Sync Time) -->
        <div class="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <div class="flex items-baseline gap-2">
            <h1 class="text-xl sm:text-2xl font-black text-slate-900 leading-none tracking-tight">
              <span>SBE</span>
              <span class="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent ml-1">Hub</span>
            </h1>
            <span class="px-2 py-0.5 rounded-full bg-amber-100/80 text-amber-900 text-[9px] font-black uppercase tracking-wider">
              Wholesale
            </span>
          </div>

          <div class="flex items-center gap-1.5 text-right">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p class="text-[10px] sm:text-xs font-bold text-slate-500 truncate">
              {{ lastSyncText }}
            </p>
          </div>
        </div>
      </div>
    </header>

    <!-- ═══════════════════════════════════════════════════════════
         2. SCROLLABLE 80%: ALL MENUS & BENTO GRID
         ═══════════════════════════════════════════════════════════ -->
    <main class="flex-1 overflow-y-auto min-h-0 px-4 sm:px-8 py-4 custom-scrollbar">
      <div class="max-w-6xl mx-auto w-full space-y-4 pb-12">
        
        <!-- Bento Grid of Menus -->
        <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <router-link
            v-for="(item, index) in filteredLinks"
            :key="item.path"
            :to="item.path"
            class="hub-card group"
            :class="[`hub-card--${item.colorKey}`, item.featured ? 'sm:col-span-2 lg:col-span-3' : '']"
            :style="{ '--card-delay': `${index * 0.03}s` }"
          >
            <div class="hub-card__icon-wrap">
              <div class="hub-card__icon" :style="{ background: item.gradient }">
                <i :class="['fa-solid', item.icon]"></i>
              </div>
            </div>
            <div class="hub-card__body">
              <h3 class="hub-card__title group-hover:text-amber-700 transition-colors">{{ item.label }}</h3>
              <p class="hub-card__desc">{{ item.desc }}</p>
            </div>
            <div class="hub-card__arrow">
              <i class="fa-solid fa-arrow-right"></i>
            </div>
          </router-link>
        </section>

        <!-- Footer Note -->
        <div class="pt-6 text-center text-xs text-slate-400 font-semibold">
          <span>Sri Brundabana Enterprises • Wholesale Footwear • Rayagada, Odisha</span>
        </div>
      </div>
    </main>

    <!-- Admin Console Sidebar (Desktop only) -->
    <Transition name="console-slide">
      <aside v-if="(isAdmin || isSuperAdmin) && showConsole" class="hub-console hidden lg:flex">
        <ConsoleViewer />
      </aside>
    </Transition>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAdmin } from '../composables/useAdmin';
import { useStockData } from '../composables/useStockData';
import { useAppStore } from '../stores/appStore';
import ConsoleViewer from '../components/ConsoleViewer.vue';
import VersionBadge from '../components/VersionBadge.vue';

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const { isAdmin, isSuperAdmin, logout } = useAdmin();

const showConsole = ref(false);
const toggleConsole = () => {
  showConsole.value = !showConsole.value;
};

const handleLogout = async () => {
  await logout();
  router.push('/');
};

const isLocal = ref(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const { updateStockData, loading: isSyncing, lastRefresh, loadStockData } = useStockData(isLocal);

// Date display
const now = new Date();
const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
const currentDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const lastSyncText = computed(() => {
  const syncDate = lastRefresh.value || appStore.lastSyncTime;
  if (!syncDate) return 'Catalog up to date';
  const d = new Date(syncDate);
  if (isNaN(d.getTime())) return 'Catalog up to date';

  const diffMs = Date.now() - d.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const dateFormatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const timeFormatted = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  if (diffHours < 1) {
    const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    return `Last synced: ${diffMins} min${diffMins > 1 ? 's' : ''} ago (${timeFormatted})`;
  } else if (diffHours < 24) {
    return `Last synced: ${diffHours} hr${diffHours > 1 ? 's' : ''} ago (${dateFormatted} at ${timeFormatted})`;
  } else if (diffDays === 1) {
    return `Last synced: Yesterday (${dateFormatted} at ${timeFormatted})`;
  }
  return `Last synced: ${dateFormatted} at ${timeFormatted}`;
});

const links = [
  {
    path: '/pdf-gen?onetouch=true',
    label: 'One Touch Share',
    desc: 'Auto-share all brands in 1 tap',
    icon: 'fa-bolt',
    colorKey: 'violet',
    gradient: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
    featured: true,
    badge: '1-TAP'
  },
  {
    path: '/analyzer',
    label: 'Line Debtors Analyzer',
    desc: 'Route outstanding & 5-bucket aging risk',
    icon: 'fa-chart-pie',
    colorKey: 'teal',
    gradient: 'linear-gradient(135deg, #0d9488, #059669)',
    featured: true,
    badge: 'NEW'
  },
  {
    path: '/order-maker',
    label: 'Order Maker',
    desc: 'Rapid 1-tap ordering & size groups',
    icon: 'fa-cart-plus',
    colorKey: 'rose',
    gradient: 'linear-gradient(135deg, #f43f5e, #e11d48)',
    featured: true,
    badge: 'RAPID'
  },
  {
    path: '/quotation',
    label: 'Quotation Maker',
    desc: 'Create quotations with images & WhatsApp PDF',
    icon: 'fa-file-invoice-dollar',
    colorKey: 'emerald',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
    featured: true
  },
  {
    path: '/rate-chart',
    label: 'Rate Chart',
    desc: 'Brand wholesale prices & MRP list',
    icon: 'fa-chart-simple',
    colorKey: 'blue',
    gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)'
  },
  {
    path: '/line-list',
    label: 'Line List',
    desc: 'Outstanding balance by party & area',
    icon: 'fa-list-check',
    colorKey: 'amber',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)'
  },
  {
    path: '/sample-room',
    label: 'Sample Room',
    desc: 'Live showroom catalog & photo gallery',
    icon: 'fa-wand-magic-sparkles',
    colorKey: 'pink',
    gradient: 'linear-gradient(135deg, #ec4899, #db2777)'
  },
  {
    path: '/stock-trend',
    label: 'Stock Trend',
    desc: '30-day inventory movements & velocity',
    icon: 'fa-arrow-trend-up',
    colorKey: 'purple',
    gradient: 'linear-gradient(135deg, #a855f7, #9333ea)'
  },
  {
    path: '/old-stock',
    label: 'Old Stock',
    desc: 'Aging inventory & slow-moving items',
    icon: 'fa-clock-rotate-left',
    colorKey: 'orange',
    gradient: 'linear-gradient(135deg, #f97316, #ea580c)'
  },
  {
    path: '/pdf-gen',
    label: 'PDF Generator',
    desc: 'Batch catalog generator with custom branding',
    icon: 'fa-file-pdf',
    colorKey: 'indigo',
    gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)'
  },
  {
    path: '/upload',
    label: 'Upload Images',
    desc: 'Manage article photos & Cloudinary links',
    icon: 'fa-cloud-arrow-up',
    colorKey: 'cyan',
    gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
    adminOnly: true
  },
  {
    path: '/',
    label: 'Full Stock Catalog',
    desc: 'Complete inventory database & table view',
    icon: 'fa-boxes-stacked',
    colorKey: 'slate',
    gradient: 'linear-gradient(135deg, #64748b, #475569)'
  }
];

const filteredLinks = computed(() => {
  return links.filter(l => !l.adminOnly || isAdmin.value || isSuperAdmin.value);
});

onMounted(async () => {
  if (!stockData.value || stockData.value.length === 0) {
    await loadStockData();
  }
});
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 99px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}

.hub-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px -2px rgba(0,0,0,0.04), 0 8px 24px -4px rgba(0,0,0,0.03);
  text-decoration: none;
  color: inherit;
  transition: all 0.25s cubic-bezier(.4,0,.2,1);
  overflow: hidden;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.hub-card:hover {
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 8px 24px -4px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04);
  transform: translateY(-2px);
}
.hub-card:active { transform: scale(0.98); }

.hub-card__icon-wrap {
  flex-shrink: 0;
}
.hub-card__icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  box-shadow: 0 4px 12px -2px rgba(0,0,0,0.15);
  transition: transform 0.25s cubic-bezier(.4,0,.2,1);
}
.hub-card:hover .hub-card__icon { transform: scale(1.06) rotate(-2deg); }

.hub-card__body {
  flex: 1;
  min-width: 0;
}
.hub-card__title {
  font-weight: 700;
  font-size: 15px;
  color: #1e293b;
  line-height: 1.2;
}
.hub-card__desc {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
  line-height: 1.2;
  font-weight: 500;
}

.hub-card__arrow {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #cbd5e1;
  font-size: 11px;
  transition: all 0.2s ease;
}
.hub-card:hover .hub-card__arrow {
  color: #d97706;
  transform: translateX(3px);
}

.hub-console {
  width: 480px;
  flex-shrink: 0;
  height: 100vh;
  position: sticky;
  top: 0;
  border-left: 1px solid rgba(0,0,0,0.08);
  background: #0f172a;
  z-index: 40;
  overflow: hidden;
}

.console-slide-enter-active,
.console-slide-leave-active {
  transition: width 0.3s cubic-bezier(.4,0,.2,1), opacity 0.2s ease;
}
.console-slide-enter-from,
.console-slide-leave-to {
  width: 0 !important;
  opacity: 0;
}
</style>
