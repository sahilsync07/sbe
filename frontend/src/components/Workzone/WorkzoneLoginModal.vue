<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div v-if="show" class="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="$emit('close')"></div>

      <!-- Modal Card -->
      <div class="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-6 sm:p-7">
        <!-- Close Button -->
        <button
          @click="$emit('close')"
          class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
        >
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>

        <!-- Header Icon & Titles -->
        <div class="flex items-center gap-3.5 mb-5">
          <div
            class="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-md"
            :class="isSahil ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-amber-500/20' : 'bg-gradient-to-br from-teal-500 to-emerald-700 text-white shadow-teal-500/20'"
          >
            <i :class="isSahil ? 'fa-solid fa-user-tie' : 'fa-solid fa-building-shield'"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-xl font-black font-['Clash_Display'] text-slate-900 leading-none">
                {{ isSahil ? "Sahil Workzone" : "SLNP Workzone" }}
              </h3>
              <span
                class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                :class="isSahil ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'"
              >
                Private
              </span>
            </div>
            <p class="text-xs text-slate-500 font-medium mt-1">
              {{ isSahil ? "Executive workspace & operations" : "Management controls & reports" }}
            </p>
          </div>
        </div>

        <!-- Password Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Workzone Password
            </label>
            <div class="relative">
              <input
                ref="passwordInput"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Enter password"
                autocomplete="current-password"
                autocapitalize="off"
                spellcheck="false"
                class="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all font-semibold text-slate-800 placeholder:text-slate-400 pr-12 text-sm"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <i :class="['fa-solid', showPassword ? 'fa-eye-slash' : 'fa-eye']"></i>
              </button>
            </div>
          </div>

          <!-- Buttons -->
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              @click="$emit('close')"
              class="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-colors text-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="!password"
              class="flex-1 py-3 px-4 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 text-sm disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              :class="isSahil ? 'bg-slate-900 hover:bg-black shadow-slate-900/20' : 'bg-teal-700 hover:bg-teal-800 shadow-teal-700/20'"
            >
              Unlock Access
            </button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, nextTick } from "vue";
import { useWorkzoneAuth } from "@/composables/useWorkzoneAuth";

const props = defineProps({
  show: Boolean,
  zone: {
    type: String,
    default: "sahil"
  }
});

const emit = defineEmits(["close", "success"]);

const { loginWorkzone } = useWorkzoneAuth();

const password = ref("");
const showPassword = ref(false);
const passwordInput = ref(null);

const isSahil = computed(() => (props.zone || "sahil").toLowerCase() === "sahil");

watch(() => props.show, (newVal) => {
  if (newVal) {
    password.value = "";
    showPassword.value = false;
    nextTick(() => {
      passwordInput.value?.focus();
    });
  }
});

const handleSubmit = async () => {
  if (!password.value) return;
  const ok = await loginWorkzone(props.zone, password.value);
  if (ok) {
    emit("success", props.zone);
    emit("close");
  }
};
</script>
