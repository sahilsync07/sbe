import { ref } from 'vue';

// Cloudinary cloud name (only dieqsg5tr is active; dg365ewal is retired/over-quota)
export const secondaryCloud = import.meta.env.VITE_CLOUDINARY_SECONDARY_CLOUD_NAME || 'dieqsg5tr';

// Reactive health status of the remaining Cloudinary account
export const isSecondaryCloudDown = ref(false);

let loggedWarning = false;

/**
 * Mark Cloudinary cloud as failed/degraded
 * @param {string} urlOrCloud 
 */
export function markCloudFailed(urlOrCloud) {
  if (!urlOrCloud) return;
  const str = String(urlOrCloud);

  if (str.includes(secondaryCloud) || str === secondaryCloud) {
    if (!isSecondaryCloudDown.value) {
      isSecondaryCloudDown.value = true;
      if (!loggedWarning) {
        console.warn(`[Cloudinary] Cloud '${secondaryCloud}' unreachable or failed.`);
        loggedWarning = true;
      }
    }
  }
}

/**
 * Returns the best working image URL for a product.
 * Skips any dieqsg5tr URLs if that cloud is marked down.
 * dg365ewal URLs are always rejected (account retired).
 * @param {Object} product - Product object with imageUrl and/or secondaryImageUrl
 * @returns {string|null} Active image URL or null
 */
export function getPreferredImageUrl(product) {
  if (!product) return null;

  const isInvalid = (url) => {
    if (!url || typeof url !== 'string') return true;
    // Always reject retired dg365ewal cloud
    if (url.includes('dg365ewal')) return true;
    if (isSecondaryCloudDown.value && url.includes('dieqsg5tr')) return true;
    return false;
  };

  // 1. Try primary imageUrl
  if (product.imageUrl && !isInvalid(product.imageUrl)) {
    return product.imageUrl;
  }

  // 2. Try secondaryImageUrl
  if (product.secondaryImageUrl && !isInvalid(product.secondaryImageUrl)) {
    return product.secondaryImageUrl;
  }

  // 3. No valid working image available
  return null;
}
