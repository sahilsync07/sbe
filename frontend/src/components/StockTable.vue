<template>
  <div class="min-h-screen w-full p-4 bg-gray-100">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 bg-white py-2 px-4 shadow">
      <div class="flex items-center space-x-2">
        <img
          v-if="isAdmin && !isSuperAdmin"
          @click="updateStockData"
          src="https://res.cloudinary.com/dg365ewal/image/upload/v1749701539/cloud-sync_nznxzz.png"
          alt="Refresh Icon"
          class="w-10 h-10 object-contain cursor-pointer"
          :class="{ 'animate-spin': loading }"
        />
        <img
          v-if="isSuperAdmin"
          @click="toggleLedgerView"
          src="https://res.cloudinary.com/dg365ewal/image/upload/v1753616091/accounting-book_vh3kg5.png"
          alt="Ledger Icon"
          class="w-10 h-10 object-contain cursor-pointer"
        />
        <div v-else-if="!isAdmin && !isSuperAdmin" class="w-10 h-10"></div>
      </div>
      <div class="text-2xl font-bold text-center flex-1 text-gray-800">
        SBE Rayagada
      </div>
      <img
        v-if="!isAdmin && !isSuperAdmin"
        @click="promptAdminLogin"
        src="https://res.cloudinary.com/dg365ewal/image/upload/v1749669514/software-engineer_dek6dl.png"
        alt="Admin Icon"
        class="w-12 h-12 object-contain cursor-pointer"
      />
      <div v-else class="w-12 h-12"></div>
    </div>

    <!-- Ledger View -->
    <div v-if="showLedgerView" class="text-center text-gray-800 font-bold text-lg mt-4">
      Tally Ledger Work in Progress
    </div>

    <!-- Main Content -->
    <div v-if="!showLedgerView">
      <div class="flex flex-wrap justify-center items-center mb-4 gap-3">
        <button @click="selectGroup('All')"
          :class="['flex items-center justify-center h-10 rounded-lg bg-white text-gray-800 font-bold text-sm w-[25%] sm:w-auto px-3',
                   selectedGroup === 'All' ? 'bg-white text-gray-800' : 'hover:bg-gray-200']">
          All
        </button>

        <!-- Brand Logos -->
        <button v-for="brand in brands" :key="brand.name" @click="selectGroup(brand.name)"
          :class="['flex items-center justify-center h-10 rounded-lg bg-white text-gray-800 font-bold text-sm w-[25%] sm:w-auto px-3',
                   selectedGroup === brand.name ? 'bg-white text-gray-800' : 'hover:bg-gray-200']">
          <img :src="brand.logo" :alt="`${brand.name} Logo`" class="w-full h-full object-contain" />
        </button>

        <!-- Category Buttons -->
        <button @click="selectGroup('Kids')"
          :class="['flex items-center justify-center h-10 rounded-lg bg-white text-gray-800 font-bold text-sm w-[25%] sm:w-auto px-3',
                   selectedGroup === 'Kids' ? 'bg-white text-gray-800' : 'hover:bg-gray-200']">Kids</button>
        <button @click="selectGroup('Hawai')"
          :class="['flex items-center justify-center h-10 rounded-lg bg-white text-gray-800 font-bold text-sm w-[25%] sm:w-auto px-3',
                   selectedGroup === 'Hawai' ? 'bg-white text-gray-800' : 'hover:bg-gray-200']">Hawai</button>
        <button @click="selectGroup('Loose')"
          :class="['flex items-center justify-center h-10 rounded-lg bg-white text-gray-800 font-bold text-sm w-[25%] sm:w-auto px-3',
                   selectedGroup === 'Loose' ? 'bg-white text-gray-800' : 'hover:bg-gray-200']">Loose</button>
        <button @click="selectGroup('Box')"
          :class="['flex items-center justify-center h-10 rounded-lg bg-white text-gray-800 font-bold text-sm w-[25%] sm:w-auto px-3',
                   selectedGroup === 'Box' ? 'bg-white text-gray-800' : 'hover:bg-gray-200']">Box</button>
        <button @click="selectGroup('Shoe')"
          :class="['flex items-center justify-center h-10 rounded-lg bg-white text-gray-800 font-bold text-sm w-[25%] sm:w-auto px-3',
                   selectedGroup === 'Shoe' ? 'bg-white text-gray-800' : 'hover:bg-gray-200']">Shoe</button>
        <button @click="selectGroup('Maruti')"
          :class="['flex items-center justify-center h-10 rounded-lg bg-white text-gray-800 font-bold text-sm w-[25%] sm:w-auto px-3',
                   selectedGroup === 'Maruti' ? 'bg-white text-gray-800' : 'hover:bg-gray-200']">Maruti</button>
        <button @click="selectGroup('Magnet')"
          :class="['flex items-center justify-center h-10 rounded-lg bg-white text-gray-800 font-bold text-sm w-[25%] sm:w-auto px-3',
                   selectedGroup === 'Magnet' ? 'bg-white text-gray-800' : 'hover:bg-gray-200']">Magnet</button>
        <button @click="selectGroup('rktraders')"
          :class="['flex items-center justify-center h-10 rounded-lg bg-white text-gray-800 font-bold text-sm w-[25%] sm:w-auto px-3',
                   selectedGroup === 'rktraders' ? 'bg-white text-gray-800' : 'hover:bg-gray-200']">R.K.Traders</button>
        <button @click="selectGroup('jkplastic')"
          :class="['flex items-center justify-center h-10 rounded-lg bg-white text-gray-800 font-bold text-sm w-[25%] sm:w-auto px-3',
                   selectedGroup === 'jkplastic' ? 'bg-white text-gray-800' : 'hover:bg-gray-200']">J.K.Plastic</button>
        <button @click="selectGroup('airson')"
          :class="['flex items-center justify-center h-10 rounded-lg bg-white text-gray-800 font-bold text-sm w-[25%] sm:w-auto px-3',
                   selectedGroup === 'airson' ? 'bg-white text-gray-800' : 'hover:bg-gray-200']">Airson</button>

        <!-- NEW: General Items Button -->
        <button @click="selectGroup('General Items')"
          :class="['flex items-center justify-center h-10 rounded-lg bg-white text-gray-800 font-bold text-sm w-[25%] sm:w-auto px-3',
                   selectedGroup === 'General Items' ? 'bg-white text-gray-800' : 'hover:bg-gray-200']">
          General Items
        </button>
      </div>

      <!-- Search + Select + View Mode -->
      <div class="mb-4">
        <input v-model="searchQuery" type="text" placeholder="Search products..."
          class="w-full px-4 py-2 rounded-lg bg-white text-gray-800 border border-gray-300 focus:outline-none focus:border-blue-500" />
      </div>

      <div class="mb-4 flex flex-col sm:flex-row gap-2">
        <select v-model="selectedGroup" @change="selectGroup($event.target.value)"
          class="w-full sm:w-1/2 px-4 py-2 rounded-lg bg-white text-gray-800 border border-gray-300 focus:outline-none focus:border-blue-500 text-sm">
          <option value="All">All</option>
          <option value="Kids">Kids</option>
          <option value="Hawai">Hawai</option>
          <option value="Loose">Loose</option>
          <option value="Box">Box</option>
          <option value="Shoe">Shoes</option>
          <option value="General Items">General Items</option>
          <option v-for="group in stockData" :key="group.groupName" :value="group.groupName">
            {{ group.groupName }}
          </option>
        </select>
        <div class="w-full sm:w-1/2 flex gap-2">
          <button @click="viewMode = 'list'"
            :class="['flex-1 py-2 rounded-lg text-sm', viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-800 hover:bg-gray-100']">
            List View
          </button>
          <button @click="viewMode = 'image'"
            :class="['flex-1 py-2 rounded-lg text-sm', viewMode === 'image' ? 'bg-blue-500 text-white' : 'bg-white text-gray-800 hover:bg-gray-100']">
            Image View
          </button>
        </div>
      </div>

      <!-- Rest of your template (unchanged) -->
      <!-- Table, Image Grid, Popup, etc. — everything below remains 100% same -->
      <!-- ... (your full existing table/image view code here) ... -->
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { toast } from "vue3-toastify";
import "vue3-toastify/dist/index.css";

export default {
  name: "StockTable",
  data() {
    return {
      stockData: [],
      loading: false,
      error: null,
      lastRefresh: null,
      expandedGroups: {},
      imageFiles: {},
      uploading: {},
      uploadErrors: {},
      searchQuery: "",
      selectedGroup: "All",
      showGoToTop: false,
      isLocal: window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1",
      isAdmin: false,
      isSuperAdmin: false,
      showImagePopup: false,
      currentProduct: {},
      currentGroupIndex: null,
      currentProductIndex: 0,
      currentGroupProducts: [],
      currentGroupName: "",
      touchStartX: 0,
      viewMode: "image",
      showLedgerView: false,

      brands: [ /* your existing brands */ ],
      paragonSubgroups: [ /* unchanged */ ],
      marutiSubgroups: ["MARUTI PLASTICS"],
      magnetSubgroups: ["Magnet"],
      rktradersSubgroups: ["SRG ENTERPRISES", "VARDHMAN PLASTICS", "NAV DURGA ENTERPRISES", "AAGAM POLYMER"],
      jkplasticSubgroups: ["J.K Plastic"],
      airsonSubgroups: ["Airsun"],

      // NEW: General Items Group
      generalItemsSubgroups: [
        "AIRFAX",
        "Airsun",
        "J.K Plastic",
        "SRG ENTERPRISES",
        "VARDHMAN PLASTICS",
        "NAV DURGA ENTERPRISES",
        "AAGAM POLYMER",
        "Magnet",
        "MARUTI PLASTICS",
        "Fencer",
        "PANKAJ PLASTIC",
        "PARIS",
        "PU-LION",
        "SHYAM",
        "TEUZ",
        "UAM FOOTWEAR",
        "Xpania"
      ],
    };
  },
  computed: {
    filteredStockData() {
      let filtered = this.stockData;

      if (this.searchQuery) {
        filtered = filtered
          .map(group => ({
            ...group,
            products: group.products.filter(p =>
              p.productName.toLowerCase().includes(this.searchQuery.toLowerCase())
            )
          }))
          .filter(g => g.products.length > 0);
      }

      if (this.selectedGroup !== "All") {
        if (this.selectedGroup === "Paragon") {
          filtered = filtered.filter(g => this.paragonSubgroups.includes(g.groupName));
        } else if (this.selectedGroup === "Reliance") {
          filtered = filtered.filter(g => g.groupName === "RELIANCE FOOTWEAR");
        } else if (this.selectedGroup === "Florex") {
          filtered = filtered.filter(g => g.groupName === "Florex (Swastik)");
        } else if (this.selectedGroup === "Cubix") {
          filtered = filtered.filter(g => g.groupName === "CUBIX");
        } else if (this.selectedGroup === "Maruti") {
          filtered = filtered.filter(g => this.marutiSubgroups.includes(g.groupName));
        } else if (this.selectedGroup === "Magnet") {
          filtered = filtered.filter(g => this.magnetSubgroups.includes(g.groupName));
        } else if (this.selectedGroup === "rktraders") {
          filtered = filtered.filter(g => this.rktradersSubgroups.includes(g.groupName));
        } else if (this.selectedGroup === "jkplastic") {
          filtered = filtered.filter(g => this.jkplasticSubgroups.includes(g.groupName));
        } else if (this.selectedGroup === "airson") {
          filtered = filtered.filter(g => this.airsonSubgroups.includes(g.groupName));
        }
        // NEW: General Items Filter
        else if (this.selectedGroup === "General Items") {
          filtered = filtered.filter(g => this.generalItemsSubgroups.includes(g.groupName));
        }
        else if (this.selectedGroup === "Kids") {
          filtered = filtered.map(g => ({ ...g, products: g.products.filter(p => p.productName.toLowerCase().match(/kid|toes|boy|girl|chu|1\*|child/)) })).filter(g => g.products.length > 0);
        } else if (this.selectedGroup === "Hawai") {
          filtered = filtered.map(g => ({ ...g, products: g.products.filter(p => p.productName.toLowerCase().match(/hawai|walkaholic|cushion/)) })).filter(g => g.products.length > 0);
        } else if (this.selectedGroup === "Loose") {
          filtered = filtered.map(g => ({ ...g, products: g.products.filter(p => p.productName.toLowerCase().match(/loose|era ladies|bond|r\.k|r k/)) })).filter(g => g.products.length > 0);
        } else if (this.selectedGroup === "Box") {
          filtered = filtered.map(g => ({ ...g, products: g.products.filter(p => p.productName.toLowerCase().match(/seltos|airson|airsun|lion|fencer/)) })).filter(g => g.products.length > 0);
        } else if (this.selectedGroup === "Shoe") {
          filtered = filtered.map(g => ({ ...g, products: g.products.filter(p => p.productName.toLowerCase().match(/shoe/)) })).filter(g => g.products.length > 0);
        } else {
          filtered = filtered.filter(g => g.groupName === this.selectedGroup);
        }
      }

      return filtered;
    },
  },
  // ... all your existing mounted(), methods{}, etc. remain 100% unchanged
  async mounted() { await this.loadStockData(); /* ... */ },
  methods: { /* all your existing methods */ }
};
</script>

<style scoped>
img { max-width: 100%; max-height: 100%; }
</style>