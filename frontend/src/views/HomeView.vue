<template>
  <div class="hub-shell">
    <!-- Main Content Area -->
    <main class="hub-main">
      <!-- Fixed Header Zone (Top Bar + SBE Hub Title) -->
      <div class="hub-header-wrap">
        <!-- Top Bar -->
        <header class="hub-topbar">
          <div class="hub-topbar__left">
            <button v-if="route.path !== '/home' && route.path !== '/'" type="button" @click="router.push('/')" class="hub-icon-btn" title="Back to Stock">
              <i class="fa-solid fa-arrow-left"></i>
            </button>
            <div class="hub-topbar__date">
              <span class="hub-topbar__day">{{ currentDay }}</span>
              <span class="hub-topbar__full-date">{{ currentDate }}</span>
            </div>
          </div>

          <div class="hub-topbar__right">
            <!-- Build Version Tag with Info Popover -->
            <VersionBadge />

            <button
              v-if="isAdmin && !isSuperAdmin"
              @click="updateStockData"
              class="hub-icon-btn hub-icon-btn--accent"
              title="Sync Data"
            >
              <i class="fa-solid fa-rotate" :class="{ 'animate-spin': isSyncing }"></i>
            </button>
            <button
              v-if="isAdmin || isSuperAdmin"
              @click="toggleConsole"
              class="hub-icon-btn hub-icon-btn--console hidden lg:flex"
              :class="{ 'hub-icon-btn--active': showConsole }"
              title="Toggle Console"
            >
              <i class="fa-solid fa-terminal"></i>
            </button>
            <button
              v-if="!isAdmin && !isSuperAdmin"
              @click="$router.push({ query: { login: 'admin' } })"
              class="hub-icon-btn hub-icon-btn--accent"
              title="Admin Login"
            >
              <i class="fa-solid fa-lock"></i>
            </button>
            <button
              v-if="isAdmin || isSuperAdmin"
              @click="handleLogout"
              class="hub-icon-btn hub-icon-btn--danger"
              title="Logout"
            >
              <i class="fa-solid fa-right-from-bracket"></i>
            </button>
          </div>
        </header>

        <!-- Hero Section -->
        <section class="hub-hero">
          <h1 class="hub-hero__title">
            <span class="hub-hero__label">SBE</span>
            <span class="hub-hero__gradient">Hub</span>
          </h1>
          <p class="hub-hero__sub">{{ lastSyncText }}</p>
        </section>
      </div>

      <!-- Scrollable Cards Body with Imaginary Line Fade Mask -->
      <div class="hub-scroll-body">
        <!-- Bento Grid -->
        <section class="hub-grid">
          <router-link
            v-for="(item, index) in filteredLinks"
            :key="item.path"
            :to="item.path"
            class="hub-card"
            :class="[`hub-card--${item.colorKey}`, item.featured ? 'hub-card--featured' : '']"
            :style="{ '--card-delay': `${index * 0.04}s` }"
          >
            <div class="hub-card__icon-wrap">
              <div class="hub-card__icon" :style="{ background: item.gradient }">
                <i :class="['fa-solid', item.icon]"></i>
              </div>
            </div>
            <div class="hub-card__body">
              <h3 class="hub-card__title">{{ item.label }}</h3>
              <p class="hub-card__desc">{{ item.desc }}</p>
            </div>
            <div class="hub-card__arrow">
              <i class="fa-solid fa-arrow-right"></i>
            </div>
          </router-link>
        </section>

        <div class="hub-footer">
          <span>Sri Brundabana Enterprises • Rayagada</span>
        </div>
      </div>
    </main>

    <!-- Admin Console Sidebar (Desktop only, collapsible) -->
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
import { useWorkzoneAuth } from '../composables/useWorkzoneAuth';
import { useStockData } from '../composables/useStockData';
import { useAppStore } from '../stores/appStore';
import ConsoleViewer from '../components/ConsoleViewer.vue';
import VersionBadge from '../components/VersionBadge.vue';

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const { isAdmin, isSuperAdmin, logout } = useAdmin();
const { isWorkzoneAuthenticated, checkWorkzoneAuth } = useWorkzoneAuth();

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
    path: '/workzone/sahil',
    label: 'Sahil Workzone',
    desc: 'Creditor analytics & executive workspace',
    icon: 'fa-user-tie',
    colorKey: 'amber',
    gradient: 'linear-gradient(135deg, #f59e0b, #b45309)',
    workzone: 'sahil'
  },
  {
    path: '/workzone/slnp',
    label: 'SLNP Workzone',
    desc: 'Creditor analytics & management workspace',
    icon: 'fa-building-shield',
    colorKey: 'teal',
    gradient: 'linear-gradient(135deg, #0d9488, #047857)',
    workzone: 'slnp'
  },
  {
    path: '/pdf-gen?onetouch=true',
    label: 'One Touch Share',
    desc: 'Auto-share all brands in 1 tap',
    icon: 'fa-bolt',
    colorKey: 'violet',
    gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
  },
  {
    path: '/analyzer',
    label: 'Line Debtors Analyzer',
    desc: 'Debtor aging & payment recovery',
    icon: 'fa-chart-pie',
    colorKey: 'teal',
    gradient: 'linear-gradient(135deg, #14b8a6, #0d9488)',
  },
  {
    path: '/order-maker',
    label: 'Order Maker',
    desc: 'Rapid 1-screen photo ordering',
    icon: 'fa-wand-magic-sparkles',
    colorKey: 'purple',
    gradient: 'linear-gradient(135deg, #a855f7, #7e22ce)',
  },
  {
    path: '/',
    label: 'Stock Table',
    desc: 'Browse full product catalog with images & live stock',
    icon: 'fa-table-cells-large',
    colorKey: 'slate',
    gradient: 'linear-gradient(135deg, #64748b, #334155)',
    featured: true,
  },
  {
    path: '/ledger',
    label: 'Ledger',
    desc: 'Account balances & entries',
    icon: 'fa-book-open',
    colorKey: 'amber',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
  },
  {
    path: '/pdf-gen',
    label: 'PDF Generator',
    desc: 'One-touch share & batches',
    icon: 'fa-file-pdf',
    colorKey: 'rose',
    gradient: 'linear-gradient(135deg, #f43f5e, #e11d48)',
  },
  {
    path: '/daybook',
    label: 'Daybook',
    desc: 'Daily voucher transactions',
    icon: 'fa-calendar-day',
    colorKey: 'emerald',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
  },
  {
    path: '/rate-chart',
    label: 'Rate Chart',
    desc: 'Print brand price lists',
    icon: 'fa-file-invoice-dollar',
    colorKey: 'pink',
    gradient: 'linear-gradient(135deg, #ec4899, #be185d)',
  },
  {
    path: '/line-list',
    label: 'Line List',
    desc: 'Print area debtor balances',
    icon: 'fa-map-location-dot',
    colorKey: 'violet',
    gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
  },
  {
    path: '/quotation',
    label: 'Quotation & Bill',
    desc: 'Generate general & tax bills',
    icon: 'fa-file-invoice',
    colorKey: 'green',
    gradient: 'linear-gradient(135deg, #22c55e, #16a34a)',
  },
  {
    path: '/old-stock',
    label: 'Old Stock',
    desc: 'View discontinued items',
    icon: 'fa-box-archive',
    colorKey: 'stone',
    gradient: 'linear-gradient(135deg, #a8a29e, #78716c)',
  },
];

const filteredLinks = computed(() => {
  return links.filter(item => {
    if (item.path === '/' && route.path === '/') {
      return false;
    }
    // Workzones: ONLY visible if authenticated for that zone
    if (item.workzone === 'sahil' && !isWorkzoneAuthenticated('sahil')) {
      return false;
    }
    if (item.workzone === 'slnp' && !isWorkzoneAuthenticated('slnp')) {
      return false;
    }
    if ((item.path === '/ledger' || item.path === '/daybook' || item.path === '/line-list' || item.path === '/quotation' || item.path === '/analyzer') && !isAdmin.value && !isSuperAdmin.value) {
      return false;
    }
    return true;
  });
});

onMounted(async () => {
  await checkWorkzoneAuth('sahil');
  await checkWorkzoneAuth('slnp');
  if (!lastRefresh.value) {
    await loadStockData();
  }
});
</script>

<style scoped>
/* ══════════════════════════════════════
   SHELL & RESPONSIVE SEAMLESS GRADIENT
   ══════════════════════════════════════ */
.hub-shell {
  display: flex;
  height: 100vh;
  height: 100dvh;
  /* Seamless responsive radial gradients directly on background — eliminates all bounding-box artifacts */
  background-color: #f8f6f1;
  background-image: 
    radial-gradient(circle at 85% 15%, rgba(253, 230, 138, 0.45) 0%, rgba(251, 191, 36, 0.15) 35%, transparent 70%),
    radial-gradient(circle at 15% 85%, rgba(196, 181, 253, 0.35) 0%, rgba(139, 92, 246, 0.12) 35%, transparent 65%);
  background-repeat: no-repeat;
  background-attachment: fixed;
  background-size: cover;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  position: relative;
  overflow: hidden;
}

.hub-main {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  padding: 0 clamp(16px, 4vw, 48px);
  overflow: hidden;
}

/* ══════════════════════════════════════
   HEADER ZONE (Fixed at top)
   ══════════════════════════════════════ */
.hub-header-wrap {
  flex-shrink: 0;
  position: relative;
  z-index: 20;
  padding-bottom: 6px;
}

/* ══════════════════════════════════════
   TOP BAR
   ══════════════════════════════════════ */
.hub-topbar {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: max(env(safe-area-inset-top, 24px), 16px);
  padding-bottom: 6px;
}

.hub-topbar__left,
.hub-topbar__right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hub-topbar__date {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.hub-topbar__day {
  font-family: 'Clash Display', sans-serif;
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
}
.hub-topbar__full-date {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
  letter-spacing: 0.02em;
}

/* Icon Buttons */
.hub-icon-btn {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.85);
  border: 1px solid rgba(0,0,0,0.06);
  color: #475569;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(.4,0,.2,1);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  position: relative;
  z-index: 1;
}
.hub-icon-btn:hover {
  background: #fff;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  transform: translateY(-1px);
}
.hub-icon-btn:active { transform: scale(0.95); }

.hub-icon-btn--accent { color: #6366f1; }
.hub-icon-btn--accent:hover { color: #4f46e5; background: #eef2ff; }
.hub-icon-btn--danger { color: #ef4444; }
.hub-icon-btn--danger:hover { color: #dc2626; background: #fef2f2; }
.hub-icon-btn--console { color: #64748b; }
.hub-icon-btn--console:hover { color: #475569; background: #f1f5f9; }
.hub-icon-btn--active {
  background: #1e293b !important;
  color: #e2e8f0 !important;
  border-color: #334155 !important;
}
.hub-icon-btn--active:hover { background: #0f172a !important; }

/* ══════════════════════════════════════
   HERO SECTION
   ══════════════════════════════════════ */
.hub-hero {
  position: relative;
  padding-top: 2px;
  padding-bottom: 2px;
  background: transparent;
}

.hub-hero__title {
  font-family: 'Clash Display', sans-serif;
  font-weight: 700;
  font-size: clamp(32px, 5.5vw, 64px);
  line-height: 1.05;
  letter-spacing: -0.03em;
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.hub-hero__label {
  color: #1e293b;
}

.hub-hero__gradient {
  background: linear-gradient(135deg, #d97706, #ea580c, #dc2626);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hub-hero__sub {
  margin-top: 4px;
  font-size: clamp(12px, 1.2vw, 15px);
  color: #94a3b8;
  font-weight: 500;
  letter-spacing: 0.01em;
}

/* ══════════════════════════════════════
   SCROLLABLE BODY & IMAGINARY LINE MASK
   ══════════════════════════════════════ */
.hub-scroll-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  padding-top: 10px;
  padding-bottom: 48px;
  /* Imaginary Line Mask: Cards dissolve smoothly before reaching the top header */
  -webkit-mask-image: linear-gradient(to bottom, transparent 0px, black 22px, black 100%);
  mask-image: linear-gradient(to bottom, transparent 0px, black 22px, black 100%);
}

/* ══════════════════════════════════════
   BENTO GRID
   ══════════════════════════════════════ */
.hub-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
  padding: 4px 0 0;
}

/* ══════════════════════════════════════
   CARD
   ══════════════════════════════════════ */
.hub-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 22px;
  border-radius: 20px;
  background: rgba(255,255,255,0.75);
  border: 1px solid rgba(255,255,255,0.9);
  box-shadow: 0 2px 8px -2px rgba(0,0,0,0.04), 0 8px 24px -4px rgba(0,0,0,0.04);
  text-decoration: none;
  color: inherit;
  transition: all 0.3s cubic-bezier(.4,0,.2,1);
  overflow: hidden;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  animation: cardAppear 0.5s cubic-bezier(.4,0,.2,1) backwards;
  animation-delay: var(--card-delay, 0s);
}

@keyframes cardAppear {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

.hub-card:hover {
  background: rgba(255,255,255,0.95);
  box-shadow: 0 8px 30px -4px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.04);
  transform: translateY(-2px);
}
.hub-card:active { transform: scale(0.98); }

.hub-card--featured {
  grid-column: 1 / -1;
  background: rgba(255,255,255,0.85);
  border: 1px solid rgba(255,255,255,0.95);
  box-shadow: 0 4px 20px -2px rgba(0,0,0,0.06);
}

.hub-card__icon-wrap {
  flex-shrink: 0;
}
.hub-card__icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
  box-shadow: 0 4px 14px -2px rgba(0,0,0,0.15);
  transition: transform 0.3s cubic-bezier(.4,0,.2,1);
}
.hub-card:hover .hub-card__icon { transform: scale(1.08) rotate(-2deg); }

.hub-card__body {
  flex: 1;
  min-width: 0;
}
.hub-card__title {
  font-family: 'Clash Display', sans-serif;
  font-weight: 600;
  font-size: 16px;
  color: #1e293b;
  line-height: 1.3;
}
.hub-card__desc {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
  line-height: 1.3;
}

.hub-card__arrow {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #cbd5e1;
  font-size: 12px;
  transition: all 0.2s ease;
}
.hub-card:hover .hub-card__arrow {
  color: #6366f1;
  transform: translateX(3px);
}

/* ══════════════════════════════════════
   FOOTER
   ══════════════════════════════════════ */
.hub-footer {
  position: relative;
  z-index: 1;
  margin-top: 48px;
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
}

/* ══════════════════════════════════════
   ADMIN CONSOLE PANEL (Sidebar)
   ══════════════════════════════════════ */
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
