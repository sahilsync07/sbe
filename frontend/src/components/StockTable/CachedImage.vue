<template>
  <img 
    :src="displaySrc" 
    :alt="alt"
    @error="handleError"
  />
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { getLocalImageUri } from '../../utils/nativeCache';

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

  const keyToCheck = props.cacheKey || props.src;

  // 1. Try Native App Data Cache first (Zero Latency if already Delta Synced)
  const nativeUri = await getLocalImageUri(keyToCheck);
  if (nativeUri) {
    displaySrc.value = nativeUri;
    return;
  }

  // 2. Try Web API Cache
  if ('caches' in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(keyToCheck);
      
      if (cachedResponse) {
        const blob = await cachedResponse.blob();
        objectUrl.value = URL.createObjectURL(blob);
        displaySrc.value = objectUrl.value;
        return;
      }
    } catch (e) {
      console.warn('Web Cache check failed', e);
    }
  }

  // 3. Fallback to network
  displaySrc.value = props.src;
};

const handleError = () => {
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
