import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', {
  state: () => ({
    isAdmin: false,
    isSuperAdmin: false,
    stockData: [],
    isRefreshing: false,
    lastSyncTime: null,
    searchQuery: '',
    cleanView: true,
    config: {},
    showCart: false,
    showSidePanel: false,
  }),
  actions: {
    setAdmin(status) {
      this.isAdmin = status;
    },
    setSuperAdmin(status) {
      this.isSuperAdmin = status;
    },
    setStockData(data) {
      this.stockData = data;
    },
    setRefreshing(status) {
      this.isRefreshing = status;
    },
    setSyncTime(time) {
      this.lastSyncTime = time;
    },
    setSearchQuery(query) {
      this.searchQuery = query;
    },
    setCleanView(status) {
      this.cleanView = status;
    },
    toggleCart(forceVal) {
      this.showCart = forceVal !== undefined ? forceVal : !this.showCart;
      if (this.showCart) {
        this.searchQuery = '';
      }
    },
    toggleSidePanel(forceVal) {
      this.showSidePanel = forceVal !== undefined ? forceVal : !this.showSidePanel;
      if (this.showSidePanel) {
        this.searchQuery = '';
      }
    }
  }
});

