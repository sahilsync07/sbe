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

  // 3. Fallback to network (Service Worker handles caching on-demand when visible)
  displaySrc.value = props.src;
};

const triedUrls = ref(new Set());

const handleError = () => {
  if (!displaySrc.value) return;
  triedUrls.value.add(displaySrc.value);

  const primaryCloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dg365ewal';
  const secondaryCloud = import.meta.env.VITE_CLOUDINARY_SECONDARY_CLOUD_NAME || 'dieqsg5tr';

  // 1. If CDN URL (wsrv.nl) failed, fallback immediately to direct Cloudinary URL
  if (displaySrc.value.includes('wsrv.nl')) {
    const match = displaySrc.value.match(/url=([^&]+)/);
    if (match) {
      let rawUrl = decodeURIComponent(match[1]);
      if (!rawUrl.startsWith('http')) rawUrl = 'https://' + rawUrl;
      if (!triedUrls.value.has(rawUrl)) {
        displaySrc.value = rawUrl;
        return;
      }
    }
  }

  // 2. Dual-Cloud Failover: If current cloud fails (e.g. account suspended/disabled), try the other cloud
  if (displaySrc.value.includes(`/${primaryCloud}/`)) {
    const altUrl = displaySrc.value.replace(`/${primaryCloud}/`, `/${secondaryCloud}/`);
    if (!triedUrls.value.has(altUrl)) {
      displaySrc.value = altUrl;
      return;
    }
  } else if (displaySrc.value.includes(`/${secondaryCloud}/`)) {
    const altUrl = displaySrc.value.replace(`/${secondaryCloud}/`, `/${primaryCloud}/`);
    if (!triedUrls.value.has(altUrl)) {
      displaySrc.value = altUrl;
      return;
    }
  }

  if (displaySrc.value !== props.src && !triedUrls.value.has(props.src)) {
    displaySrc.value = props.src;
  }
};

watch(() => props.src, (newSrc) => {
  triedUrls.value.clear();
  if (objectUrl.value) {
    try {
      URL.revokeObjectURL(objectUrl.value);
    } catch (e) {}
    objectUrl.value = null;
  }
  displaySrc.value = newSrc;
  loadImage();
});

onMounted(loadImage);

onBeforeUnmount(() => {
  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value);
  }
});
</script>
