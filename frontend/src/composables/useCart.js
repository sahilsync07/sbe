import { computed } from 'vue';
import { useCartStore } from '../stores/cartStore';

/**
 * Cart management composable (Pinia Wrapper)
 * Provides cart state and operations seamlessly to old components
 */
export function useCart() {
    const cartStore = useCartStore();

    return {
        // State
        cart: computed(() => cartStore.cart),
        cartTotalItems: computed(() => cartStore.cartTotalItems),
        cartItemCount: computed(() => cartStore.cartItemCount),

        // Methods (proxied to Pinia)
        getCartQty: (product) => cartStore.getCartQty(product),
        updateCart: (product, change) => cartStore.updateCart(product, change),
        addToCart: (product) => cartStore.addToCart(product),
        removeFromCart: (index) => cartStore.removeFromCart(index),
        updateCartQuantity: (index, diff) => cartStore.updateCartQuantity(index, diff),
        clearCart: () => cartStore.clearCart(),
    };
}
