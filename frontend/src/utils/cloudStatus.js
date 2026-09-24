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

  // 1. If primary cloud is known to be down, prefer secondaryImageUrl if present
  if (isPrimaryCloudDown.value && product.secondaryImageUrl) {
    return product.secondaryImageUrl;
  }

  // 2. If primary cloud is known to be down, and product only has primary imageUrl on primary cloud
  // returning it will only produce 401/404 errors. Return null so the UI cleanly renders placeholder.
  if (isPrimaryCloudDown.value && product.imageUrl && product.imageUrl.includes(primaryCloud) && !product.secondaryImageUrl) {
    return null;
  }

  // 3. Normal order: primary imageUrl first, then secondaryImageUrl
  return product.imageUrl || product.secondaryImageUrl || null;
}
