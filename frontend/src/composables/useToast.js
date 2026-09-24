import { ref } from 'vue';

// Global reactive toasts list
export const toasts = ref([]);

let idCounter = 0;

/**
 * Remove a toast by id
 * @param {string|number} id 
 */
export function removeToast(id) {
  const index = toasts.value.findIndex(t => t.id === id);
  if (index !== -1) {
    const toastItem = toasts.value[index];
    if (toastItem.timerId) {
      clearTimeout(toastItem.timerId);
    }
    toasts.value.splice(index, 1);
  }
}

/**
 * Clear all toasts
 */
export function clearAllToasts() {
  toasts.value.forEach(t => {
    if (t.timerId) clearTimeout(t.timerId);
  });
  toasts.value = [];
}

/**
 * Create or update a toast
 * @param {string} message 
 * @param {Object} options 
 * @param {string} [type='default']
 * @returns {string|number} toastId
 */
function createToast(message, options = {}, type = 'default') {
  const customId = options.toastId;
  const id = customId || `toast_${++idCounter}_${Date.now()}`;

  // If a toast with this ID already exists, update it
  const existingIndex = toasts.value.findIndex(t => t.id === id);
  if (existingIndex !== -1) {
    const existing = toasts.value[existingIndex];
    if (existing.timerId) clearTimeout(existing.timerId);
    toasts.value.splice(existingIndex, 1);
  }

  // Determine autoClose duration: default 3000ms (3s)
  let duration = 3000;
  if (type === 'loading') {
    duration = 0; // Loading doesn't auto-close by default
  }
  if (options.autoClose === false || options.autoClose === 0) {
    duration = 0;
  } else if (typeof options.autoClose === 'number') {
    duration = options.autoClose;
  }

  const toastItem = {
    id,
    message: String(message || ''),
    type,
    duration,
    remainingTime: duration,
    startTime: Date.now(),
    closeButton: options.closeButton !== false,
    timerId: null,
    isPaused: false
  };

  // Setup auto-close timer if duration > 0
  if (duration > 0) {
    toastItem.timerId = setTimeout(() => {
      removeToast(id);
    }, duration);
  }

  // Add toast to the reactive list (newest at bottom of stack)
  toasts.value.push(toastItem);

  // Return the id for chaining / removal
  return id;
}

export function pauseToast(id) {
  const toastItem = toasts.value.find(t => t.id === id);
  if (!toastItem || toastItem.duration <= 0 || toastItem.isPaused) return;

  clearTimeout(toastItem.timerId);
  const elapsed = Date.now() - toastItem.startTime;
  toastItem.remainingTime = Math.max(0, toastItem.remainingTime - elapsed);
  toastItem.isPaused = true;
}

export function resumeToast(id) {
  const toastItem = toasts.value.find(t => t.id === id);
  if (!toastItem || toastItem.duration <= 0 || !toastItem.isPaused) return;

  toastItem.isPaused = false;
  toastItem.startTime = Date.now();
  toastItem.timerId = setTimeout(() => {
    removeToast(id);
  }, toastItem.remainingTime);
}

/**
 * Toast callable object matching vue3-toastify API
 */
export const toast = function (message, options = {}) {
  return createToast(message, options, options.type || 'default');
};

toast.success = (message, options = {}) => createToast(message, options, 'success');
toast.error = (message, options = {}) => createToast(message, options, 'error');
toast.info = (message, options = {}) => createToast(message, options, 'info');
toast.warning = (message, options = {}) => createToast(message, options, 'warning');
toast.warn = (message, options = {}) => createToast(message, options, 'warning');
toast.loading = (message, options = {}) => createToast(message, options, 'loading');
toast.remove = (id) => removeToast(id);
toast.clearAll = () => clearAllToasts();
toast.isActive = (id) => toasts.value.some(t => t.id === id);
toast.update = (id, options = {}) => {
  const item = toasts.value.find(t => t.id === id);
  if (item) {
    if (options.render) item.message = options.render;
    if (options.message) item.message = options.message;
    if (options.type) item.type = options.type;
    if (options.autoClose !== undefined) {
      if (item.timerId) clearTimeout(item.timerId);
      const newDuration = typeof options.autoClose === 'number' ? options.autoClose : 3000;
      item.duration = newDuration;
      item.remainingTime = newDuration;
      item.startTime = Date.now();
      if (newDuration > 0) {
        item.timerId = setTimeout(() => removeToast(id), newDuration);
      }
    }
  }
};

/**
 * Vue plugin installer for app.use(Vue3Toasty, options)
 */
export const ToastPlugin = {
  install(app, options = {}) {
    app.config.globalProperties.$toast = toast;
    app.provide('toast', toast);
  }
};

export default ToastPlugin;
