import { describe, it, expect, beforeEach } from 'vitest';
import { store, cartTotalItems } from '../src/android/store';

describe('Android Store', () => {
    beforeEach(() => {
        // Reset cart before each test
        store.cart = [];
        store.isAdmin = false;
        store.isSidebarOpen = false;
        store.isCartOpen = false;
    });

    describe('Cart Management', () => {
        it('should start with empty cart', () => {
            expect(store.cart).toEqual([]);
            expect(cartTotalItems.value).toBe(0);
        });

        it('should add product to cart', () => {
            const product = { productName: 'Test Product', quantity: 10 };
            store.addToCart(product);

            expect(store.cart).toHaveLength(1);
            expect(store.cart[0].product).toEqual(product);
            expect(store.cart[0].quantity).toBe(1);
        });

        it('should increase quantity for existing product', () => {
            const product = { productName: 'Test Product', quantity: 10 };
            store.addToCart(product);
            store.addToCart(product);

            expect(store.cart).toHaveLength(1);
            expect(store.cart[0].quantity).toBe(2);
        });

        it('should remove product from cart', () => {
            const product = { productName: 'Test Product', quantity: 10 };
            store.addToCart(product);
            store.removeFromCart(0);

            expect(store.cart).toHaveLength(0);
        });

        it('should update cart quantity correctly', () => {
            const product = { productName: 'Test Product', quantity: 10 };
            store.addToCart(product);
            store.updateCartQuantity(0, 3);

            expect(store.cart[0].quantity).toBe(4);
        });

        it('should remove item when quantity becomes zero', () => {
            const product = { productName: 'Test Product', quantity: 10 };
            store.addToCart(product);
            store.updateCartQuantity(0, -1);

            expect(store.cart).toHaveLength(0);
        });

        it('should clear entire cart', () => {
            store.addToCart({ productName: 'Product 1', quantity: 5 });
            store.addToCart({ productName: 'Product 2', quantity: 3 });

            store.clearCart();

            expect(store.cart).toHaveLength(0);
            expect(cartTotalItems.value).toBe(0);
        });

        it('should calculate total items correctly', () => {
            store.addToCart({ productName: 'Product 1', quantity: 5 });
            store.addToCart({ productName: 'Product 2', quantity: 3 });
            store.updateCartQuantity(0, 2); // Product 1 now has 3 qty

            expect(cartTotalItems.value).toBe(4); // 3 + 1
        });
    });

    describe('Admin State', () => {
        it('should toggle admin mode', () => {
            expect(store.isAdmin).toBe(false);
            store.setAdmin(true);
            expect(store.isAdmin).toBe(true);
        });
    });

    describe('UI State', () => {
        it('should manage sidebar state', () => {
            expect(store.isSidebarOpen).toBe(false);
            store.isSidebarOpen = true;
            expect(store.isSidebarOpen).toBe(true);
        });

        it('should manage cart open state', () => {
            expect(store.isCartOpen).toBe(false);
            store.isCartOpen = true;
            expect(store.isCartOpen).toBe(true);
        });
    });

    describe('Sync Time', () => {
        it('should set sync time', () => {
            const now = new Date();
            store.setSyncTime(now);
            expect(store.lastSyncTime).toEqual(now);
        });
    });
});
