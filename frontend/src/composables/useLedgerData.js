import { ref, computed } from 'vue';
import axios from 'axios';

// Global state to cache ledger data across components
const ledgerData = ref([]);
const loading = ref(false);
const error = ref(null);
const lastLedgerSync = ref(null);

const LEDGER_CACHE_KEY = 'sbe_ledger_data_cache';
const REMOTE_LEDGER_URL = 'https://raw.githubusercontent.com/sahilsync07/sbe/refs/heads/main/frontend/public/assets/ledger-data.json';

export function useLedgerData() {
  const loadLedgerData = async (forceRefresh = false) => {
    // Return cached data if already loaded and not forced
    if (ledgerData.value.length > 0 && !forceRefresh) return;

    loading.value = true;
    error.value = null;

    // Check localStorage cache if not force refreshed
    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem(LEDGER_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            ledgerData.value = parsed.filter(g => g.groupName !== "_META_DATA_");
            loading.value = false;
          }
        }
      } catch (e) {}
    }

    try {
      // 1. Try local bundle/assets first
      const baseUrl = import.meta.env.BASE_URL || '/';
      const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
      const url = `${cleanBase}assets/ledger-data.json?t=${Date.now()}`;
      
      let data = null;
      try {
        const response = await axios.get(url, { timeout: 6000 });
        data = response.data;
      } catch (localErr) {
        // Fallback to GitHub raw
        console.warn('[Ledger] Local asset fetch failed, attempting GitHub raw:', localErr.message);
        const ghRes = await axios.get(`${REMOTE_LEDGER_URL}?t=${Date.now()}`, { timeout: 10000 });
        data = ghRes.data;
      }

      if (Array.isArray(data)) {
        const meta = data.find(g => g.groupName === "_META_DATA_");
        if (meta && meta.lastSync) {
          lastLedgerSync.value = new Date(meta.lastSync);
        }
        
        const filtered = data.filter(group => group.groupName !== "_META_DATA_");
        ledgerData.value = filtered;

        try {
          localStorage.setItem(LEDGER_CACHE_KEY, JSON.stringify(data));
        } catch (e) {}
      }
    } catch (err) {
      console.error('Failed to load ledger data:', err);
      if (ledgerData.value.length === 0) {
        error.value = 'Ledger data not available. Please ensure network connection or sync from Tally.';
      }
    } finally {
      loading.value = false;
    }
  };

  const updateLedgerDataInMemory = (newCatalog) => {
    if (Array.isArray(newCatalog)) {
      ledgerData.value = newCatalog.filter(g => g.groupName !== "_META_DATA_");
      try {
        localStorage.setItem(LEDGER_CACHE_KEY, JSON.stringify(newCatalog));
      } catch (e) {}
    }
  };

  // Helper to extract a flat list of all ledgers from all groups
  const allLedgers = computed(() => {
    if (!ledgerData.value || !Array.isArray(ledgerData.value)) return [];

    let ledgers = [];
    ledgerData.value.forEach(group => {
      if (group.ledgers && Array.isArray(group.ledgers)) {
        // Inject group name into each ledger for easier searching/display
        const groupLedgers = group.ledgers.map(l => ({
          ...l,
          groupName: group.groupName
        }));
        ledgers = ledgers.concat(groupLedgers);
      }
    });

    // Sort alphabetically by ledgerName
    return ledgers.sort((a, b) => {
      const nameA = a.ledgerName || '';
      const nameB = b.ledgerName || '';
      return nameA.localeCompare(nameB);
    });
  });

  return {
    ledgerData,
    allLedgers,
    loading,
    error,
    lastLedgerSync,
    loadLedgerData,
    updateLedgerDataInMemory
  };
}
