<template>
  <img 
    :src="displaySrc" 
    :alt="alt"
    loading="lazy"
    decoding="async"
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
  const nativeUri = await getLocalImageUri(keyToCheck, props.src);
  if (nativeUri) {
    displaySrc.value = nativeUri;
    return;
  }

  // 2. Try Web API Cache
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      let cachedResponse = await cache.match(props.src);
      if (!cachedResponse && props.cacheKey) {
        cachedResponse = await cache.match(props.cacheKey);
      }
      
      if (cachedResponse) {
        const blob = await cachedResponse.blob();
        objectUrl.value = URL.createObjectURL(blob);
        displaySrc.value = objectUrl.value;
        return;
      }
    } catch (e) {
      // Non-fatal cache lookup fallback
    }
  }

  // 3. Fallback to network (and cache in background for next view)
  displaySrc.value = props.src;

  if (typeof window !== 'undefined' && 'caches' in window && props.src.startsWith('http')) {
    fetch(props.src, { mode: 'cors' }).then(async (res) => {
      if (res.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(props.src, res);
      }
    }).catch(() => {});
  }
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
