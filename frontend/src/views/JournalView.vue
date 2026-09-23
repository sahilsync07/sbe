<template>
  <div class="journal-frame-container">
    <iframe
      :src="journalUrl"
      class="journal-iframe"
      title="SBE Engineering & Operations Journal"
      frameborder="0"
    ></iframe>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const baseUrl = import.meta.env.BASE_URL || '/';
const journalUrl = computed(() => {
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${cleanBase}journal/index.html`;
});
</script>

<style scoped>
.journal-frame-container {
  width: 100vw;
  height: 100vh;
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
</style>
