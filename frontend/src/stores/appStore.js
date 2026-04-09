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
    }
  }
});
