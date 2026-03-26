<template>
  <div class="min-h-screen">
    <router-view></router-view>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useAdmin } from './composables/useAdmin';
import { performDeltaSync } from './utils/nativeCache';
import { setupDailySyncNotification } from './utils/notifications';
import { Capacitor } from '@capacitor/core';
import { AppUpdate } from '@capawesome/capacitor-app-update';

const { checkAdminState } = useAdmin();

onMounted(async () => {
  // 1. Ensure admin state is loaded natively
  await checkAdminState();
  
  // 2. Schedule daily morning push notifications (only if Admin)
  await setupDailySyncNotification();
  
  // 3. Trigger immediate background delta sync (only if Admin)
  await performDeltaSync();

  // 4. Check for in-app updates via Play Store
  if (Capacitor.isNativePlatform()) {
    try {
      const info = await AppUpdate.getAppUpdateInfo();
      // updateAvailability: 1 = Not available, 2 = Available, 3 = In progress
      if (info.updateAvailability === 2) {
        if (info.immediateUpdateAllowed) {
          await AppUpdate.performImmediateUpdate();
        } else if (info.flexibleUpdateAllowed) {
          await AppUpdate.performFlexibleUpdate();
        }
      }
    } catch (error) {
      console.warn('App Update Check Failed:', error);
    }
  }
});
</script>

<style>
/* ==========================================================
   MODERN TOAST OVERRIDES (CSS Variables Strategy)
   This targets the library's internal variables for 100% reliability
   ========================================================== */
:root {
  --toastify-toast-width: auto !important;
  --toastify-toast-min-height: 48px !important;
  --toastify-toast-max-height: 800px !important;
  --toastify-toast-bd-radius: 99px !important; /* Mobile Pill */
  --toastify-font-family: inherit !important;
  --toastify-z-index: 999999 !important;
  --toastify-text-color-light: #f8fafc !important;
  --toastify-text-color-dark: #f8fafc !important;
  --toastify-color-light: rgba(15, 23, 42, 0.95) !important;
  --toastify-color-dark: rgba(15, 23, 42, 0.95) !important;
  --toastify-color-info: rgba(15, 23, 42, 0.95) !important;
  --toastify-color-success: rgba(15, 23, 42, 0.95) !important;
  --toastify-color-warning: rgba(15, 23, 42, 0.95) !important;
  --toastify-color-error: rgba(15, 23, 42, 0.95) !important;
  --toastify-icon-color-success: #22c55e !important; /* Green */
}

/* Container Adjustments */
.Vue3Toastify__toast-container {
  padding: 0 !important;
  pointer-events: none !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 12px !important;
}

@media (max-width: 640px) {
  .Vue3Toastify__toast-container {
    bottom: max(env(safe-area-inset-bottom, 32px), 32px) !important;
    left: 0 !important;
    right: 0 !important;
    width: 100% !important;
    align-items: center !important;
    transform: none !important;
    z-index: 999999 !important;
  }
  .Vue3Toastify__toast {
    margin: 0 auto !important;
    border-radius: 99px !important; /* Force Pill on Mobile */
  }
}

@media (min-width: 641px) {
  .Vue3Toastify__toast-container--bottom-right {
    bottom: 32px !important;
    right: 32px !important;
    width: 320px !important;
  }
  .Vue3Toastify__toast {
    border-radius: 16px !important; /* Modern Rect on PC */
    width: 100% !important;
  }
}

/* The Toast Body Polish */
.Vue3Toastify__toast {
  pointer-events: auto !important;
  padding: 10px 24px !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 
              0 0 0 1px rgba(255, 255, 255, 0.1) inset !important;
  backdrop-filter: blur(24px) saturate(200%) !important;
  -webkit-backdrop-filter: blur(24px) saturate(200%) !important;
  border: none !important;
  margin-bottom: 8px !important;
  display: inline-flex !important;
}

/* Hide Unnecessary Elements */
.Vue3Toastify__progress-bar,
.Vue3Toastify__close-button {
  display: none !important;
}

/* Animations */
.Vue3Toastify__toast {
  animation: toast-spring-up 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards !important;
}

@keyframes toast-spring-up {
  0% { transform: translateY(100px) scale(0.85); opacity: 0; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}
</style>
