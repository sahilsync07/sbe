<template>
  <div class="flex flex-col h-screen w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 font-sans text-white overflow-hidden">
    
    <!-- Header -->
    <div class="px-5 py-4 flex items-center justify-between border-b border-white/10 bg-white/5 backdrop-blur-sm" style="padding-top: max(env(safe-area-inset-top, 20px), 16px)">
      <div class="flex items-center gap-3">
        <button @click="$router.push('/pdf-gen')" class="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
          <i class="fa-solid fa-arrow-left text-sm"></i>
        </button>
        <div>
          <h1 class="text-lg font-black tracking-tight">Latest Stock</h1>
          <p class="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Sri Brundabana Enterprises</p>
        </div>
      </div>
      <button v-if="state === 'folders'" @click="startDownload" class="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors">
        <i class="fa-solid fa-arrows-rotate mr-1"></i> Re-download
      </button>
    </div>

    <!-- State 1: Landing -->
    <div v-if="state === 'landing'" class="flex-1 flex flex-col items-center justify-center px-8 space-y-8">
      <div class="w-28 h-28 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-2xl shadow-amber-500/30">
        <i class="fa-solid fa-download text-4xl text-white"></i>
      </div>
      <div class="text-center space-y-2">
        <h2 class="text-2xl font-black">Download Latest Stock</h2>
        <p class="text-slate-400 text-sm max-w-xs">Download all product images organized by category, ready to share on WhatsApp</p>
      </div>
      <button 
        @click="startDownload"
        class="w-full max-w-xs py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black text-lg rounded-2xl shadow-xl shadow-amber-500/25 active:scale-[0.97] transition-all flex items-center justify-center gap-3"
      >
        <i class="fa-solid fa-bolt"></i>
        Start Download
      </button>
      <p class="text-[11px] text-slate-500">{{ GROUPS.length }} categories • {{ totalProductCount }} products</p>
    </div>

    <!-- State 2: Downloading -->
    <div v-else-if="state === 'downloading'" class="flex-1 flex flex-col px-6 py-8 overflow-hidden">
      <!-- Overall progress -->
      <div class="mb-6 space-y-3">
        <div class="flex justify-between items-center">
          <span class="text-xs font-black text-slate-400 uppercase tracking-widest">Overall Progress</span>
          <span class="text-sm font-black text-amber-400">{{ Math.round((globalDone / globalTotal) * 100) }}%</span>
        </div>
        <div class="h-3 w-full bg-white/10 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-300 ease-out" 
               :style="{ width: `${(globalDone / globalTotal) * 100}%` }"></div>
        </div>
        <div class="text-xs text-slate-400 text-center">{{ globalDone }} / {{ globalTotal }} images</div>
      </div>

      <!-- Current group -->
      <div class="bg-white/5 border border-white/10 rounded-2xl p-5 mb-4">
        <div class="flex items-center gap-3 mb-3">
          <span class="text-2xl">{{ currentGroupIcon }}</span>
          <div>
            <div class="font-bold text-white">{{ currentGroupName }}</div>
            <div class="text-[11px] text-slate-400">{{ currentGroupProgress }}</div>
          </div>
        </div>
        <div class="h-2 w-full bg-white/10 rounded-full overflow-hidden">
          <div class="h-full bg-emerald-400 rounded-full transition-all duration-200" 
               :style="{ width: `${groupPct}%` }"></div>
        </div>
      </div>

      <!-- Group completion list -->
      <div class="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
        <div v-for="(g, i) in completedGroups" :key="i" 
             class="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
          <span>{{ g.icon }}</span>
          <span class="flex-1 text-sm font-medium text-slate-300 truncate">{{ g.name }}</span>
          <span class="text-xs font-bold text-emerald-400">✓ {{ g.count }}</span>
        </div>
      </div>
    </div>

    <!-- State 3: Folder Grid -->
    <div v-else-if="state === 'folders'" class="flex-1 overflow-y-auto px-4 py-5 space-y-3 pb-8 custom-scrollbar">
      <div 
        v-for="(group, idx) in downloadedGroups" 
        :key="idx"
        @click="shareGroup(group)"
        class="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 active:scale-[0.98] transition-all cursor-pointer"
      >
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-2xl flex-shrink-0">
          {{ group.icon }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-bold text-white truncate">{{ group.folder }}</div>
          <div class="text-xs text-slate-400 mt-0.5">
            {{ group.fileUris.length }} images
            <span v-if="group.fileUris.length > 99" class="text-amber-400 ml-1">
              • {{ Math.ceil(group.fileUris.length / 99) }} batches
            </span>
          </div>
        </div>
        <div class="flex-shrink-0">
          <div class="w-10 h-10 rounded-full bg-[#25D366]/20 flex items-center justify-center">
            <i class="fa-brands fa-whatsapp text-[#25D366] text-lg"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Sharing Overlay -->
    <div v-if="isSharing" class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm">
      <div class="bg-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-white/10 space-y-6">
        <div class="text-center space-y-2">
          <div class="w-16 h-16 bg-[#25D366]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fa-brands fa-whatsapp text-3xl text-[#25D366]"></i>
          </div>
          <h3 class="text-xl font-black text-white">{{ sharingGroupName }}</h3>
          <p class="text-slate-400 text-sm">
            Batch {{ currentBatchIndex + 1 }} of {{ totalBatches }}
            <br><span class="text-xs">({{ currentBatchSize }} images in this batch)</span>
          </p>
        </div>

        <div class="h-2 w-full bg-white/10 rounded-full overflow-hidden">
          <div class="h-full bg-[#25D366] rounded-full transition-all duration-300" 
               :style="{ width: `${((currentBatchIndex) / totalBatches) * 100}%` }"></div>
        </div>

        <button 
          @click="executeBatchShare"
          class="w-full py-4 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-xl shadow-xl active:scale-[0.95] transition-all flex items-center justify-center gap-3 text-lg"
        >
          <span>Share Batch {{ currentBatchIndex + 1 }}</span>
          <i class="fa-solid fa-arrow-right"></i>
        </button>

        <button @click="cancelShare" class="w-full py-3 text-slate-500 font-bold hover:text-slate-300 transition-colors">
          Cancel
        </button>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="showToast" class="fixed bottom-20 left-4 right-4 z-[60]">
      <div class="bg-slate-700 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-white/10">
        <i class="fa-solid fa-circle-check text-emerald-400"></i>
        <span class="font-medium text-sm">{{ toastMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const GROUPS = [
  { folder: 'Cubix', brands: ['CUBIX', 'CUBIX 2'], onlyWithPhotos: true, minQty: 6, icon: '👟' },
  { folder: 'Florex', brands: ['Florex (Swastik)'], onlyWithPhotos: true, minQty: 6, icon: '🌸' },
  { folder: 'Action', brands: ['ACTION'], onlyWithPhotos: true, minQty: 6, icon: '⚡' },
  { folder: 'Paragon Gents', brands: ['PARAGON GENTS'], onlyWithPhotos: true, minQty: 8, icon: '👞' },
  { folder: 'Eeken', brands: ['EEKEN'], onlyWithPhotos: true, minQty: 4, icon: '🏃' },
  { folder: 'Meriva and Paragon Ladies', brands: ['Meriva', 'PARAGON LADIES'], onlyWithPhotos: true, minQty: 4, icon: '👠' },
  {
    folder: 'Loose General Packing',
    brands: ['ASHU', 'PANKAJ PLASTIC', 'TARA', 'J.K Plastic', 'Magnet', 'Maruti Plastics',
      'AAGAM POLYMER', 'A G ENTERPRISES', 'NAV DURGA ENTERPRISES', 'NEXUS', 'R K TRADERS',
      'SRG Enterprises', 'Vardhman Plastics', 'YASH FOOTWEAR', 'KRishna Agency', 'SHYAM',
      'AVTAR V V POLYMERS', 'ATHARV PLASTIC'],
    onlyWithPhotos: true, minQty: 4, icon: '📦'
  },
  {
    folder: 'Box Packing',
    brands: ['ADDA', 'ADDOXY', 'AIRFAX', 'Hitway', 'Paris', 'TEUZ', 'VAISHNO PLASTIC',
      'AGRA', 'R R POLYPLAST', 'AIRSON', 'AMBIKA FOOTWEAR', 'GOKUL FOOTWEAR',
      'NEXGEN FOOTWEAR', 'KOHINOOR', 'UAM FOOTWEAR'],
    onlyWithPhotos: true, minQty: 4, icon: '📥'
  },
  { folder: 'Solea Disc 40 Percent Offer', brands: ['SOLEA DISC 40% OFFER'], onlyWithPhotos: true, minQty: 0, icon: '🏷️' },
  { folder: 'Reliance Footwear', brands: ['RELIANCE FOOTWEAR'], onlyWithPhotos: true, minQty: 4, icon: '🔷' },
  { folder: 'Paralite', brands: ['PARALITE'], onlyWithPhotos: true, minQty: 8, icon: '🔶' },
  { folder: 'P-Toes Paralite', brands: ['P-TOES PARALITE'], onlyWithPhotos: true, minQty: 8, icon: '🟠' },
  { folder: 'Socks', brands: ['BArun', 'PAreek Soucks', 'LEo'], onlyWithPhotos: true, minQty: 0, icon: '🧦' },
  { folder: 'School Shoe Durolite', brands: ['SCHOOL SHOE DUROLITE'], onlyWithPhotos: true, minQty: 0, icon: '🎒' },
];

export default {
  name: 'LatestStock',
  data() {
    return {
      GROUPS,
      state: 'landing', // landing | downloading | folders
      stockData: [],
      totalProductCount: 0,

      // Download state
      globalDone: 0,
      globalTotal: 0,
      currentGroupIcon: '',
      currentGroupName: '',
      currentGroupProgress: '',
      groupPct: 0,
      completedGroups: [],
      downloadedGroups: [], // { folder, icon, fileUris: [] }

      // Share state
      isSharing: false,
      sharingGroupName: '',
      batchList: [],
      currentBatchIndex: 0,

      // Toast
      showToast: false,
      toastMessage: '',
    };
  },

  computed: {
    totalBatches() {
      return this.batchList.length;
    },
    currentBatchSize() {
      return this.batchList[this.currentBatchIndex]?.length || 0;
    }
  },

  async mounted() {
    // Load stock data
    try {
      const res = await fetch('./assets/stock-data.json');
      this.stockData = await res.json();
    } catch (e) {
      console.error('Failed to load stock data', e);
    }
    
    // Pre-count total products
    this.totalProductCount = this.countProducts();
  },

  methods: {
    countProducts() {
      const normalize = (s) => s ? s.toLowerCase().trim() : '';
      const groupMap = new Map();
      for (const g of this.stockData) {
        if (g.groupName === '_META_DATA_') continue;
        groupMap.set(normalize(g.groupName), g);
      }

      let total = 0;
      for (const config of GROUPS) {
        for (const brandName of config.brands) {
          const entry = groupMap.get(normalize(brandName));
          if (!entry) continue;
          for (const prod of entry.products) {
            if (config.onlyWithPhotos && !prod.imageUrl) continue;
            if (config.minQty > 0 && prod.quantity < config.minQty) continue;
            total++;
          }
        }
      }
      return total;
    },

    async startDownload() {
      this.state = 'downloading';
      this.globalDone = 0;
      this.completedGroups = [];
      this.downloadedGroups = [];

      const normalize = (s) => s ? s.toLowerCase().trim() : '';
      const groupMap = new Map();
      for (const g of this.stockData) {
        if (g.groupName === '_META_DATA_') continue;
        groupMap.set(normalize(g.groupName), g);
      }

      // Collect all products per group
      const allGroupProducts = [];
      let grandTotal = 0;

      for (const config of GROUPS) {
        const products = [];
        for (const brandName of config.brands) {
          const entry = groupMap.get(normalize(brandName));
          if (!entry) continue;
          for (const prod of entry.products) {
            if (config.onlyWithPhotos && !prod.imageUrl) continue;
            if (config.minQty > 0 && prod.quantity < config.minQty) continue;
            products.push(prod);
          }
        }
        allGroupProducts.push({ config, products });
        grandTotal += products.length;
      }

      this.globalTotal = grandTotal;

      // Download each group
      for (const { config, products } of allGroupProducts) {
        this.currentGroupIcon = config.icon;
        this.currentGroupName = config.folder;
        this.currentGroupProgress = `0 / ${products.length}`;
        this.groupPct = 0;

        const fileUris = [];

        for (let i = 0; i < products.length; i++) {
          const prod = products[i];
          this.currentGroupProgress = `${i + 1} / ${products.length}`;
          this.groupPct = ((i + 1) / products.length) * 100;

          try {
            // Fetch image
            const response = await fetch(prod.imageUrl);
            const blob = await response.blob();

            // Convert to base64
            const base64 = await this.blobToBase64(blob);

            // Determine filename
            const safeName = prod.productName.replace(/[^a-zA-Z0-9]/g, '_');
            const fileName = `lateststock_${safeName}_${i}.jpg`;

            // Write to cache
            const saved = await Filesystem.writeFile({
              path: fileName,
              data: base64,
              directory: Directory.Cache
            });

            fileUris.push(saved.uri);
          } catch (err) {
            console.error(`Failed to download: ${prod.productName}`, err);
          }

          this.globalDone++;
        }

        if (fileUris.length > 0) {
          this.downloadedGroups.push({
            folder: config.folder,
            icon: config.icon,
            fileUris
          });
        }

        this.completedGroups.push({
          icon: config.icon,
          name: config.folder,
          count: fileUris.length
        });
      }

      // Done downloading
      this.state = 'folders';
      this.toast(`Downloaded ${this.globalDone} images across ${this.downloadedGroups.length} categories`);
    },

    blobToBase64(blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          // Remove data:*;base64, prefix
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    },

    async shareGroup(group) {
      const chunkSize = 99;
      const batches = [];

      for (let i = 0; i < group.fileUris.length; i += chunkSize) {
        batches.push(group.fileUris.slice(i, i + chunkSize));
      }

      if (batches.length === 1) {
        // Direct share
        try {
          await Share.share({ files: batches[0] });
          this.toast(`Shared ${group.folder} (${batches[0].length} images)`);
        } catch (e) {
          if (e.message !== 'Share canceled') {
            this.toast('Share cancelled or failed');
          }
        }
      } else {
        // Batch share
        this.sharingGroupName = group.folder;
        this.batchList = batches;
        this.currentBatchIndex = 0;
        this.isSharing = true;
      }
    },

    async executeBatchShare() {
      try {
        const currentFiles = this.batchList[this.currentBatchIndex];
        await Share.share({ files: currentFiles });

        this.currentBatchIndex++;

        if (this.currentBatchIndex >= this.batchList.length) {
          this.isSharing = false;
          this.toast(`All batches shared for ${this.sharingGroupName}`);
        }
      } catch (e) {
        console.error('Batch share failed', e);
        this.isSharing = false;
        this.toast('Share cancelled');
      }
    },

    cancelShare() {
      this.isSharing = false;
    },

    toast(msg) {
      this.toastMessage = msg;
      this.showToast = true;
      setTimeout(() => this.showToast = false, 4000);
    }
  }
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.1);
  border-radius: 2px;
}
</style>
