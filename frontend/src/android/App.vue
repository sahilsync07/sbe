<template>
  <div class="min-h-screen bg-background">
    <!-- Mobile Layout (Android/Small Screen) -->
    <div v-if="isMobileLayout" class="pb-20"> <!-- Padding for bottom nav -->
      <AppHeader 
        v-if="showHeader"
        :cart-item-count="cartCount"
        :search-query="store.searchQuery"
        :is-admin="store.isAdmin"
        :last-sync-time="store.lastSyncTime"
        @menu-click="toggleMobileSidebar"
        @cart-click="toggleMobileCart"
        @search-change="updateSearch"
        @admin-toggle="toggleAdmin"
      />

      <main class="w-full">
         <router-view></router-view>
      </main>

      <BottomNavigation 
        :active-tab="currentTab"
        :is-admin="store.isAdmin"
        @tab-change="handleTabChange"
        @brands-click="handleBrandsClick"
      />
    </div>

    <!-- Desktop/Default Layout -->
    <div v-else>
       <router-view></router-view>
    </div>
  </div>
</template>



<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import AppHeader from './components/Header.vue';
import BottomNavigation from './components/BottomNavigation.vue';
import { store, cartTotalItems } from './store';

const router = useRouter();
const route = useRoute();

const isMobileLayout = ref(false);

const cartCount = computed(() => cartTotalItems.value);
const currentTab = computed(() => {
  if (route.path === '/pdf-gen') return 'pdf-gen';
  if (route.path === '/') return 'home';
  if (route.path === '/profile') return 'profile';
  return 'home';
});

const showHeader = computed(() => {
    // Only show header on Home page ('/') and NOT when sidebar (brands) is open
    return route.path === '/' && !store.isSidebarOpen;
});

const updateSearch = (val) => {
  store.searchQuery = val;
};

const toggleAdmin = () => {
  store.isAdmin = !store.isAdmin;
};

const toggleMobileSidebar = () => {
    store.isSidebarOpen = !store.isSidebarOpen;
};

const toggleMobileCart = () => {
    store.isCartOpen = !store.isCartOpen;
};

const handleTabChange = (tabId) => {
    if (tabId === 'home') router.push('/');
    if (tabId === 'pdf-gen') router.push('/pdf-gen');
    // profile etc.
};

const handleBrandsClick = () => {
     toggleMobileSidebar();
};

let backListener = null;

onMounted(async () => {
  checkLayout();
  window.addEventListener('resize', checkLayout);
  
  // Hardware Back Button Handling
  if (Capacitor.getPlatform() === 'android') {
      backListener = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
          if (store.isSidebarOpen) {
              store.isSidebarOpen = false;
          } else if (store.isCartOpen) {
              store.isCartOpen = false;
          } else if (canGoBack) {
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

const checkLayout = () => {
    // "purely for android" - strictly speaking Capacitor platform
    // But for debugging "localhost:3000", we should check width or a forced flag
    if (Capacitor.getPlatform() === 'android' || window.innerWidth < 768) {
        isMobileLayout.value = true;
        store.isMobile = true;
    } else {
        isMobileLayout.value = false;
        store.isMobile = false;
    }

    // Force enable for testing if URL param ?mobile=true
    if (new URLSearchParams(window.location.search).get('mobile')) {
        isMobileLayout.value = true;
        store.isMobile = true;
    }
};

</script>
