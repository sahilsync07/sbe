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

const { checkAdminState } = useAdmin();

onMounted(async () => {
  // 1. Ensure admin state is loaded natively
  await checkAdminState();
  
  // 2. Schedule daily morning push notifications (only if Admin)
  await setupDailySyncNotification();
  
  // 3. Trigger immediate background delta sync (only if Admin)
  await performDeltaSync();
});
</script>
