<template>
  <div class="min-h-screen bg-slate-50 relative pb-28 text-slate-800 antialiased selection:bg-amber-500 selection:text-white">
    <!-- Ambient Background Glow -->
    <div
      class="fixed top-0 left-0 w-full h-full pointer-events-none -z-10"
      :style="isSahil
        ? 'background: radial-gradient(circle at 85% 10%, rgba(245, 158, 11, 0.12) 0%, transparent 50%), radial-gradient(circle at 10% 80%, rgba(217, 119, 6, 0.08) 0%, transparent 50%), #f8fafc;'
        : 'background: radial-gradient(circle at 85% 10%, rgba(20, 184, 166, 0.12) 0%, transparent 50%), radial-gradient(circle at 10% 80%, rgba(16, 185, 129, 0.08) 0%, transparent 50%), #f8fafc;'"
    ></div>

    <!-- ═══ TOP BAR (Sticky Safe Area) ═══ -->
    <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-xs px-4 sm:px-6 transition-all" style="padding-top: max(env(safe-area-inset-top, 32px), 24px); padding-bottom: 12px;">
      <div class="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <!-- Left: Back Button & Title -->
        <div class="flex items-center gap-3 min-w-0">
          <button
            type="button"
            @click="handleBack"
            class="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all shadow-xs flex-shrink-0 cursor-pointer"
            title="Back to Home"
          >
            <i class="fa-solid fa-arrow-left text-sm"></i>
          </button>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h1 class="text-base sm:text-lg font-black font-['Clash_Display'] text-slate-900 tracking-tight leading-none truncate">
                {{ isSahil ? 'Sahil Workzone' : 'SLNP Workzone' }}
              </h1>
              <span
                class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                :class="isSahil ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-teal-100 text-teal-800 border border-teal-200'"
              >
                {{ isSahil ? 'Executive' : 'Management' }}
              </span>
              <VersionBadge />
            </div>
            <p class="text-[11px] text-slate-400 font-semibold truncate mt-0.5">
              Sri Brundabana Enterprises • Personal Workspace
            </p>
          </div>
        </div>

        <!-- Right: Lock / Logout Button -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <button
            @click="handleLock"
            class="h-10 px-3.5 rounded-2xl bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 active:scale-95 text-xs font-bold text-slate-600 flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            title="Lock Workzone"
          >
            <i class="fa-solid fa-lock text-xs"></i>
            <span class="hidden sm:inline">Lock Zone</span>
          </button>
        </div>
      </div>

      <!-- Horizontal Tabs Bar -->
      <div class="max-w-7xl mx-auto mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-slate-100 pt-2.5">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap select-none"
          :class="activeTab === tab.id
            ? (isSahil ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'bg-teal-600 text-white shadow-md shadow-teal-600/20')
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'"
        >
          <i :class="tab.icon"></i>
          <span>{{ tab.label }}</span>
        </button>
      </div>
    </header>

    <!-- ═══ MAIN WORKZONE CONTENT ═══ -->
    <main class="max-w-7xl mx-auto px-3.5 sm:px-6 pt-4">
      <!-- Tab 1: Creditor Analytics -->
      <div v-if="activeTab === 'creditors'">
        <CreditorAnalytics />
      </div>
    </main>

    <!-- Workzone Login Modal -->
    <WorkzoneLoginModal
      :show="showLoginModal"
      :zone="currentZone"
      @close="onLoginClose"
      @success="onLoginSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useWorkzoneAuth } from '@/composables/useWorkzoneAuth';
import CreditorAnalytics from '@/components/Workzone/CreditorAnalytics.vue';
import WorkzoneLoginModal from '@/components/Workzone/WorkzoneLoginModal.vue';
import VersionBadge from '@/components/VersionBadge.vue';

const route = useRoute();
const router = useRouter();
const { isWorkzoneAuthenticated, checkWorkzoneAuth, logoutWorkzone } = useWorkzoneAuth();

const currentZone = computed(() => {
  const param = route.params.zone || route.query.zone || 'sahil';
  return String(param).toLowerCase();
});

const isSahil = computed(() => currentZone.value === 'sahil');
const showLoginModal = ref(false);
const activeTab = ref('creditors');

const tabs = [
  { id: 'creditors', label: 'Creditor Analytics', icon: 'fa-solid fa-chart-pie' }
];

const verifyAccess = async () => {
  const authed = await checkWorkzoneAuth(currentZone.value);
  if (!authed) {
    showLoginModal.value = true;
  }
};

onMounted(() => {
  verifyAccess();
});

watch(() => currentZone.value, () => {
  verifyAccess();
});

const onLoginSuccess = () => {
  showLoginModal.value = false;
};

const onLoginClose = () => {
  if (!isWorkzoneAuthenticated(currentZone.value)) {
    router.push('/home');
  }
};

const handleBack = () => {
  router.push('/home');
};

const handleLock = async () => {
  await logoutWorkzone(currentZone.value);
  router.push('/home');
};
</script>
