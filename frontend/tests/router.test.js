import { describe, it, expect, beforeEach } from 'vitest';
import router from '../src/android/router';

describe('Android Router', () => {
    beforeEach(async () => {
        // Reset router before each test
        await router.replace('/');
    });

    it('should have correct number of routes', () => {
        const routes = router.getRoutes();
        expect(routes.length).toBe(3);
    });

    it('should define home route', () => {
        const homeRoute = router.getRoutes().find(r => r.path === '/');
        expect(homeRoute).toBeDefined();
        expect(homeRoute.name).toBeUndefined(); // No name set
    });

    it('should define pdf-gen route', () => {
        const pdfRoute = router.getRoutes().find(r => r.path === '/pdf-gen');
        expect(pdfRoute).toBeDefined();
    });

    it('should define upload route', () => {
        const uploadRoute = router.getRoutes().find(r => r.path === '/upload');
        expect(uploadRoute).toBeDefined();
    });

    it('should navigate to home', async () => {
        await router.push('/');
        expect(router.currentRoute.value.path).toBe('/');
    });

    it('should navigate to pdf-gen', async () => {
        await router.push('/pdf-gen');
        expect(router.currentRoute.value.path).toBe('/pdf-gen');
    });

    it('should navigate to upload', async () => {
        await router.push('/upload');
        expect(router.currentRoute.value.path).toBe('/upload');
    });
});
