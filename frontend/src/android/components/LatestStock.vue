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
      <div class="flex flex-col items-end gap-1">
        <button v-if="state === 'folders'" @click="startDownload" class="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors">
          <i class="fa-solid fa-arrows-rotate mr-1"></i> Re-download
        </button>
        <span v-if="lastDownloadDate" class="text-[10px] text-slate-500">
          <i class="fa-solid fa-clock mr-1"></i>{{ lastDownloadLabel }}
        </span>
      </div>
    </div>

    <!-- State 1: Landing -->
    <div v-if="state === 'landing'" class="flex-1 flex flex-col items-center justify-center px-8 space-y-8">
      <div class="w-28 h-28 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-2xl shadow-amber-500/30">
        <i class="fa-solid fa-download text-4xl text-white"></i>
      </div>
      <div class="text-center space-y-2">
        <h2 class="text-2xl font-black">Download Latest Stock</h2>
        <p class="text-slate-400 text-sm max-w-xs">Download formatted catalog images with product details, ready to share on WhatsApp</p>
      </div>
      <button 
        @click="startDownload"
        class="w-full max-w-xs py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black text-lg rounded-2xl shadow-xl shadow-amber-500/25 active:scale-[0.97] transition-all flex items-center justify-center gap-3"
      >
        <i class="fa-solid fa-bolt"></i>
        Start Download
      </button>
      <p class="text-[11px] text-slate-500">{{ GROUPS.length }} categories • Formatted catalog pages</p>
    </div>

    <!-- State 2: Downloading -->
    <div v-else-if="state === 'downloading'" class="flex-1 flex flex-col px-6 py-8 overflow-hidden">
      <!-- Overall progress -->
      <div class="mb-6 space-y-3">
        <div class="flex justify-between items-center">
          <span class="text-xs font-black text-slate-400 uppercase tracking-widest">Overall Progress</span>
          <span class="text-sm font-black text-amber-400">{{ globalTotal > 0 ? Math.round((globalDone / globalTotal) * 100) : 0 }}%</span>
        </div>
        <div class="h-3 w-full bg-white/10 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-300 ease-out" 
               :style="{ width: globalTotal > 0 ? `${(globalDone / globalTotal) * 100}%` : '0%' }"></div>
        </div>
        <div class="text-xs text-slate-400 text-center">{{ globalDone }} / {{ globalTotal }} pages rendered</div>
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
          <span class="text-xs font-bold text-emerald-400">✓ {{ g.count }} pages</span>
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
            {{ group.fileUris.length }} pages
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
import { jsPDF } from 'jspdf';
import axios from 'axios';

const STORAGE_KEY = 'sbe_latest_stock';

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
      state: 'landing',
      stockData: [],

      // Download state
      globalDone: 0,
      globalTotal: 0,
      currentGroupIcon: '',
      currentGroupName: '',
      currentGroupProgress: '',
      groupPct: 0,
      completedGroups: [],
      downloadedGroups: [],

      // Persistence
      lastDownloadDate: null,

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
    totalBatches() { return this.batchList.length; },
    currentBatchSize() { return this.batchList[this.currentBatchIndex]?.length || 0; },
    lastDownloadLabel() {
      if (!this.lastDownloadDate) return '';
      const d = new Date(this.lastDownloadDate);
      const now = new Date();
      const diffH = (now - d) / (1000 * 60 * 60);
      if (diffH < 1) return 'Downloaded just now';
      if (diffH < 24) return `Downloaded ${Math.floor(diffH)}h ago`;
      const diffD = Math.floor(diffH / 24);
      if (diffD === 1) return 'Downloaded yesterday';
      return `Downloaded ${diffD} days ago`;
    }
  },

  async mounted() {
    try {
      const res = await fetch('./assets/stock-data.json');
      this.stockData = await res.json();
    } catch (e) {
      console.error('Failed to load stock data', e);
    }

    await this.restoreFromCache();

    // Auto-download if stale (>24h) or never downloaded
    if (this.state === 'landing' || this.isStale()) {
      this.startDownload();
    }
  },

  methods: {
    isStale() {
      if (!this.lastDownloadDate) return true;
      return (Date.now() - new Date(this.lastDownloadDate).getTime()) / (1000 * 60 * 60) >= 24;
    },

    async restoreFromCache() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;
        const data = JSON.parse(saved);
        this.lastDownloadDate = data.downloadedAt;
        if (!data.groups || data.groups.length === 0) return;

        // Verify first file still exists
        const testUri = data.groups[0]?.fileUris?.[0];
        if (testUri) {
          try { await Filesystem.stat({ path: testUri }); }
          catch { localStorage.removeItem(STORAGE_KEY); this.lastDownloadDate = null; return; }
        }
        this.downloadedGroups = data.groups;
        this.state = 'folders';
      } catch (e) { console.error('Restore failed', e); }
    },

    saveToCache() {
      const data = {
        downloadedAt: new Date().toISOString(),
        groups: this.downloadedGroups.map(g => ({ folder: g.folder, icon: g.icon, fileUris: g.fileUris }))
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      this.lastDownloadDate = data.downloadedAt;
    },

    async clearOldFiles() {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      try {
        const data = JSON.parse(saved);
        for (const group of (data.groups || [])) {
          for (const uri of (group.fileUris || [])) {
            try {
              const fileName = uri.split('/').pop();
              await Filesystem.deleteFile({ path: fileName, directory: Directory.Data });
            } catch { /* already gone */ }
          }
        }
      } catch { /* ignore */ }
    },

    // ─── PDF GENERATION (same as PdfGenerator) ─────────────────────────────

    async fetchImageAsBase64(url) {
      const res = await axios.get(url, { responseType: 'arraybuffer' });
      const base64 = btoa(new Uint8Array(res.data).reduce((data, byte) => data + String.fromCharCode(byte), ''));
      return `data:${res.headers['content-type']};base64,${base64}`;
    },

    getImageDimensions(base64) {
      return new Promise((resolve) => {
        const i = new Image();
        i.onload = () => resolve({ width: i.width, height: i.height });
        i.src = base64;
      });
    },

    async generatePdfBlob(groups) {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let hasAddedPage = false;

      for (const group of groups) {
        let isFirstProductInBrand = true;

        for (const product of group.products) {
          if (hasAddedPage) doc.addPage();
          hasAddedPage = true;

          // Background
          doc.setFillColor('#faf8f6');
          doc.rect(0, 0, pageWidth, pageHeight, 'F');

          // Top wave
          doc.setDrawColor('#e0e0e0');
          doc.setLineWidth(3);
          doc.path([
            { op: 'm', c: [0, 0] },
            { op: 'l', c: [200, 80] },
            { op: 'c', c: [266, 26, 400, 33, 600, 100] }
          ]);
          doc.stroke();

          // Bottom wave
          doc.path([
            { op: 'm', c: [0, pageHeight] },
            { op: 'l', c: [250, pageHeight - 100] },
            { op: 'c', c: [316, pageHeight - 33, 433, pageHeight - 16, 600, pageHeight - 50] }
          ]);
          doc.stroke();

          // Brand header (first product only)
          if (isFirstProductInBrand) {
            doc.setTextColor(200, 200, 200);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(28);
            doc.text(group.groupName, pageWidth / 2, 35, { align: 'center' });
            isFirstProductInBrand = false;
          }

          // Product image
          if (product.imageUrl) {
            try {
              const imgData = await this.fetchImageAsBase64(product.imageUrl);
              const dims = await this.getImageDimensions(imgData);
              const maxWidth = pageWidth - 40;
              const maxHeight = pageHeight - 150;
              const scale = Math.min(maxWidth / dims.width, maxHeight / dims.height, 1);
              const finalWidth = dims.width * scale;
              const finalHeight = dims.height * scale;
              const x = (pageWidth - finalWidth) / 2;
              const y = 60;

              doc.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight);

              const textY = y + finalHeight + 25;
              doc.setTextColor(0, 0, 0);
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(16);
              doc.text(product.productName, pageWidth / 2, textY, { align: 'center' });

              doc.setTextColor(212, 0, 0);
              doc.setFontSize(18);
              doc.text(`Qty: ${product.quantity}`, pageWidth / 2, textY + 30, { align: 'center' });
            } catch {
              doc.setTextColor(0);
              doc.setFontSize(16);
              doc.text('Image Load Failed', pageWidth / 2, pageHeight / 2, { align: 'center' });
            }
          } else {
            doc.setTextColor(0);
            doc.setFontSize(20);
            doc.text(product.productName, pageWidth / 2, pageHeight / 2 - 20, { align: 'center' });
            doc.text(`Qty: ${product.quantity}`, pageWidth / 2, pageHeight / 2 + 20, { align: 'center' });
          }
        }
      }

      return doc.output('blob');
    },

    // ─── RENDER PDF TO IMAGES ──────────────────────────────────────────────

    async renderPdfToImages(pdfBlob, folderPrefix, onPage) {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const pdfUrl = URL.createObjectURL(pdfBlob);
      const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
      const fileUris = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;

        // Convert to base64 JPEG
        const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
        const fileName = `ls_${folderPrefix}_page${pageNum}.jpg`;

        const saved = await Filesystem.writeFile({
          path: fileName,
          data: base64,
          directory: Directory.Data
        });

        fileUris.push(saved.uri);
        if (onPage) onPage(pageNum, pdf.numPages);
      }

      URL.revokeObjectURL(pdfUrl);
      return fileUris;
    },

    // ─── MAIN DOWNLOAD ─────────────────────────────────────────────────────

    async startDownload() {
      await this.clearOldFiles();
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

      // Collect filtered products per group
      const allGroupProducts = [];
      let grandTotal = 0;

      for (const config of GROUPS) {
        const matchedGroups = [];
        for (const brandName of config.brands) {
          const entry = groupMap.get(normalize(brandName));
          if (!entry) continue;
          const filteredProducts = entry.products.filter(p => {
            if (config.onlyWithPhotos && !p.imageUrl) return false;
            if (config.minQty > 0 && p.quantity < config.minQty) return false;
            return true;
          });
          if (filteredProducts.length > 0) {
            matchedGroups.push({ groupName: entry.groupName, products: filteredProducts });
            grandTotal += filteredProducts.length;
          }
        }
        allGroupProducts.push({ config, matchedGroups });
      }

      this.globalTotal = grandTotal;

      // For each config group, generate PDF → render to images
      for (const { config, matchedGroups } of allGroupProducts) {
        if (matchedGroups.length === 0) {
          this.completedGroups.push({ icon: config.icon, name: config.folder, count: 0 });
          continue;
        }

        this.currentGroupIcon = config.icon;
        this.currentGroupName = config.folder;
        this.currentGroupProgress = 'Generating PDF...';
        this.groupPct = 0;

        try {
          // Step 1: Generate styled PDF blob
          const pdfBlob = await this.generatePdfBlob(matchedGroups);

          // Step 2: Render PDF pages to JPEG
          this.currentGroupProgress = 'Rendering pages...';
          const safeFolder = config.folder.replace(/[^a-zA-Z0-9]/g, '_');

          const fileUris = await this.renderPdfToImages(pdfBlob, safeFolder, (pageNum, total) => {
            this.currentGroupProgress = `${pageNum} / ${total} pages`;
            this.groupPct = (pageNum / total) * 100;
            this.globalDone++;
          });

          if (fileUris.length > 0) {
            this.downloadedGroups.push({ folder: config.folder, icon: config.icon, fileUris });
          }

          this.completedGroups.push({ icon: config.icon, name: config.folder, count: fileUris.length });
        } catch (err) {
          console.error(`Failed group ${config.folder}:`, err);
          this.completedGroups.push({ icon: config.icon, name: config.folder, count: 0 });
        }
      }

      this.saveToCache();
      this.state = 'folders';
      this.toast(`Generated ${this.globalDone} catalog pages across ${this.downloadedGroups.length} categories`);
    },

    // ─── SHARING ───────────────────────────────────────────────────────────

    async shareGroup(group) {
      const chunkSize = 99;
      const batches = [];
      for (let i = 0; i < group.fileUris.length; i += chunkSize) {
        batches.push(group.fileUris.slice(i, i + chunkSize));
      }

      if (batches.length === 1) {
        try {
          await Share.share({ files: batches[0] });
          this.toast(`Shared ${group.folder} (${batches[0].length} pages)`);
        } catch (e) {
          if (e.message !== 'Share canceled') this.toast('Share cancelled or failed');
        }
      } else {
        this.sharingGroupName = group.folder;
        this.batchList = batches;
        this.currentBatchIndex = 0;
        this.isSharing = true;
      }
    },

    async executeBatchShare() {
      try {
        await Share.share({ files: this.batchList[this.currentBatchIndex] });
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

    cancelShare() { this.isSharing = false; },

    toast(msg) {
      this.toastMessage = msg;
      this.showToast = true;
      setTimeout(() => this.showToast = false, 4000);
    }
  }
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
</style>
