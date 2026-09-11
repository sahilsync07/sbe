import { extractColor } from './colors.js';

/**
 * Format product name to title case
 * @param {string} name - Product name to format
 * @returns {string} Formatted product name
 */
export function formatProductName(name) {
    if (!name) return '';
    // First letter capital, rest small for every word
    return name
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Normalize string to ID-safe format
 * @param {string} name - String to normalize
 * @returns {string} Normalized ID
 */
export function normalizeId(name) {
    if (!name) return '';
    return name.toLowerCase().trim().replace(/\s+/g, '-');
}

/**
 * Get optimized Cloudinary URL routed through a free global Cloudflare CDN edge cache (wsrv.nl).
 * Shields Cloudinary from repeat downloads, slashing origin bandwidth by >99%.
 *
 * @param {string} imageUrl - Original image URL
 * @param {'thumb'|'modal'|string} [targetOrTransformation='thumb'] - Target view or custom size
 * @returns {string|null} Optimized Cloudflare CDN URL or null
 */
export function getOptimizedImageUrl(imageUrl, targetOrTransformation = 'thumb') {
    if (!imageUrl) return null;
    try {
        if (!imageUrl.includes('res.cloudinary.com')) return imageUrl;
        const parts = imageUrl.split('/upload/');
        if (parts.length !== 2) return imageUrl;

        // Strip any existing transformation prefix in parts[1] so we always hit canonical source
        const cleanPath = parts[1].replace(/^([a-z]_[^/]+,?)+\//i, '');
        const canonicalUrl = `${parts[0]}/upload/${cleanPath}`;

        // Configure edge caching dimensions
        let width = 400;
        let quality = 80;

        if (targetOrTransformation === 'modal') {
            width = 800;
            quality = 85;
        } else if (typeof targetOrTransformation === 'number') {
            width = targetOrTransformation;
        } else if (typeof targetOrTransformation === 'string' && targetOrTransformation.startsWith('w_')) {
            const m = targetOrTransformation.match(/w_(\d+)/);
            if (m) width = parseInt(m[1], 10);
        }

        // Route through Cloudflare edge cache (wsrv.nl) with automatic WebP compression
        const hostPath = canonicalUrl.replace(/^https?:\/\//, '');
        return `https://wsrv.nl/?url=${encodeURIComponent(hostPath)}&w=${width}&q=${quality}&output=webp`;
    } catch (e) {
        return imageUrl;
    }
}

/**
 * Get direct Cloudinary fallback URL in case of CDN unavailability
 */
export function getDirectCloudinaryUrl(imageUrl) {
    if (!imageUrl) return null;
    try {
        if (!imageUrl.includes('res.cloudinary.com')) return imageUrl;
        const parts = imageUrl.split('/upload/');
        if (parts.length !== 2) return imageUrl;
        const cleanPath = parts[1].replace(/^([a-z]_[^/]+,?)+\//i, '');
        return `${parts[0]}/upload/w_400,q_auto:eco,f_auto/${cleanPath}`;
    } catch (e) {
        return imageUrl;
    }
}

/**
 * Check if product is a new arrival (uploaded within last month)
 * @param {Object} product - Product object
 * @returns {boolean} True if new arrival
 */
export function isNewArrival(product) {
    if (!product) return false;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 1);
    const minDate = new Date('2025-11-01');

    const imageDate = product.imageUploadedAt ? new Date(product.imageUploadedAt) : minDate;
    const itemDate = product.firstSeenAt ? new Date(product.firstSeenAt) : minDate;

    const latestDate = itemDate > imageDate ? itemDate : imageDate;
    return latestDate > cutoff;
}

/**
 * Normalize name for comparison
 * @param {string} name - Name to normalize
 * @returns {string} Normalized name
 */
export function normalizeName(name) {
    return name ? name.toLowerCase().trim() : '';
}

/**
 * Get a clean product name by stripping sizes, prices, and colors
 * @param {string} name - Name to clean
 * @returns {string} Cleaned name
 */
export function getCleanProductName(name) {
    if (!name) return '';
    let clean = name;
    
    // Remove Colors
    const colorData = extractColor(name);
    if (colorData && colorData.originalTokens) {
        colorData.originalTokens.forEach(token => {
            const regex = new RegExp(`\\b${token}\\b`, 'gi');
            clean = clean.replace(regex, '');
        });
    }

    // Remove Price pattern
    clean = clean.replace(/((?:RS|MRP|@))[\.\s]*(\d+(\.\d+)?)/gi, '');
    // Remove Size pattern
    clean = clean.replace(/(?:^|[\s\(])(\d{1,2})\s*[xX*]\s*(\d{1,2})(?:[\s\)]|$)/g, ' ');
    
    clean = clean.replace(/\(\s*\)/g, '');
    clean = clean.replace(/[\/\-\.]+\s*$/g, '') 
                 .replace(/^\s*[\/\-\.]+/g, '') 
                 .replace(/\s*[\/\-\.]+\s*/g, ' '); 
    
    const cleanedString = clean.replace(/\s+/g, ' ').trim();
    return formatProductName(cleanedString);
}

