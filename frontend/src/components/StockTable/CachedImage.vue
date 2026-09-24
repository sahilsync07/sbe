<template>
  <div 
    v-if="hasError" 
    class="w-full h-full flex flex-col items-center justify-center bg-slate-100/70 dark:bg-slate-800/50 text-slate-400 select-none transition-colors"
    :class="$attrs.class"
  >
    <i class="fa-solid fa-shoe-prints text-2xl opacity-25 mb-1"></i>
    <span class="text-[10px] font-medium tracking-tight opacity-40">No photo</span>
  </div>
  <img 
    v-else
    :src="displaySrc" 
    :alt="alt"
    loading="lazy"
    decoding="async"
    @error="handleError"
    v-bind="$attrs"
  />
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { getLocalImageUri } from '../../utils/nativeCache';
import { 
  primaryCloud, 
  secondaryCloud, 
  isPrimaryCloudDown, 
  isSecondaryCloudDown, 
  markCloudFailed 
} from '../../utils/cloudStatus';

defineOptions({
  inheritAttrs: false
});

const props = defineProps({
  src: String,
  fallbackSrc: String,
  alt: String,
  cacheKey: String
});

const displaySrc = ref(null);
const hasError = ref(false);
const objectUrl = ref(null);
const triedUrls = ref(new Set());

const CACHE_NAME = 'sbe-images-v1';

const getInitialUrl = () => {
  // If primary cloud is known to be down, prefer fallbackSrc
  if (isPrimaryCloudDown.value && props.fallbackSrc) {
    return props.fallbackSrc;
  }
  // If primary cloud is down and src is on primary cloud with no fallback, don't waste 401 request
  if (isPrimaryCloudDown.value && props.src && props.src.includes(primaryCloud) && !props.fallbackSrc) {
    return null;
  }
  return props.src || props.fallbackSrc || null;
};

const loadImage = async () => {
  const targetUrl = getInitialUrl();
  if (!targetUrl) {
    hasError.value = true;
    displaySrc.value = null;
    return;
  }

  hasError.value = false;

  // Cleanup previous object URL if exists
  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value);
    objectUrl.value = null;
  }

  const keyToCheck = props.cacheKey || targetUrl;

  // 1. Try Native App Data Cache first (Zero Latency if already Delta Synced)
  try {
    const nativeUri = await getLocalImageUri(keyToCheck, targetUrl);
    if (nativeUri) {
      displaySrc.value = nativeUri;
      return;
    }
  } catch (e) {}

  // 2. Try Web API Cache
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      let cachedResponse = await cache.match(targetUrl);
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

  // 3. Fallback to network
  displaySrc.value = targetUrl;
};

const handleError = () => {
  if (!displaySrc.value) {
    hasError.value = true;
    return;
  }

  const failedUrl = displaySrc.value;
  triedUrls.value.add(failedUrl);

  // If failed on primary cloud, trigger global failover
  if (failedUrl.includes(`/${primaryCloud}/`) || failedUrl.includes(primaryCloud)) {
    markCloudFailed(primaryCloud);
  } else if (failedUrl.includes(`/${secondaryCloud}/`) || failedUrl.includes(secondaryCloud)) {
    markCloudFailed(secondaryCloud);
  }

  // 1. If CDN URL (wsrv.nl) failed, fallback immediately to direct Cloudinary URL
  if (failedUrl.includes('wsrv.nl')) {
    const match = failedUrl.match(/url=([^&]+)/);
    if (match) {
      let rawUrl = decodeURIComponent(match[1]);
      if (!rawUrl.startsWith('http')) rawUrl = 'https://' + rawUrl;
      if (!triedUrls.value.has(rawUrl)) {
        displaySrc.value = rawUrl;
        return;
      }
    }
  }

  // 2. Try explicit fallbackSrc if provided and not yet tried
  if (props.fallbackSrc && !triedUrls.value.has(props.fallbackSrc)) {
    displaySrc.value = props.fallbackSrc;
    return;
  }

  // 3. If failedUrl was on primary cloud and fallbackSrc was not set, try secondary cloud once
  if (failedUrl.includes(`/${primaryCloud}/`) && !isSecondaryCloudDown.value) {
    const altUrl = failedUrl.replace(`/${primaryCloud}/`, `/${secondaryCloud}/`);
    if (!triedUrls.value.has(altUrl)) {
      displaySrc.value = altUrl;
      return;
    }
  }

  // 4. All fallbacks exhausted -> display graceful placeholder
  hasError.value = true;
  displaySrc.value = null;
};

watch([() => props.src, () => props.fallbackSrc], () => {
  triedUrls.value.clear();
  if (objectUrl.value) {
    try {
      URL.revokeObjectURL(objectUrl.value);
    } catch (e) {}
    objectUrl.value = null;
  }
  loadImage();
});

onMounted(loadImage);

onBeforeUnmount(() => {
  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value);
  }
});
</script>
