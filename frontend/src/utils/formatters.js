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
 * Get optimized Cloudinary URL with transformations
 * @param {string} imageUrl - Original image URL
 * @returns {string|null} Optimized URL or null
 */
export function getOptimizedImageUrl(imageUrl) {
    if (!imageUrl) return null;
    try {
        const parts = imageUrl.split('/upload/');
        if (parts.length !== 2) return imageUrl;
        const transformation = 'w_400,q_70,f_auto';
        return `${parts[0]}/upload/${transformation}/${parts[1]}`;
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
