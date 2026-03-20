import { defineStore } from 'pinia';

export const useCartStore = defineStore('cart', {
  state: () => ({
    cart: [],
  }),
  getters: {
    cartTotalItems: (state) => {
      return state.cart.reduce((total, item) => total + item.quantity, 0);
    },
    cartItemCount: (state) => {
      return state.cart.length;
    },
  },
  actions: {
    getCartQty(product) {
      if (!product || !product.productName) return 0;
      const item = this.cart.find((i) => i.product.productName === product.productName);
      return item ? item.quantity : 0;
    },
    updateCart(product, change) {
      if (!product || !product.productName) return;

      const index = this.cart.findIndex((i) => i.product.productName === product.productName);

      if (index !== -1) {
          const newQty = this.cart[index].quantity + change;
          if (newQty <= 0) {
              this.cart.splice(index, 1);
          } else {
              this.cart[index].quantity = newQty;
          }
      } else if (change > 0) {
          // Add new item to cart
          this.cart.push({ product, quantity: change });
      }
    },
    addToCart(product) {
      this.updateCart(product, 1);
    },
    removeFromCart(index) {
      if (index >= 0 && index < this.cart.length) {
          this.cart.splice(index, 1);
      }
    },
    updateCartQuantity(index, diff) {
      if (index < 0 || index >= this.cart.length) return;

      const item = this.cart[index];
      const newQty = item.quantity + diff;

      if (newQty <= 0) {
          this.removeFromCart(index);
      } else {
          item.quantity = newQty;
      }
    },
    clearCart() {
      this.cart = [];
    }
  }
});
