import { ref, computed } from 'vue';
import { toast } from 'vue3-toastify';
import { useLedgerData } from './useLedgerData';
import { syncDataDualPath } from '@/utils/githubSync';

const STAGED_STORAGE_KEY = 'sbe_staged_party_tags';
const stagedParties = ref({});

// Load persisted staged parties from localStorage
try {
  const saved = localStorage.getItem(STAGED_STORAGE_KEY);
  if (saved) {
    stagedParties.value = JSON.parse(saved);
  }
} catch (e) {
  stagedParties.value = {};
}

const persistStaged = () => {
  try {
    localStorage.setItem(STAGED_STORAGE_KEY, JSON.stringify(stagedParties.value));
  } catch (e) {}
};

export function usePartyTagger() {
  const { ledgerData, updateLedgerDataInMemory } = useLedgerData();
  const isCommitting = ref(false);

  const stagedList = computed(() => {
    return Object.values(stagedParties.value);
  });

  const stagedCount = computed(() => {
    return Object.keys(stagedParties.value).length;
  });

  const getEffectiveParty = (ledger) => {
    if (!ledger) return {};
    const key = (ledger.ledgerName || '').trim().toLowerCase();
    const staged = stagedParties.value[key];
    if (staged) {
      return {
        ...ledger,
        partyType: staged.partyType,
        creditStatus: staged.creditStatus,
        settlementStatus: staged.settlementStatus,
        settlementNote: staged.settlementNote,
        settledAmount: staged.settledAmount,
        isStaged: true,
      };
    }
    return {
      ...ledger,
      partyType: ledger.partyType || 'retailer',
      creditStatus: ledger.creditStatus || 'normal',
      settlementStatus: ledger.settlementStatus || 'normal',
      settlementNote: ledger.settlementNote || '',
      settledAmount: ledger.settledAmount || 0,
      isStaged: false,
    };
  };

  const stagePartyChange = (ledger, updates) => {
    if (!ledger || !ledger.ledgerName) return;
    const key = ledger.ledgerName.trim().toLowerCase();

    const origPartyType = ledger.partyType || 'retailer';
    const origCreditStatus = ledger.creditStatus || 'normal';
    const origSettlementStatus = ledger.settlementStatus || 'normal';
    const origSettlementNote = ledger.settlementNote || '';
    const origSettledAmount = ledger.settledAmount || 0;

    const currentStaged = stagedParties.value[key] || {};

    const newPartyType = updates.partyType !== undefined ? updates.partyType : (currentStaged.partyType || origPartyType);
    const newCreditStatus = updates.creditStatus !== undefined ? updates.creditStatus : (currentStaged.creditStatus || origCreditStatus);
    const newSettlementStatus = updates.settlementStatus !== undefined ? updates.settlementStatus : (currentStaged.settlementStatus || origSettlementStatus);
    const newSettlementNote = updates.settlementNote !== undefined ? updates.settlementNote : (currentStaged.settlementNote !== undefined ? currentStaged.settlementNote : origSettlementNote);
    const newSettledAmount = updates.settledAmount !== undefined ? updates.settledAmount : (currentStaged.settledAmount !== undefined ? currentStaged.settledAmount : origSettledAmount);

    // Check if exactly equals original
    const isUnchanged =
      newPartyType === origPartyType &&
      newCreditStatus === origCreditStatus &&
      newSettlementStatus === origSettlementStatus &&
      newSettlementNote.trim() === origSettlementNote.trim() &&
      Number(newSettledAmount) === Number(origSettledAmount);

    if (isUnchanged) {
      delete stagedParties.value[key];
    } else {
      stagedParties.value[key] = {
        ledgerName: ledger.ledgerName,
        groupName: ledger.groupName || '',
        partyType: newPartyType,
        creditStatus: newCreditStatus,
        settlementStatus: newSettlementStatus,
        settlementNote: newSettlementNote,
        settledAmount: newSettledAmount,
        original: {
          partyType: origPartyType,
          creditStatus: origCreditStatus,
          settlementStatus: origSettlementStatus,
          settlementNote: origSettlementNote,
          settledAmount: origSettledAmount,
        },
        timestamp: Date.now(),
      };
    }

    persistStaged();
  };

  const discardSingleChange = (ledgerName) => {
    const key = (ledgerName || '').trim().toLowerCase();
    if (stagedParties.value[key]) {
      delete stagedParties.value[key];
      persistStaged();
    }
  };

  const discardAllChanges = () => {
    stagedParties.value = {};
    persistStaged();
    toast.info('All staged party changes discarded.', { autoClose: 2000 });
  };

  const commitStagedParties = async (customMessage = '') => {
    if (stagedCount.value === 0) {
      toast.info('No staged changes to commit.', { autoClose: 2500 });
      return { success: false, reason: 'empty' };
    }

    const count = stagedCount.value;
    isCommitting.value = true;
    const toastId = toast.loading(`Committing tags for ${count} parties...`, {
      autoClose: false,
      closeButton: false,
    });

    try {
      // 1. Prepare updates payload map
      const updatesMap = {};
      Object.values(stagedParties.value).forEach((item) => {
        updatesMap[item.ledgerName] = {
          partyType: item.partyType,
          creditStatus: item.creditStatus,
          settlementStatus: item.settlementStatus,
          settlementNote: item.settlementNote,
          settledAmount: item.settledAmount,
        };
      });

      // 2. Fetch freshest ledger-data.json
      let fullLedgerCatalog = null;
      try {
        const REMOTE_URL = 'https://raw.githubusercontent.com/sahilsync07/sbe/refs/heads/main/frontend/public/assets/ledger-data.json';
        const res = await fetch(`${REMOTE_URL}?_t=${Date.now()}`);
        if (res.ok) {
          fullLedgerCatalog = await res.json();
        }
      } catch (e) {
        console.warn('[PartyTagger] Remote ledger fetch failed, using memory:', e);
      }

      if (!fullLedgerCatalog || !Array.isArray(fullLedgerCatalog)) {
        fullLedgerCatalog = JSON.parse(JSON.stringify(ledgerData.value));
      }

      // 3. Apply updates to full catalog
      const keysMap = Object.keys(updatesMap).reduce((acc, k) => {
        acc[k.trim().toLowerCase()] = updatesMap[k];
        return acc;
      }, {});

      fullLedgerCatalog.forEach((group) => {
        (group.ledgers || []).forEach((l) => {
          const key = (l.ledgerName || '').trim().toLowerCase();
          if (keysMap[key]) {
            const u = keysMap[key];
            l.partyType = u.partyType;
            l.creditStatus = u.creditStatus;
            l.settlementStatus = u.settlementStatus;
            l.settlementNote = u.settlementNote;
            l.settledAmount = u.settledAmount;
          }
        });
      });

      const jsonString = JSON.stringify(fullLedgerCatalog, null, 2);
      const commitMessage = customMessage.trim() || `Update tags for ${count} parties (Wholesalers, Bad Debts, Settled)`;

      // 4. Dual-sync commit
      const syncResult = await syncDataDualPath({
        backendEndpoint: '/api/ledger/updateBatchMeta',
        backendPayload: { updates: updatesMap, commitMessage },
        githubFilePathFrontend: 'frontend/public/assets/ledger-data.json',
        githubFilePathHub: 'sbe-hub/public/assets/ledger-data.json',
        contentJsonString: jsonString,
        commitMessage,
      });

      // 5. Update in-memory state
      updateLedgerDataInMemory(fullLedgerCatalog);
      stagedParties.value = {};
      persistStaged();

      toast.remove(toastId);
      toast.success(`✓ Successfully committed tags for ${count} parties!`, { autoClose: 3500 });
      return { success: true, count, via: syncResult.via };
    } catch (err) {
      console.error('[PartyTagger] Commit failed:', err);
      toast.remove(toastId);
      toast.error(`Commit failed: ${err.message}`, { autoClose: 5000 });
      return { success: false, error: err.message };
    } finally {
      isCommitting.value = false;
    }
  };

  return {
    stagedParties,
    stagedList,
    stagedCount,
    isCommitting,
    getEffectiveParty,
    stagePartyChange,
    discardSingleChange,
    discardAllChanges,
    commitStagedParties,
  };
}
