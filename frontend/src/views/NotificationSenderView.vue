<template>
  <div class="min-h-screen bg-slate-50 font-sans text-slate-800 pb-28">
    <!-- Header -->
    <header class="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 sm:px-6">
      <div class="max-w-4xl mx-auto flex items-center justify-between gap-3">
        <div class="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            @click="router.back()"
            class="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all shrink-0 active:scale-95"
            title="Back"
          >
            <i class="fa-solid fa-arrow-left text-sm"></i>
          </button>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate font-['Clash_Display']">
                Notification Sender
              </h1>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                Broadcast Hub
              </span>
            </div>
            <p class="text-[11px] text-slate-500 font-medium">
              Push alerts to all customers and salesmen with the SBE app
            </p>
          </div>
        </div>

        <button
          @click="loadNotifications"
          class="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all shrink-0"
          title="Refresh"
        >
          <i class="fa-solid fa-rotate text-xs" :class="{ 'animate-spin': loading }"></i>
        </button>
      </div>
    </header>

    <!-- Main Container -->
    <main class="max-w-4xl mx-auto px-4 py-6 sm:px-6 space-y-6">
      <!-- Composer Card -->
      <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div class="px-5 py-4 bg-gradient-to-r from-amber-50/70 via-white to-orange-50/40 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm shadow-amber-500/20">
              <i class="fa-solid fa-bullhorn text-xs"></i>
            </div>
            <h2 class="text-sm sm:text-base font-black text-slate-900 font-['Clash_Display']">
              Compose Push Broadcast
            </h2>
          </div>
        </div>

        <div class="p-5 sm:p-6 space-y-5">
          <!-- Quick Templates -->
          <div>
            <label class="block text-[11px] font-black uppercase text-slate-500 tracking-wider mb-2">
              Quick Templates
            </label>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="tpl in templates"
                :key="tpl.label"
                type="button"
                @click="applyTemplate(tpl)"
                class="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 border border-slate-200/60 transition-all text-left"
              >
                {{ tpl.icon }} {{ tpl.label }}
              </button>
            </div>
          </div>

          <!-- Notification Title Input -->
          <div>
            <label class="block text-[11px] font-black uppercase text-slate-600 tracking-wider mb-1.5">
              Notification Title <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="form.title"
              type="text"
              placeholder="e.g. 🔥 Fresh Paragon School Shoes Dropped in Stock!"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all"
            />
          </div>

          <!-- Notification Body Textarea -->
          <div>
            <label class="block text-[11px] font-black uppercase text-slate-600 tracking-wider mb-1.5">
              Message Body <span class="text-rose-500">*</span>
            </label>
            <textarea
              v-model="form.body"
              rows="3"
              placeholder="e.g. New sizes 6 to 10 now available in warehouse. Tap here to view the latest styles and book your order before stock finishes!"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all resize-none"
            ></textarea>
          </div>

          <!-- Target Brand / Section -->
          <div>
            <label class="block text-[11px] font-black uppercase text-slate-600 tracking-wider mb-1.5">
              Target When Tapped
            </label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                v-for="target in targets"
                :key="target.id"
                type="button"
                @click="form.target = target.id"
                class="px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center justify-center gap-1"
                :class="form.target === target.id ? 'bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-500/20' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'"
              >
                <span>{{ target.icon }}</span>
                <span class="truncate w-full">{{ target.label }}</span>
              </button>
            </div>
          </div>

          <!-- LIVE PREVIEW BANNER -->
          <div>
            <label class="block text-[11px] font-black uppercase text-slate-500 tracking-wider mb-2">
              Android Status Bar Notification Preview
            </label>
            <div class="p-3.5 rounded-2xl bg-slate-900 text-white shadow-xl max-w-md mx-auto border border-slate-800 flex items-start gap-3">
              <div class="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <i class="fa-solid fa-shoe-prints text-xs"></i>
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                  <span class="font-bold tracking-wider uppercase text-amber-400">SBE • now</span>
                  <i class="fa-solid fa-bell text-[9px]"></i>
                </div>
                <h4 class="text-xs font-black text-white leading-tight truncate">
                  {{ form.title || 'Enter a notification title above...' }}
                </h4>
                <p class="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                  {{ form.body || 'Enter message body to see preview here...' }}
                </p>
                <div v-if="form.target" class="mt-2 text-[9px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md inline-block">
                  👉 Taps to {{ getTargetLabel(form.target) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              @click="resetForm"
              class="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Reset
            </button>
            <button
              type="button"
              @click="handleSendBroadcast"
              :disabled="isSending || !form.title.trim() || !form.body.trim()"
              class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black shadow-md shadow-orange-500/25 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              <i v-if="isSending" class="fa-solid fa-spinner fa-spin text-xs"></i>
              <i v-else class="fa-solid fa-paper-plane text-xs"></i>
              <span>{{ isSending ? 'Broadcasting to GitHub...' : 'Broadcast Notification Now' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Past Sent Notifications -->
      <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-clock-rotate-left text-slate-400 text-xs"></i>
            <h3 class="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
              Past Broadcasts ({{ pastNotifications.length }})
            </h3>
          </div>
        </div>

        <div v-if="pastNotifications.length === 0" class="py-8 text-center text-slate-400 text-xs">
          No previous broadcasts sent yet.
        </div>

        <div v-else class="space-y-2.5">
          <div
            v-for="notif in pastNotifications"
            :key="notif.id"
            class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-start justify-between gap-3"
          >
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <h4 class="text-xs font-black text-slate-900 truncate">
                  {{ notif.title }}
                </h4>
                <span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                  {{ getTargetLabel(notif.target) }}
                </span>
              </div>
              <p class="text-[11px] text-slate-600 mt-1 line-clamp-2">
                {{ notif.body }}
              </p>
              <p class="text-[9px] text-slate-400 font-mono mt-1.5">
                Sent: {{ formatTime(notif.timestamp) }}
              </p>
            </div>

            <button
              @click="deleteNotification(notif.id)"
              class="w-7 h-7 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
              title="Delete Broadcast"
            >
              <i class="fa-solid fa-trash-can text-xs"></i>
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { toast } from 'vue3-toastify';
import axios from 'axios';
import { syncDataDualPath } from '@/utils/githubSync';

const router = useRouter();

const loading = ref(false);
const isSending = ref(false);
const pastNotifications = ref([]);

const form = ref({
  title: '',
  body: '',
  target: 'NewArrivals',
});

const targets = [
  { id: 'NewArrivals', label: 'New Arrivals', icon: '🔥' },
  { id: 'Paragon', label: 'Paragon', icon: '👟' },
  { id: 'Cubix', label: 'Cubix', icon: '✨' },
  { id: 'Eeken', label: 'Eeken', icon: '⚡' },
  { id: 'Solea', label: 'Solea', icon: '🌸' },
  { id: 'Ajanta', label: 'Ajanta', icon: '👞' },
  { id: 'Florex', label: 'Florex', icon: '🥿' },
  { id: 'Stock', label: 'Full Catalog', icon: '📦' },
];

const templates = [
  {
    label: 'New Stock Dropped',
    icon: '🔥',
    title: '🔥 Fresh Stock Just Dropped in Warehouse!',
    body: 'New trending models just arrived from company. Tap to browse before sizes run out!',
    target: 'NewArrivals',
  },
  {
    label: 'Paragon Arrival',
    icon: '👟',
    title: '✨ Fresh Paragon Articles Available!',
    body: 'New Paragon designs and running sizes just received. Check out the latest catalog models now.',
    target: 'Paragon',
  },
  {
    label: 'Festival Scheme',
    icon: '🎁',
    title: '🎉 Special Festival Scheme Alert!',
    body: 'Special cash discount scheme valid for orders placed this week. Check rates and place your orders.',
    target: 'Stock',
  },
  {
    label: 'Cubix & Florex Drop',
    icon: '✨',
    title: '🌟 New Cubix & Florex Collection In Stock!',
    body: 'Lightweight comfortable PU models freshly restocked. Tap to view the collection!',
    target: 'Cubix',
  },
];

const applyTemplate = (tpl) => {
  form.value.title = tpl.title;
  form.value.body = tpl.body;
  form.value.target = tpl.target;
};

const resetForm = () => {
  form.value = {
    title: '',
    body: '',
    target: 'NewArrivals',
  };
};

const getTargetLabel = (id) => {
  const found = targets.find((t) => t.id === id);
  return found ? found.label : (id || 'App');
};

const formatTime = (iso) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return iso;
  }
};

const loadNotifications = async () => {
  loading.value = true;
  try {
    const baseUrl = import.meta.env.BASE_URL || '/';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const res = await axios.get(`${cleanBase}assets/notifications.json?t=${Date.now()}`);
    if (Array.isArray(res.data)) {
      pastNotifications.value = res.data.sort((a, b) => b.id - a.id);
    }
  } catch (err) {
    console.warn('Could not load notifications:', err.message);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await loadNotifications();
});

const handleSendBroadcast = async () => {
  if (!form.value.title.trim() || !form.value.body.trim()) {
    toast.error('Please enter title and message body.');
    return;
  }

  isSending.value = true;
  const toastId = toast.loading('Broadcasting notification to GitHub...', { autoClose: false });

  try {
    const newBroadcast = {
      id: Date.now(),
      title: form.value.title.trim(),
      body: form.value.body.trim(),
      target: form.value.target,
      timestamp: new Date().toISOString(),
    };

    const updatedList = [newBroadcast, ...pastNotifications.value];
    const jsonString = JSON.stringify(updatedList, null, 2);
    const commitMessage = `Broadcast notification: "${newBroadcast.title}"`;

    await syncDataDualPath({
      backendEndpoint: '/api/updateNotifications',
      backendPayload: { notifications: updatedList, commitMessage },
      githubFilePathFrontend: 'frontend/public/assets/notifications.json',
      githubFilePathHub: 'sbe-hub/public/assets/notifications.json',
      contentJsonString: jsonString,
      commitMessage,
    });

    pastNotifications.value = updatedList;
    resetForm();
    toast.remove(toastId);
    toast.success('✓ Notification broadcasted successfully!', { autoClose: 3500 });
  } catch (err) {
    console.error('Broadcast failed:', err);
    toast.remove(toastId);
    toast.error(`Broadcast failed: ${err.message}`, { autoClose: 5000 });
  } finally {
    isSending.value = false;
  }
};

const deleteNotification = async (id) => {
  if (!confirm('Are you sure you want to remove this broadcast?')) return;

  const updatedList = pastNotifications.value.filter((n) => n.id !== id);
  const jsonString = JSON.stringify(updatedList, null, 2);
  const commitMessage = `Remove broadcast notification ID ${id}`;

  try {
    await syncDataDualPath({
      backendEndpoint: '/api/updateNotifications',
      backendPayload: { notifications: updatedList, commitMessage },
      githubFilePathFrontend: 'frontend/public/assets/notifications.json',
      githubFilePathHub: 'sbe-hub/public/assets/notifications.json',
      contentJsonString: jsonString,
      commitMessage,
    });
    pastNotifications.value = updatedList;
    toast.info('Broadcast removed.');
  } catch (err) {
    toast.error('Failed to delete broadcast: ' + err.message);
  }
};
</script>
