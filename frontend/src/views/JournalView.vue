<template>
  <div class="journal-wrapper">
    <!-- Top Navigation Header -->
    <header class="journal-header">
      <div class="header-left">
        <button class="back-btn" @click="handleBack" title="Back to Dashboard">
          <i class="fa-solid fa-arrow-left"></i>
          <span>Back</span>
        </button>
        <div class="header-brand">
          <span class="badge-gold">ENGINEERING JOURNAL</span>
          <span class="header-title">Architecture Ledger & AI Master Guide</span>
        </div>
      </div>
      <div class="header-right">
        <a :href="journalUrl" target="_blank" class="nav-action-btn" title="Open in New Tab">
          <i class="fa-solid fa-arrow-up-right-from-square"></i>
          <span class="desktop-only">Fullscreen</span>
        </a>
      </div>
    </header>

    <!-- Content Iframe -->
    <div class="journal-frame-container">
      <iframe
        :src="journalUrl"
        class="journal-iframe"
        title="SBE Engineering & Operations Journal"
        frameborder="0"
      ></iframe>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const baseUrl = import.meta.env.BASE_URL || '/';
const journalUrl = computed(() => {
  if (!baseUrl || baseUrl === './' || baseUrl === '.') {
    return 'journal/index.html';
  }
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${cleanBase}journal/index.html`;
});

const handleBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/');
  }
};
</script>

<style scoped>
.journal-wrapper {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background-color: #090d16;
}

.journal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: rgba(17, 24, 39, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 50;
  height: 52px;
  box-sizing: border-box;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  color: #f1f5f9;
  border: 1px solid rgba(255, 255, 255, 0.15);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.18);
  transform: translateY(-1px);
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.badge-gold {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  padding: 3px 8px;
  border-radius: 9999px;
  background: rgba(197, 155, 39, 0.2);
  border: 1px solid rgba(197, 155, 39, 0.4);
  color: #fbbf24;
}

.header-title {
  color: #e2e8f0;
  font-size: 13.5px;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(197, 155, 39, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(197, 155, 39, 0.3);
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
}

.nav-action-btn:hover {
  background: rgba(197, 155, 39, 0.25);
}

.journal-frame-container {
  flex: 1;
  width: 100%;
  height: calc(100vh - 52px);
  margin: 0;
  padding: 0;
  overflow: hidden;
  background-color: #090d16;
}

.journal-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

@media (max-width: 640px) {
  .desktop-only {
    display: none;
  }
  .header-title {
    display: none;
  }
}
</style>
