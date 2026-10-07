import { ref, computed } from 'vue';
import { toast } from 'vue3-toastify';
import { useAppStore } from '@/stores/appStore';
import { syncDataDualPath } from '@/utils/githubSync';

const STORAGE_KEY = 'sbe_staged_sample_room';
const stagedSampleRoom = ref({});

try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    stagedSampleRoom.value = JSON.parse(saved);
  }
} catch (e) {
  stagedSampleRoom.value = {};
}

const persistStaged = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stagedSampleRoom.value));
  } catch (e) {}
};

export function useSampleRoomTagger() {
  const appStore = useAppStore();
  const isCommitting = ref(false);

  const stagedList = computed(() => {
    return Object.values(stagedSampleRoom.value);
  });

  const stagedCount = computed(() => {
    return Object.keys(stagedSampleRoom.value).length;
  });

  const getEffectiveInSampleRoom = (product) => {
    if (!product) return false;
    const name = product.productName;
    if (stagedSampleRoom.value[name] !== undefined) {
      return stagedSampleRoom.value[name].inSampleRoom;
    }
    return !!product.inSampleRoom;
  };

  const isProductStaged = (productName) => {
    return stagedSampleRoom.value[productName] !== undefined;
  };

  const stageToggle = (product, origVal) => {
    if (!product || !product.productName) return;
    const name = product.productName;
    const currentVal = getEffectiveInSampleRoom(product);
    const newVal = !currentVal;

    const original = origVal !== undefined ? !!origVal : !!product.inSampleRoom;

    if (newVal === original) {
      delete stagedSampleRoom.value[name];
    } else {
      stagedSampleRoom.value[name] = {
        productName: name,
        groupName: product.groupName || '',
        imageUrl: product.imageUrl || null,
        inSampleRoom: newVal,
        original,
        timestamp: Date.now(),
      };
    }
    persistStaged();
  };

  const stageBatchSet = (products, newVal) => {
    if (!Array.isArray(products)) return;
    products.forEach((p) => {
      const original = !!p.inSampleRoom;
      if (newVal === original) {
        delete stagedSampleRoom.value[p.productName];
      } else {
        stagedSampleRoom.value[p.productName] = {
          productName: p.productName,
          groupName: p.groupName || '',
          imageUrl: p.imageUrl || null,
          inSampleRoom: newVal,
          original,
          timestamp: Date.now(),
        };
      }
    });
    persistStaged();
  };

  const discardSingle = (productName) => {
    if (stagedSampleRoom.value[productName]) {
      delete stagedSampleRoom.value[productName];
      persistStaged();
    }
  };

  const discardAll = () => {
    stagedSampleRoom.value = {};
    persistStaged();
    toast.info('Discarded all pending sample room changes.', { autoClose: 2000 });
  };

  const commitStaged = async (customMessage = '') => {
    if (stagedCount.value === 0) {
      toast.info('No changes to commit.', { autoClose: 2500 });
      return { success: false, reason: 'empty' };
    }

    const count = stagedCount.value;
    isCommitting.value = true;
    const toastId = toast.loading(`Committing ${count} Sample Room changes to GitHub...`, {
      autoClose: false,
      closeButton: false,
    });

    try {
      const updatesMap = {};
      Object.values(stagedSampleRoom.value).forEach((item) => {
        updatesMap[item.productName] = item.inSampleRoom;
      });

      // 1. Fetch freshest catalog
      let fullCatalog = null;
      try {
        const REMOTE_URL = 'https://raw.githubusercontent.com/sahilsync07/sbe/refs/heads/main/frontend/public/assets/stock-data.json';
        const res = await fetch(`${REMOTE_URL}?_t=${Date.now()}`);
        if (res.ok) fullCatalog = await res.json();
      } catch (e) {
        console.warn('[SampleRoomTagger] Remote stock fetch failed, using memory:', e);
      }

      if (!fullCatalog || !Array.isArray(fullCatalog)) {
        fullCatalog = JSON.parse(JSON.stringify(appStore.stockData));
      }

      // 2. Apply updates
      fullCatalog.forEach((group) => {
        if (!group.products) return;
        group.products.forEach((p) => {
          if (p.productName in updatesMap) {
            p.inSampleRoom = updatesMap[p.productName];
          }
        });
      });

      const jsonString = JSON.stringify(fullCatalog, null, 2);
      const commitMessage = customMessage.trim() || `Update Sample Room status for ${count} items`;

      // 3. Dual-sync
      const syncResult = await syncDataDualPath({
        backendEndpoint: '/api/updateSampleRoom',
        backendPayload: { updates: updatesMap, commitMessage },
        githubFilePathFrontend: 'frontend/public/assets/stock-data.json',
        githubFilePathHub: 'sbe-hub/public/assets/stock-data.json',
        contentJsonString: jsonString,
        commitMessage,
      });

      // 4. Update in-memory
      appStore.setStockData(fullCatalog);
      try {
        localStorage.setItem('sbe-stock-cache', JSON.stringify(fullCatalog));
      } catch (_) {}

      stagedSampleRoom.value = {};
      persistStaged();

      toast.remove(toastId);
      toast.success(`✓ Successfully committed ${count} Sample Room updates!`, { autoClose: 3500 });
      return { success: true, count, via: syncResult.via };
    } catch (err) {
      console.error('[SampleRoomTagger] Commit failed:', err);
      toast.remove(toastId);
      toast.error(`Commit failed: ${err.message}`, { autoClose: 5000 });
      return { success: false, error: err.message };
    } finally {
      isCommitting.value = false;
    }
  };

  return {
    stagedSampleRoom,
    stagedList,
    stagedCount,
    isCommitting,
    getEffectiveInSampleRoom,
    isProductStaged,
    stageToggle,
    stageBatchSet,
    discardSingle,
    discardAll,
    commitStaged,
  };
}
