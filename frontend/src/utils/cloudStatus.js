import { ref } from 'vue';

export const primaryCloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dg365ewal';
export const secondaryCloud = import.meta.env.VITE_CLOUDINARY_SECONDARY_CLOUD_NAME || 'dieqsg5tr';

// Global reactive health status of Cloudinary accounts (Primary dg365ewal is over quota, default to true)
export const isPrimaryCloudDown = ref(true);
export const isSecondaryCloudDown = ref(false);

let loggedPrimaryWarning = false;
let loggedSecondaryWarning = false;

/**
 * Mark a specific Cloudinary cloud as failed/degraded
 * @param {string} urlOrCloud 
 */
export function markCloudFailed(urlOrCloud) {
  if (!urlOrCloud) return;
  const str = String(urlOrCloud);

  if (str.includes(primaryCloud) || str === primaryCloud) {
    if (!isPrimaryCloudDown.value) {
      isPrimaryCloudDown.value = true;
      if (!loggedPrimaryWarning) {
        console.warn(`[Cloudinary Failover] Primary cloud '${primaryCloud}' unreachable or unauthorized. Automatically failing over to secondary cloud '${secondaryCloud}'.`);
        loggedPrimaryWarning = true;
      }
    }
  } else if (str.includes(secondaryCloud) || str === secondaryCloud) {
    if (!isSecondaryCloudDown.value) {
      isSecondaryCloudDown.value = true;
      if (!loggedSecondaryWarning) {
        console.warn(`[Cloudinary Failover] Secondary cloud '${secondaryCloud}' unreachable or failed.`);
        loggedSecondaryWarning = true;
      }
    }
  }
}

/**
 * Returns the best working image URL for a product, honoring cloud failover status.
 * @param {Object} product - Product object with imageUrl and/or secondaryImageUrl
 * @returns {string|null} Active image URL or null
 */
export function getPreferredImageUrl(product) {
  if (!product) return null;

  const isInvalidCloud = (url) => {
    if (!url || typeof url !== 'string') return true;
    if (isPrimaryCloudDown.value && (url.includes(primaryCloud) || url.includes('dg365ewal'))) return true;
    if (isSecondaryCloudDown.value && (url.includes(secondaryCloud) || url.includes('dieqsg5tr'))) return true;
    return false;
  };

  // 1. Try primary imageUrl if valid and not on a disabled cloud
  if (product.imageUrl && !isInvalidCloud(product.imageUrl)) {
    return product.imageUrl;
  }

  // 2. Try secondaryImageUrl if valid and not on a disabled cloud
  if (product.secondaryImageUrl && !isInvalidCloud(product.secondaryImageUrl)) {
    return product.secondaryImageUrl;
  }

  // 3. No valid working image available
  return null;
}
