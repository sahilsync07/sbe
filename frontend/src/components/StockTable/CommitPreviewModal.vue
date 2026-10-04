<template>
  <transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="show"
      class="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
      @click.self="$emit('close')"
    >
      <div
        class="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up"
      >
        <!-- Modal Header -->
        <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/80 via-white to-amber-50/40">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              <i class="fa-solid fa-code-commit text-sm"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-base sm:text-lg font-black font-['Clash_Display'] text-slate-900 tracking-tight">
                  Commit Preview
                </h3>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {{ pendingUploads.length }} Staged
                </span>
              </div>
              <p class="text-[11px] text-slate-500 font-medium">
                Hold photos in session to avoid GitHub lock collisions
              </p>
            </div>
          </div>

          <button
            @click="$emit('close')"
            class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Close"
          >
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        <!-- Banner Info -->
        <div class="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2 text-xs text-slate-600">
          <i class="fa-solid fa-cloud-arrow-up text-emerald-600 text-xs shrink-0"></i>
          <span class="leading-relaxed">
            Photos are saved to Cloudinary. Ready to push all <strong>{{ pendingUploads.length }}</strong> changes to GitHub in a single commit.
          </span>
        </div>

        <!-- Staged Items List -->
        <div class="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[140px] max-h-[45vh]">
          <div
            v-if="pendingUploads.length === 0"
            class="py-12 text-center text-slate-400 flex flex-col items-center justify-center"
          >
            <i class="fa-solid fa-circle-check text-3xl text-emerald-400 mb-2"></i>
            <p class="text-sm font-bold text-slate-600">All changes committed!</p>
            <p class="text-xs text-slate-400 mt-0.5">No pending uploads held in this session.</p>
          </div>

          <div
            v-for="item in pendingUploads"
            :key="item.productName"
            class="flex items-center gap-3 p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all group"
          >
            <!-- Thumbnail -->
            <div class="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/60 overflow-hidden shrink-0 flex items-center justify-center">
              <img
                v-if="item.imageUrl"
                :src="item.imageUrl"
                :alt="item.productName"
                class="w-full h-full object-cover"
              />
              <div v-else class="text-rose-400 flex flex-col items-center">
                <i class="fa-solid fa-trash-can text-xs"></i>
                <span class="text-[8px] font-bold uppercase mt-0.5">Removed</span>
              </div>
            </div>

            <!-- Product Details -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5">
                <h4 class="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  {{ item.productName }}
                </h4>
              </div>
              <div class="flex items-center gap-2 mt-0.5">
                <span
                  class="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md"
                  :class="item.imageUrl ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'"
                >
                  {{ item.imageUrl ? 'Photo Added' : 'Photo Removed' }}
                </span>
                <span v-if="item.groupName" class="text-[10px] text-slate-400 font-medium truncate">
                  {{ item.groupName }}
                </span>
                <span class="text-[10px] text-slate-400 font-mono ml-auto shrink-0">
                  {{ formatTime(item.timestamp) }}
                </span>
              </div>
            </div>

            <!-- Discard Single Item Button -->
            <button
              @click="discardPendingUpload(item.productName)"
              class="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
              title="Discard this staged change"
            >
              <i class="fa-solid fa-xmark text-xs"></i>
            </button>
          </div>
        </div>

        <!-- Commit Message Input -->
        <div class="px-5 py-3 bg-slate-50/80 border-t border-slate-100">
          <label class="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5">
            Default Commit Message
          </label>
          <div class="flex items-center gap-2">
            <input
              v-model="customCommitMessage"
              type="text"
              :placeholder="computedDefaultMessage"
              class="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-xs"
            />
            <button
              v-if="customCommitMessage"
              @click="customCommitMessage = ''"
              class="px-2 py-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-600 bg-white border border-slate-200 rounded-xl shrink-0"
              title="Reset to default message"
            >
              Reset
            </button>
          </div>
        </div>

        <!-- Modal Footer Actions -->
        <div class="px-5 py-3.5 bg-white border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            @click="handleDiscardAll"
            :disabled="isCommitting || pendingUploads.length === 0"
            class="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            Discard All
          </button>

          <div class="flex items-center gap-2">
            <button
              @click="$emit('close')"
              :disabled="isCommitting"
              class="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Keep Staging
            </button>

            <button
              @click="handleCommit"
              :disabled="isCommitting || pendingUploads.length === 0"
              class="px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-95 text-white text-xs font-black shadow-md shadow-emerald-700/25 flex items-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              <i v-if="isCommitting" class="fa-solid fa-spinner fa-spin text-xs"></i>
              <i v-else class="fa-solid fa-cloud-arrow-up text-xs"></i>
              <span>{{ isCommitting ? 'Pushing to GitHub...' : `Commit & Push (${pendingUploads.length})` }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStockData } from '../../composables/useStockData';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'committed']);

const { pendingUploads, discardPendingUpload, clearPendingUploads, commitPendingUploadsToGitHub } = useStockData();

const isCommitting = ref(false);
const customCommitMessage = ref('');

const computedDefaultMessage = computed(() => {
  const count = pendingUploads.value.length;
  if (count === 0) return 'Upload photos';
  const names = pendingUploads.value.map(u => u.productName).slice(0, 3).join(', ');
  const more = count > 3 ? ` +${count - 3} more` : '';
  return `Upload photos for ${count} article${count > 1 ? 's' : ''} (${names}${more})`;
});

const formatTime = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const handleDiscardAll = () => {
  if (confirm(`Discard all ${pendingUploads.value.length} pending photo uploads and revert changes?`)) {
    clearPendingUploads(true);
    emit('close');
  }
};

const handleCommit = async () => {
  if (pendingUploads.value.length === 0) return;
  isCommitting.value = true;
  try {
    const msg = customCommitMessage.value.trim() || computedDefaultMessage.value;
    const res = await commitPendingUploadsToGitHub(msg);
    if (res && res.success) {
      customCommitMessage.value = '';
      emit('committed');
      emit('close');
    }
  } finally {
    isCommitting.value = false;
  }
};
</script>
