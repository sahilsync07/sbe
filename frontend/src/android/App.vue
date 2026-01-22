<template>
  <div class="min-h-screen bg-background pt-[var(--ion-safe-area-top,20px)]">
      <router-view></router-view>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

const router = useRouter();
let backListener = null;

onMounted(async () => {
  // Hardware Back Button Handling
  if (Capacitor.getPlatform() === 'android') {
      backListener = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
              router.back();
          } else {
              CapacitorApp.exitApp();
          }
      });
  }
});

onUnmounted(() => {
    if (backListener) {
        backListener.remove();
    }
});
</script>

