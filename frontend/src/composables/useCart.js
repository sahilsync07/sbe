import { computed } from 'vue';
import { store } from '../store.js';

/**
 * Cart management composable
 * Provides cart state and operations
 */
export function useCart() {
    /**
     * Get quantity of a product in cart
     * @param {Object} product - Product to check
     * @returns {number} Quantity in cart (0 if not in cart)
     */
    const getCartQty = (product) => {
        if (!product || !product.productName) return 0;
        const item = store.cart.find((i) => i.product.productName === product.productName);
        return item ? item.quantity : 0;
    };

    /**
     * Update quantity of a product in cart
     * @param {Object} product - Product to update
     * @param {number} change - Change in quantity (+/-)
     */
    const updateCart = (product, change) => {
        if (!product || !product.productName) return;

        const index = store.cart.findIndex((i) => i.product.productName === product.productName);

        if (index !== -1) {
            const newQty = store.cart[index].quantity + change;
            if (newQty <= 0) {
                store.cart.splice(index, 1);
            } else {
                store.cart[index].quantity = newQty;
            }
        } else if (change > 0) {
            // Add new item to cart
            store.cart.push({ product, quantity: change });
        }
    };

    /**
     * Add product to cart (increment by 1)
     * @param {Object} product - Product to add
     */
    const addToCart = (product) => {
        updateCart(product, 1);
    };

    /**
     * Remove product from cart by index
     * @param {number} index - Cart item index
     */
    const removeFromCart = (index) => {
        if (index >= 0 && index < store.cart.length) {
            store.cart.splice(index, 1);
        }
    };

    /**
     * Update cart item quantity by index
     * @param {number} index - Cart item index  
     * @param {number} diff - Quantity change
     */
    const updateCartQuantity = (index, diff) => {
        if (index < 0 || index >= store.cart.length) return;

        const item = store.cart[index];
        const newQty = item.quantity + diff;

        if (newQty <= 0) {
            removeFromCart(index);
        } else {
            item.quantity = newQty;
        }
    };

    /**
     * Clear entire cart
     */
    const clearCart = () => {
        store.clearCart();
    };

    /**
     * Total number of items in cart (sum of quantities)
     */
    const cartTotalItems = computed(() => {
        return store.cart.reduce((total, item) => total + item.quantity, 0);
    });

    /**
     * Total number of unique products in cart
     */
    const cartItemCount = computed(() => {
        return store.cart.length;
    });

    return {
        // State
        cart: computed(() => store.cart),
        cartTotalItems,
        cartItemCount,

        // Methods
        getCartQty,
        addToCart,
        updateCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
    };
}
