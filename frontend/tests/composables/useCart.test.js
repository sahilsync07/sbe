import { describe, it, expect, beforeEach } from 'vitest';
import { useCart } from '../../src/composables/useCart';
import { store } from '../../src/android/store';

describe('useCart Composable', () => {
    beforeEach(() => {
        // Reset cart before each test
        store.cart = [];
    });

    describe('getCartQty', () => {
        it('should return 0 for product not in cart', () => {
            const { getCartQty } = useCart();
            const product = { productName: 'Test Product' };

            expect(getCartQty(product)).toBe(0);
        });

        it('should return quantity for product in cart', () => {
            const { getCartQty } = useCart();
            const product = { productName: 'Test Product' };
            store.cart.push({ product, quantity: 3 });

            expect(getCartQty(product)).toBe(3);
        });

        it('should return 0 for null product', () => {
            const { getCartQty } = useCart();
            expect(getCartQty(null)).toBe(0);
        });

        it('should return 0 for product without productName', () => {
            const { getCartQty } = useCart();
            expect(getCartQty({})).toBe(0);
        });
    });

    describe('addToCart', () => {
        it('should add new product to cart', () => {
            const { addToCart } = useCart();
            const product = { productName: 'Test Product' };

            addToCart(product);

            expect(store.cart).toHaveLength(1);
            expect(store.cart[0].product).toEqual(product);
            expect(store.cart[0].quantity).toBe(1);
        });

        it('should increment quantity for existing product', () => {
            const { addToCart } = useCart();
            const product = { productName: 'Test Product' };

            addToCart(product);
            addToCart(product);

            expect(store.cart).toHaveLength(1);
            expect(store.cart[0].quantity).toBe(2);
        });
    });

    describe('updateCart', () => {
        it('should increase quantity', () => {
            const { updateCart } = useCart();
            const product = { productName: 'Test Product' };
            store.cart.push({ product, quantity: 2 });

            updateCart(product, 3);

            expect(store.cart[0].quantity).toBe(5);
        });

        it('should decrease quantity', () => {
            const { updateCart } = useCart();
            const product = { productName: 'Test Product' };
            store.cart.push({ product, quantity: 5 });

            updateCart(product, -2);

            expect(store.cart[0].quantity).toBe(3);
        });

        it('should remove product when quantity reaches 0', () => {
            const { updateCart } = useCart();
            const product = { productName: 'Test Product' };
            store.cart.push({ product, quantity: 2 });

            updateCart(product, -2);

            expect(store.cart).toHaveLength(0);
        });

        it('should add product when change is positive and not in cart', () => {
            const { updateCart } = useCart();
            const product = { productName: 'Test Product' };

            updateCart(product, 3);

            expect(store.cart).toHaveLength(1);
            expect(store.cart[0].quantity).toBe(3);
        });

        it('should not add product when change is negative and not in cart', () => {
            const { updateCart } = useCart();
            const product = { productName: 'Test Product' };

            updateCart(product, -1);

            expect(store.cart).toHaveLength(0);
        });
    });

    describe('removeFromCart', () => {
        it('should remove item at index', () => {
            const { removeFromCart } = useCart();
            store.cart.push(
                { product: { productName: 'Product 1' }, quantity: 1 },
                { product: { productName: 'Product 2' }, quantity: 2 }
            );

            removeFromCart(0);

            expect(store.cart).toHaveLength(1);
            expect(store.cart[0].product.productName).toBe('Product 2');
        });

        it('should handle invalid index gracefully', () => {
            const { removeFromCart } = useCart();
            store.cart.push({ product: { productName: 'Product 1' }, quantity: 1 });

            removeFromCart(10);

            expect(store.cart).toHaveLength(1);
        });

        it('should handle negative index gracefully', () => {
            const { removeFromCart } = useCart();
            store.cart.push({ product: { productName: 'Product 1' }, quantity: 1 });

            removeFromCart(-1);

            expect(store.cart).toHaveLength(1);
        });
    });

    describe('updateCartQuantity', () => {
        it('should update quantity by index', () => {
            const { updateCartQuantity } = useCart();
            store.cart.push({ product: { productName: 'Product 1' }, quantity: 3 });

            updateCartQuantity(0, 2);

            expect(store.cart[0].quantity).toBe(5);
        });

        it('should remove item when quantity becomes 0', () => {
            const { updateCartQuantity } = useCart();
            store.cart.push({ product: { productName: 'Product 1' }, quantity: 2 });

            updateCartQuantity(0, -2);

            expect(store.cart).toHaveLength(0);
        });
    });

    describe('clearCart', () => {
        it('should clear all items from cart', () => {
            const { clearCart } = useCart();
            store.cart.push(
                { product: { productName: 'Product 1' }, quantity: 1 },
                { product: { productName: 'Product 2' }, quantity: 2 }
            );

            clearCart();

            expect(store.cart).toHaveLength(0);
        });
    });

    describe('computed properties', () => {
        it('cartTotalItems should sum all quantities', () => {
            const { cartTotalItems } = useCart();
            store.cart.push(
                { product: { productName: 'Product 1' }, quantity: 2 },
                { product: { productName: 'Product 2' }, quantity: 3 },
                { product: { productName: 'Product 3' }, quantity: 1 }
            );

            expect(cartTotalItems.value).toBe(6);
        });

        it('cartItemCount should count unique products', () => {
            const { cartItemCount } = useCart();
            store.cart.push(
                { product: { productName: 'Product 1' }, quantity: 5 },
                { product: { productName: 'Product 2' }, quantity: 10 }
            );

            expect(cartItemCount.value).toBe(2);
        });

        it('cart should be reactive', () => {
            const { cart, addToCart } = useCart();
            const product = { productName: 'Test Product' };

            expect(cart.value).toHaveLength(0);

            addToCart(product);

            expect(cart.value).toHaveLength(1);
        });
    });
});
