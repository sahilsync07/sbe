<template>
  <div class="hub-shell">
    <!-- Main Content Area -->
    <main class="hub-main">
      <!-- Ambient Glow Orbs -->
      <div class="hub-orb hub-orb--warm"></div>
      <div class="hub-orb hub-orb--accent"></div>

      <!-- Top Bar -->
      <header class="hub-topbar">
        <div class="hub-topbar__left">
          <button type="button" @click="router.push('/')" class="hub-icon-btn" title="Back to Stock">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div class="hub-topbar__date">
            <span class="hub-topbar__day">{{ currentDay }}</span>
            <span class="hub-topbar__full-date">{{ currentDate }}</span>
          </div>
        </div>

        <div class="hub-topbar__right" v-if="isAdmin || isSuperAdmin">
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
        <p class="hub-hero__sub">Your command center — every tool, one tap away.</p>
      </section>

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
        <span>Built with precision for SBE Rayagada</span>
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
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAdmin } from '../composables/useAdmin';
import { useStockData } from '../composables/useStockData';
import ConsoleViewer from '../components/ConsoleViewer.vue';

const router = useRouter();
const { isAdmin, isSuperAdmin, logout } = useAdmin();

const showConsole = ref(false); // collapsed by default

const toggleConsole = () => {
  showConsole.value = !showConsole.value;
};

const handleLogout = async () => {
  await logout();
  router.push('/');
};

const isLocal = ref(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const { updateStockData, loading: isSyncing } = useStockData(isLocal);

// Date display
const now = new Date();
const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
const currentDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const links = [
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
    colorKey: 'indigo',
    gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
  },
  {
    path: '/sample-room',
    label: 'Sample Room',
    desc: 'Track present samples',
    icon: 'fa-box-open',
    colorKey: 'cyan',
    gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
  },
  {
    path: '/stock-trend',
    label: 'Stock Trends',
    desc: 'Movement & reorder insights',
    icon: 'fa-chart-line',
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
  {
    path: '/analyzer',
    label: 'Analyzer',
    desc: 'Debtor & creditor monthly analysis',
    icon: 'fa-chart-pie',
    colorKey: 'teal',
    gradient: 'linear-gradient(135deg, #14b8a6, #0d9488)',
  },
];

const filteredLinks = computed(() => {
  return links.filter(item => {
    if ((item.path === '/ledger' || item.path === '/daybook' || item.path === '/line-list' || item.path === '/quotation' || item.path === '/analyzer') && !isAdmin.value && !isSuperAdmin.value) {
      return false;
    }
    return true;
  });
});
</script>

<style scoped>
/* ══════════════════════════════════════
   SHELL & LAYOUT
   ══════════════════════════════════════ */
.hub-shell {
  display: flex;
  min-height: 100vh;
  min-height: 100dvh;
  background: #f8f6f1;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  position: relative;
  overflow-x: hidden;
}

.hub-main {
  flex: 1;
  min-width: 0;
  position: relative;
  padding: 0 clamp(16px, 4vw, 48px);
  padding-bottom: 48px;
  overflow-y: auto;
}

/* ══════════════════════════════════════
   AMBIENT ORBS (Background Glow)
   ══════════════════════════════════════ */
.hub-orb {
  position: fixed;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
  z-index: 0;
  opacity: 0.45;
}
.hub-orb--warm {
  width: 700px; height: 700px;
  top: -180px; right: -100px;
  background: radial-gradient(circle, #fde68a 0%, #fbbf24 40%, transparent 70%);
}
.hub-orb--accent {
  width: 500px; height: 500px;
  bottom: -120px; left: -80px;
  background: radial-gradient(circle, #c4b5fd 0%, #8b5cf6 40%, transparent 70%);
  opacity: 0.25;
}

/* ══════════════════════════════════════
   TOP BAR
   ══════════════════════════════════════ */
.hub-topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  backdrop-filter: blur(16px) saturate(1.4);
  -webkit-backdrop-filter: blur(16px) saturate(1.4);
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
  background: rgba(255,255,255,0.7);
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
  z-index: 1;
  padding: 32px 0 10px;
}

.hub-hero__title {
  font-family: 'Clash Display', sans-serif;
  font-weight: 700;
  font-size: clamp(40px, 7vw, 72px);
  line-height: 1;
  letter-spacing: -0.03em;
  display: flex;
  align-items: baseline;
  gap: 14px;
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
  margin-top: 10px;
  font-size: clamp(13px, 1.4vw, 16px);
  color: #94a3b8;
  font-weight: 450;
  letter-spacing: 0.01em;
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
  padding: 28px 0 0;
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
  background: rgba(255,255,255,0.65);
  backdrop-filter: blur(14px) saturate(1.3);
  -webkit-backdrop-filter: blur(14px) saturate(1.3);
  border: 1px solid rgba(255,255,255,0.8);
  box-shadow:
    0 1px 0 rgba(255,255,255,0.9) inset,
    0 8px 32px -8px rgba(15,23,42,0.06);
  cursor: pointer;
  text-decoration: none;
  transition: all 0.35s cubic-bezier(.4,0,.2,1);
  animation: card-rise 0.5s cubic-bezier(.16,1,.3,1) var(--card-delay, 0s) both;
  overflow: hidden;
}

.hub-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  opacity: 0;
  transition: opacity 0.35s ease;
  background: linear-gradient(135deg, rgba(255,255,255,0.3), transparent 60%);
}

.hub-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 1px 0 rgba(255,255,255,1) inset,
    0 20px 48px -12px rgba(15,23,42,0.12),
    0 0 0 1px rgba(255,255,255,0.9);
  background: rgba(255,255,255,0.85);
}
.hub-card:hover::before { opacity: 1; }
.hub-card:active { transform: scale(0.98) translateY(0); }

/* Featured Card (Stock Table) — spans full width on large screens */
.hub-card--featured {
  grid-column: 1 / -1;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-color: rgba(255,255,255,0.05);
  box-shadow:
    0 1px 0 rgba(255,255,255,0.03) inset,
    0 20px 48px -12px rgba(0,0,0,0.3);
}
.hub-card--featured .hub-card__title { color: #f1f5f9; }
.hub-card--featured .hub-card__desc { color: #94a3b8; }
.hub-card--featured .hub-card__arrow { color: #64748b; }
.hub-card--featured:hover {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  box-shadow:
    0 1px 0 rgba(255,255,255,0.05) inset,
    0 24px 56px -12px rgba(0,0,0,0.4);
}
.hub-card--featured .hub-card__icon {
  box-shadow: 0 8px 24px -4px rgba(100,116,139,0.5);
}

/* Icon */
.hub-card__icon-wrap {
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.hub-card__icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  box-shadow: 0 6px 20px -4px rgba(0,0,0,0.25);
  transition: transform 0.3s cubic-bezier(.4,0,.2,1), box-shadow 0.3s ease;
}

.hub-card:hover .hub-card__icon {
  transform: scale(1.1) rotate(-2deg);
  box-shadow: 0 10px 28px -4px rgba(0,0,0,0.35);
}

/* Body */
.hub-card__body {
  flex: 1;
  min-width: 0;
  position: relative;
  z-index: 1;
}

.hub-card__title {
  font-family: 'Clash Display', sans-serif;
  font-weight: 600;
  font-size: 15px;
  color: #1e293b;
  line-height: 1.2;
  letter-spacing: -0.01em;
}

.hub-card__desc {
  margin-top: 3px;
  font-size: 12px;
  color: #94a3b8;
  font-weight: 400;
  line-height: 1.35;
}

/* Arrow */
.hub-card__arrow {
  flex-shrink: 0;
  font-size: 12px;
  color: #cbd5e1;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}
.hub-card:hover .hub-card__arrow {
  color: #64748b;
  transform: translateX(4px);
}
.hub-card--featured:hover .hub-card__arrow {
  color: #e2e8f0;
}

/* ══════════════════════════════════════
   FOOTER
   ══════════════════════════════════════ */
.hub-footer {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 40px 0 16px;
  font-size: 11px;
  color: #cbd5e1;
  font-weight: 400;
  letter-spacing: 0.04em;
}

/* ══════════════════════════════════════
   CONSOLE SIDEBAR
   ══════════════════════════════════════ */
.hub-console {
  width: 320px;
  flex-shrink: 0;
  height: 100vh;
  height: 100dvh;
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  border-left: 1px solid rgba(30,41,59,0.08);
  background: #0f172a;
  box-shadow: -8px 0 32px rgba(0,0,0,0.1);
}

/* Console Slide Transition */
.console-slide-enter-active {
  transition: all 0.4s cubic-bezier(.16,1,.3,1);
}
.console-slide-leave-active {
  transition: all 0.3s cubic-bezier(.4,0,1,1);
}
.console-slide-enter-from,
.console-slide-leave-to {
  width: 0;
  opacity: 0;
  transform: translateX(40px);
  overflow: hidden;
}

/* ══════════════════════════════════════
   ANIMATIONS
   ══════════════════════════════════════ */
@keyframes card-rise {
  0% {
    opacity: 0;
    transform: translateY(16px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ══════════════════════════════════════
   RESPONSIVE
   ══════════════════════════════════════ */
@media (max-width: 639px) {
  .hub-hero { padding: 20px 0 6px; }
  .hub-hero__title { gap: 10px; }
  .hub-grid {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 20px 0 0;
  }
  .hub-card { padding: 16px 18px; gap: 14px; border-radius: 16px; }
  .hub-card--featured { grid-column: 1; }
  .hub-card__icon { width: 42px; height: 42px; border-radius: 12px; font-size: 16px; }
  .hub-icon-btn { width: 36px; height: 36px; border-radius: 12px; font-size: 13px; }
  .hub-topbar__date { display: none; }
  .hub-orb--warm { width: 400px; height: 400px; top: -100px; right: -60px; }
  .hub-orb--accent { width: 300px; height: 300px; }
}

@media (min-width: 640px) and (max-width: 1023px) {
  .hub-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .hub-card--featured { grid-column: 1 / -1; }
}

@media (min-width: 1024px) {
  .hub-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  .hub-card--featured { grid-column: 1 / -1; }
}

@media (min-width: 1280px) {
  .hub-hero { padding: 40px 0 14px; }
  .hub-card {
    padding: 22px 26px;
    gap: 18px;
  }
  .hub-card__icon {
    width: 52px;
    height: 52px;
    font-size: 20px;
    border-radius: 16px;
  }
  .hub-card__title { font-size: 16px; }
  .hub-card__desc { font-size: 13px; }
}
</style>
