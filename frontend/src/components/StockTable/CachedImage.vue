<template>
  <img 
    :src="displaySrc" 
    :alt="alt"
    @error="handleError"
  />
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  src: String,
  alt: String,
  cacheKey: String
});

const displaySrc = ref(props.src);
const objectUrl = ref(null);

const CACHE_NAME = 'sbe-images-v1';

const loadImage = async () => {
  if (!props.src) return;

  // Cleanup previous object URL if exists
  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value);
    objectUrl.value = null;
  }

  // 1. Try Cache API first
  if ('caches' in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      
      // Check cacheKey first (e.g. low-res cached version), then src
      const keyToCheck = props.cacheKey || props.src;
      const cachedResponse = await cache.match(keyToCheck);
      
      if (cachedResponse) {
        const blob = await cachedResponse.blob();
        objectUrl.value = URL.createObjectURL(blob);
        displaySrc.value = objectUrl.value;
        return;
      }
    } catch (e) {
      console.warn('Cache check failed', e);
    }
  }

  // 2. Fallback to network (default behavior)
  displaySrc.value = props.src;
};

const handleError = () => {
  // If blob URL fails, try original URL as last resort
  if (displaySrc.value !== props.src) {
    displaySrc.value = props.src;
  }
};

watch(() => props.src, loadImage);

onMounted(loadImage);

onBeforeUnmount(() => {
  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value);
  }
});
</script>
