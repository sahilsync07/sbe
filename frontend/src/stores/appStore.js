import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', {
  state: () => ({
    isAdmin: false,
    isSuperAdmin: false,
    stockData: [],
    isRefreshing: false,
    lastSyncTime: null,
    searchQuery: '',
    cleanView: 'clean', // 'clean' | 'all' | 'upload'
    config: {},
    showCart: false,
    showSidePanel: false,
    showLanding: true,
    showAdminModal: false,
    showGitHubSyncModal: false,
  }),
  getters: {
    isCleanMode: (state) => state.cleanView === 'clean' || state.cleanView === true,
    isUploadMode: (state) => state.cleanView === 'upload',
    isAllMode: (state) => state.cleanView === 'all' || state.cleanView === false,
  },
  actions: {
    setShowLanding(status) {
      this.showLanding = status;
    },
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
      if (status === true) this.cleanView = 'clean';
      else if (status === false) this.cleanView = 'all';
      else this.cleanView = status;
    },
    cycleCleanView() {
      if (this.cleanView === 'clean' || this.cleanView === true) {
        this.cleanView = 'all';
      } else if (this.cleanView === 'all' || this.cleanView === false) {
        this.cleanView = 'upload';
      } else {
        this.cleanView = 'clean';
      }
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
    },
    toggleAdminModal(forceVal) {
      this.showAdminModal = forceVal !== undefined ? forceVal : !this.showAdminModal;
    },
    toggleGitHubSyncModal(forceVal) {
      this.showGitHubSyncModal = forceVal !== undefined ? forceVal : !this.showGitHubSyncModal;
    }
  }
});

