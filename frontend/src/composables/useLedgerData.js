import { ref, computed } from 'vue';
import axios from 'axios';

// Global state to cache ledger data across components
const ledgerData = ref([]);
const loading = ref(false);
const error = ref(null);

export function useLedgerData() {
  const loadLedgerData = async () => {
    // Return cached data if already loaded
    if (ledgerData.value.length > 0) return;
    
    loading.value = true;
    error.value = null;
    try {
      // Add timestamp to prevent aggressive caching. Use BASE_URL to support GH Pages (/sbe/)
      const baseUrl = import.meta.env.BASE_URL || '/';
      const response = await axios.get(`${baseUrl}assets/ledger-data.json?t=${new Date().getTime()}`);
      
      // Filter out meta data (e.g. index 0 which usually holds sync timestamps)
      let data = response.data;
      if (Array.isArray(data)) {
         data = data.filter(group => group.groupName !== "_META_DATA_");
      }
      
      ledgerData.value = data;
    } catch (err) {
      console.error('Failed to load ledger data:', err);
      // In development, the file might not exist yet if sync wasn't run
      error.value = 'Ledger data not available. Please ensure the backend has synced data from Tally.';
      ledgerData.value = [];
    } finally {
      loading.value = false;
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
    loadLedgerData
  };
}
