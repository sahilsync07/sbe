
import { reactive, computed } from 'vue';

export const store = reactive({
    cart: [],
    searchQuery: '',
    lastSyncTime: null,
    isSyncing: false,
    uploading: {}, // { productName: boolean }

    // UI State
    isMobile: false,
    isSidebarOpen: false,
    isCartOpen: false,

    // Actions
    addToCart(product) {
        const existing = this.cart.find(item => item.product.productName === product.productName);
        if (existing) {
            existing.quantity++;
        } else {
            this.cart.push({ product, quantity: 1 });
        }
    },

    removeFromCart(index) {
        this.cart.splice(index, 1);
    },

    updateCartQuantity(index, change) {
        const item = this.cart[index];
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                this.removeFromCart(index);
            }
        }
    },

    clearCart() {
        this.cart = [];
    },

    setAdmin(status) {
        this.isAdmin = status;
    },

    setSyncTime(time) {
        this.lastSyncTime = time;
    }
});

export const cartTotalItems = computed(() => {
    return store.cart.reduce((total, item) => total + item.quantity, 0);
});
