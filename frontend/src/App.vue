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
