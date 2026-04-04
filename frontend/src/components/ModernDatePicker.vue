<template>
  <div ref="rootRef" class="relative z-[85]">
    <button
      type="button"
      class="daybook-date-pill flex w-full items-center gap-2 rounded-full py-1.5 pl-2 pr-2 text-left transition-shadow duration-200 sm:w-auto sm:gap-3 sm:py-2 sm:pl-4 sm:pr-5"
      :class="{ 'ring-2 ring-emerald-400/50 ring-offset-1 ring-offset-transparent sm:ring-offset-2': open }"
      @click="open = !open"
    >
      <span class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-sm text-white shadow-md shadow-emerald-500/30 sm:h-11 sm:w-11 sm:text-lg sm:shadow-lg">
        <i class="fa-regular fa-calendar text-[13px] sm:text-base"></i>
      </span>
      <div class="min-w-0 flex-1 pr-1 sm:flex-initial sm:pr-0">
        <span class="block text-[10px] font-medium text-emerald-700/90 sm:text-xs">Pick a date</span>
        <span class="mt-0 block text-[13px] font-semibold tabular-nums text-slate-950 sm:mt-0.5 sm:text-[15px]">{{ displayValue }}</span>
      </div>
      <span class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 sm:h-8 sm:w-8">
        <i class="fa-solid fa-chevron-down text-[10px] transition-transform duration-200 sm:text-xs" :class="{ 'rotate-180': open }"></i>
      </span>
    </button>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="scale-95 opacity-0 -translate-y-1"
      enter-to-class="scale-100 opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="scale-100 opacity-100"
      leave-to-class="scale-95 opacity-0"
    >
      <div
        v-if="open"
        class="calendar-popover absolute left-0 right-0 top-[calc(100%+8px)] mx-auto w-full max-w-[18rem] sm:left-auto sm:right-0 sm:top-[calc(100%+10px)] sm:mx-0 sm:max-w-none sm:w-[min(100vw-2rem,19rem)]"
      >
        <div class="calendar-popover-inner overflow-hidden rounded-2xl p-3 shadow-2xl sm:rounded-[1.5rem] sm:p-5">
          <!-- Month nav -->
          <div class="mb-3 flex items-center justify-between gap-2 sm:mb-4">
            <button
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-emerald-100 hover:text-emerald-800 active:scale-95 sm:h-10 sm:w-10"
              aria-label="Previous month"
              @click="shiftMonth(-1)"
            >
              <i class="fa-solid fa-chevron-left text-xs sm:text-sm"></i>
            </button>
            <div class="min-w-0 flex-1 text-center">
              <p class="truncate text-sm font-semibold tracking-tight text-slate-900 sm:text-base">{{ monthTitle }}</p>
            </div>
            <button
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-emerald-100 hover:text-emerald-800 active:scale-95 sm:h-10 sm:w-10"
              aria-label="Next month"
              @click="shiftMonth(1)"
            >
              <i class="fa-solid fa-chevron-right text-xs sm:text-sm"></i>
            </button>
          </div>

          <!-- Weekday row -->
          <div class="mb-1.5 grid grid-cols-7 gap-0.5 text-center sm:mb-2 sm:gap-1">
            <span
              v-for="w in weekdays"
              :key="w"
              class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:text-[11px]"
            >{{ w }}</span>
          </div>

          <!-- Days -->
          <div class="grid grid-cols-7 gap-0.5 sm:gap-1">
            <button
              v-for="(cell, idx) in cells"
              :key="idx"
              type="button"
              :disabled="!cell.inMonth"
              class="relative flex h-8 w-full items-center justify-center rounded-lg text-xs font-medium transition-all duration-150 sm:h-10 sm:rounded-xl sm:text-sm"
              :class="cellButtonClass(cell)"
              @click="selectCell(cell)"
            >
              <span class="tabular-nums">{{ cell.day }}</span>
            </button>
          </div>

          <div class="mt-3 flex items-center justify-between gap-2 border-t border-emerald-100/60 pt-3 sm:mt-4 sm:pt-4">
            <button
              type="button"
              class="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 sm:px-4 sm:py-2 sm:text-sm"
              @click="open = false"
            >
              Close
            </button>
            <button
              type="button"
              class="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-500/25 transition-transform hover:brightness-105 active:scale-[0.98] sm:px-5 sm:py-2 sm:text-sm sm:shadow-lg"
              @click="pickToday"
            >
              Today
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { onClickOutside, onKeyStroke } from '@vueuse/core';

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['update:modelValue']);

const rootRef = ref(null);
const open = ref(false);

const viewYear = ref(new Date().getFullYear());
const viewMonth = ref(new Date().getMonth() + 1);

function parseIsoLocal(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  }
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toIsoLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function sameLocalDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const displayValue = computed(() => {
  const d = parseIsoLocal(props.modelValue);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
});

const monthTitle = computed(() => {
  const d = new Date(viewYear.value, viewMonth.value - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
});

const cells = computed(() => {
  const y = viewYear.value;
  const m = viewMonth.value;
  const first = new Date(y, m - 1, 1);
  const startPad = first.getDay();
  const firstIndex = 1 - startPad;
  const out = [];
  const today = new Date();
  const selected = parseIsoLocal(props.modelValue);

  for (let i = 0; i < 42; i++) {
    const d = new Date(y, m - 1, firstIndex + i);
    const inMonth = d.getMonth() === m - 1;
    out.push({
      day: d.getDate(),
      inMonth,
      date: d,
      iso: toIsoLocal(d),
      isToday: sameLocalDay(d, today),
      isSelected: sameLocalDay(d, selected)
    });
  }
  return out;
});

function cellButtonClass(cell) {
  if (!cell.inMonth) {
    return 'cursor-default text-slate-300 opacity-35';
  }
  if (cell.isSelected) {
    return 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/35 scale-[1.02] z-[1]';
  }
  if (cell.isToday) {
    return 'bg-emerald-50 text-emerald-800 ring-2 ring-emerald-400/40 hover:bg-emerald-100';
  }
  return 'text-slate-700 hover:bg-emerald-50/80 hover:text-emerald-900 active:scale-95';
}

function selectCell(cell) {
  if (!cell.inMonth) return;
  emit('update:modelValue', cell.iso);
  open.value = false;
}

function shiftMonth(delta) {
  let m = viewMonth.value + delta;
  let y = viewYear.value;
  if (m < 1) {
    m = 12;
    y -= 1;
  } else if (m > 12) {
    m = 1;
    y += 1;
  }
  viewMonth.value = m;
  viewYear.value = y;
}

function pickToday() {
  const t = new Date();
  emit('update:modelValue', toIsoLocal(t));
  viewYear.value = t.getFullYear();
  viewMonth.value = t.getMonth() + 1;
  open.value = false;
}

watch(
  () => open.value,
  (isOpen) => {
    if (isOpen) {
      const d = parseIsoLocal(props.modelValue);
      viewYear.value = d.getFullYear();
      viewMonth.value = d.getMonth() + 1;
    }
  }
);

watch(
  () => props.modelValue,
  () => {
    if (!open.value) {
      const d = parseIsoLocal(props.modelValue);
      viewYear.value = d.getFullYear();
      viewMonth.value = d.getMonth() + 1;
    }
  }
);

onClickOutside(rootRef, () => {
  open.value = false;
});

onKeyStroke('Escape', () => {
  if (open.value) open.value = false;
});
</script>

<style scoped>
.daybook-date-pill {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 6px 24px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(167, 243, 208, 0.5);
}
.daybook-date-pill:hover {
  box-shadow: 0 10px 28px rgba(16, 185, 129, 0.12), 0 0 0 1px rgba(110, 231, 183, 0.55);
}
.daybook-date-pill:focus-visible {
  outline: none;
  box-shadow: 0 10px 32px rgba(16, 185, 129, 0.15), 0 0 0 3px rgba(52, 211, 153, 0.35);
}

.calendar-popover-inner {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  border: 1px solid rgba(167, 243, 208, 0.55);
  box-shadow:
    0 28px 64px -16px rgba(15, 23, 42, 0.18),
    0 0 0 1px rgba(255, 255, 255, 0.8) inset;
}
</style>
