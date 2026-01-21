import { describe, it, expect } from 'vitest';
import {
    formatProductName,
    normalizeId,
    getOptimizedImageUrl,
    isNewArrival,
    normalizeName,
} from '../../src/utils/formatters.js';

describe('formatProductName', () => {
    it('should return empty string for null/undefined', () => {
        expect(formatProductName(null)).toBe('');
        expect(formatProductName(undefined)).toBe('');
        expect(formatProductName('')).toBe('');
    });

    it('should capitalize each word', () => {
        expect(formatProductName('test product')).toBe('Test Product');
    });

    it('should handle single word', () => {
        expect(formatProductName('shoe')).toBe('Shoe');
    });

    it('should handle all lowercase', () => {
        expect(formatProductName('paragon gents')).toBe('Paragon Gents');
    });

    it('should handle all uppercase', () => {
        expect(formatProductName('AIRSON FOOTWEAR')).toBe('Airson Footwear');
    });

    it('should handle mixed case', () => {
        expect(formatProductName('TeSt PrOdUcT')).toBe('Test Product');
    });
});

describe('normalizeId', () => {
    it('should return empty string for null/undefined', () => {
        expect(normalizeId(null)).toBe('');
        expect(normalizeId(undefined)).toBe('');
        expect(normalizeId('')).toBe('');
    });

    it('should convert to lowercase', () => {
        expect(normalizeId('Test Product')).toBe('test-product');
    });

    it('should replace spaces with hyphens', () => {
        expect(normalizeId('Paragon Gents')).toBe('paragon-gents');
    });

    it('should handle multiple spaces', () => {
        expect(normalizeId('Test   Product   Name')).toBe('test-product-name');
    });

    it('should trim whitespace', () => {
        expect(normalizeId('  test product  ')).toBe('test-product');
    });
});

describe('getOptimizedImageUrl', () => {
    it('should return null for null/undefined', () => {
        expect(getOptimizedImageUrl(null)).toBeNull();
        expect(getOptimizedImageUrl(undefined)).toBeNull();
        expect(getOptimizedImageUrl('')).toBeNull();
    });

    it('should add Cloudinary transformations', () => {
        const original =
            'https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg';
        const expected =
            'https://res.cloudinary.com/demo/image/upload/w_1000,q_70,f_auto/v1234567890/sample.jpg';
        expect(getOptimizedImageUrl(original)).toBe(expected);
    });

    it('should return original URL if not Cloudinary format', () => {
        const url = 'https://example.com/image.jpg';
        expect(getOptimizedImageUrl(url)).toBe(url);
    });

    it('should handle malformed URLs gracefully', () => {
        const url = 'not-a-valid-url';
        expect(getOptimizedImageUrl(url)).toBe(url);
    });
});

describe('isNewArrival', () => {
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    it('should return false for null/undefined', () => {
        expect(isNewArrival(null)).toBe(false);
        expect(isNewArrival(undefined)).toBe(false);
    });

    it('should return true for products uploaded within last month', () => {
        const product = {
            imageUploadedAt: now.toISOString(),
        };
        expect(isNewArrival(product)).toBe(true);
    });

    it('should return false for products older than a month', () => {
        const product = {
            imageUploadedAt: twoMonthsAgo.toISOString(),
        };
        expect(isNewArrival(product)).toBe(false);
    });

    it('should use latest date between imageUploadedAt and firstSeenAt', () => {
        const product = {
            imageUploadedAt: twoMonthsAgo.toISOString(),
            firstSeenAt: now.toISOString(),
        };
        expect(isNewArrival(product)).toBe(true);
    });

    it('should handle products without dates', () => {
        const product = {};
        expect(isNewArrival(product)).toBe(false);
    });
});

describe('normalizeName', () => {
    it('should return empty string for null/undefined', () => {
        expect(normalizeName(null)).toBe('');
        expect(normalizeName(undefined)).toBe('');
        expect(normalizeName('')).toBe('');
    });

    it('should convert to lowercase and trim', () => {
        expect(normalizeName('  Test Product  ')).toBe('test product');
    });

    it('should handle already normalized names', () => {
        expect(normalizeName('test')).toBe('test');
    });
});
