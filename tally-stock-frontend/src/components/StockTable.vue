<template>
  <div class="max-w-4xl mx-auto p-4">
    <!-- Header with SBE Rayagada, Refresh, and Admin -->
    <div
      class="flex items-center justify-between mb-4 bg-gray-800 py-2 px-4 rounded-lg"
    >
      <!-- Refresh Icon (Left) -->
      <img
        v-if="isAdmin"
        @click="updateStockData"
        src="https://res.cloudinary.com/dg365ewal/image/upload/v1749701539/cloud-sync_nznxzz.png"
        alt="Refresh Icon"
        class="w-10 h-10 object-contain cursor-pointer"
        :class="{ 'animate-spin': loading }"
      />
      <!-- Placeholder to maintain centering when refresh is not visible -->
      <div v-else class="w-10 h-10"></div>
      <!-- SBE Rayagada (Center) -->
      <div class="text-2xl font-bold text-center flex-1 text-white">
        SBE Rayagada
      </div>
      <!-- Admin Icon (Right) -->
      <img
        v-if="!isAdmin"
        @click="promptAdminLogin"
        src="https://res.cloudinary.com/dg365ewal/image/upload/v1749669514/software-engineer_dek6dl.png"
        alt="Admin Icon"
        class="w-12 h-12 object-contain cursor-pointer"
      />
      <!-- Placeholder to maintain centering when admin is not visible -->
      <div v-else class="w-12 h-12"></div>
    </div>
    <!-- Logo Row -->
    <div class="flex flex-wrap justify-center items-center mb-4 gap-3">
      <button
        @click="selectGroup('All')"
        :class="[
          'flex items-center justify-center h-10 rounded-lg bg-gray-800 text-white font-bold text-sm w-[25%] sm:w-auto px-3',
          selectedGroup === 'All' ? 'bg-blue-600' : 'hover:bg-gray-700',
        ]"
      >
        All
      </button>
      <button
        v-for="brand in brands"
        :key="brand.name"
        @click="selectGroup(brand.name)"
        :class="[
          'h-10 rounded-lg bg-white border border-gray-300 w-[25%] sm:w-auto',
          selectedGroup === brand.name
            ? 'border-blue-500'
            : 'hover:border-gray-500',
        ]"
      >
        <img
          :src="brand.logo"
          :alt="`${brand.name} Logo`"
          class="h-full w-auto object-contain"
        />
      </button>
      <button
        @click="selectGroup('Kids')"
        :class="[
          'flex items-center justify-center h-10 rounded-lg bg-gray-800 text-white font-bold text-sm w-[25%] sm:w-auto px-3',
          selectedGroup === 'Kids' ? 'bg-blue-600' : 'hover:bg-gray-700',
        ]"
      >
        Kids
      </button>
    </div>
    <!-- Search Bar -->
    <div class="mb-4">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search products..."
        class="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
      />
    </div>
    <!-- Group Filter Dropdown and View Toggle -->
    <div class="mb-4 flex flex-col sm:flex-row gap-2">
      <select
        v-model="selectedGroup"
        @change="selectGroup($event.target.value)"
        class="w-full sm:w-1/2 px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-blue-500 text-sm"
      >
        <option value="All">All</option>
        <option value="Kids">Kids</option>
        <option
          v-for="group in stockData"
          :key="group.groupName"
          :value="group.groupName"
        >
          {{ group.groupName }}
        </option>
      </select>
      <div class="w-full sm:w-1/2 flex gap-2">
        <button
          @click="viewMode = 'list'"
          :class="[
            'flex-1 py-2 rounded-lg text-sm',
            viewMode === 'list'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-white hover:bg-gray-700',
          ]"
        >
          List View
        </button>
        <button
          @click="viewMode = 'image'"
          :class="[
            'flex-1 py-2 rounded-lg text-sm',
            viewMode === 'image'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-white hover:bg-gray-700',
          ]"
        >
          Image View
        </button>
      </div>
    </div>
    <!-- Refresh and Last Refreshed -->
    <div
      class="flex justify-between items-center mb-6 flex-col sm:flex-row gap-2"
    >
      <span class="text-sm text-center sm:text-left">
        Last Refreshed:
        {{
          lastRefresh
            ? lastRefresh.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
            : "Never"
        }}
      </span>
    </div>
    <!-- Error Message -->
    <div v-if="error" class="text-red-600 mb-4 text-center">
      {{ error }} (Ensure Tally is running on localhost:9000 and backend is
      active)
    </div>
    <!-- Stock Display -->
    <div v-if="viewMode === 'list'" class="table-container">
      <table>
        <thead>
          <tr>
            <th class="w-1/3">Name</th>
            <th class="w-1/6">Quantity</th>
            <th class="w-1/2">Image</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(group, index) in filteredStockData" :key="index">
            <tr class="group-row" @click="toggleGroup(index)">
              <td
                colspan="3"
                class="text-center bg-blue-800 text-white font-bold"
              >
                {{ group.groupName }}
              </td>
            </tr>
            <tr
              v-for="(product, pIndex) in group.products"
              :key="`${index}-${pIndex}`"
              v-show="expandedGroups[index]"
              class="product-row"
            >
              <td class="truncate">{{ product.productName }}</td>
              <td>{{ product.quantity }}</td>
              <td>
                <div class="image-box relative">
                  <img
                    v-if="product.imageUrl"
                    :src="product.imageUrl"
                    alt="Product Image"
                    class="w-full h-full object-cover cursor-pointer"
                    @click="openImagePopup(product, index)"
                  />
                  <button
                    v-if="product.imageUrl && isAdmin"
                    @click="deleteImage(product.productName)"
                    class="absolute top-0 right-0 bg-red-600 hover:bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                  <div
                    v-else-if="isAdmin"
                    class="flex flex-col items-center gap-2"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      @change="handleFileChange($event, product.productName)"
                      class="text-xs"
                    />
                    <button
                      @click="uploadImage(product.productName)"
                      :disabled="
                        !imageFiles[product.productName] ||
                        uploading[product.productName]
                      "
                      class="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded"
                    >
                      {{
                        uploading[product.productName]
                          ? "Uploading..."
                          : "Upload"
                      }}
                    </button>
                    <div
                      v-if="uploadErrors[product.productName]"
                      class="text-red-500 text-xs"
                    >
                      {{ uploadErrors[product.productName] }}
                    </div>
                  </div>
                  <div v-else class="text-gray-500 text-xs">No Image</div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
    <!-- Image Block View (Myntra Style) -->
    <div v-else>
      <div v-for="(group, index) in filteredStockData" :key="index">
        <div
          class="text-center bg-blue-800 text-white font-bold py-2 mb-2 rounded-lg"
          @click="toggleGroup(index)"
        >
          {{ group.groupName }}
        </div>
        <div v-show="expandedGroups[index]" class="flex flex-wrap -mx-2">
          <div
            v-for="(product, pIndex) in group.products"
            :key="`${index}-${pIndex}`"
            class="w-1/2 sm:w-1/3 md:w-1/4 px-2 mb-4"
          >
            <div
              class="bg-gray-800 rounded-lg p-2 flex flex-col h-[300px] sm:h-[350px]"
            >
              <!-- Image Section -->
              <div
                v-if="product.imageUrl"
                class="relative w-full aspect-[3/4] flex-shrink-0"
              >
                <img
                  :src="product.imageUrl"
                  alt="Product Image"
                  class="w-full h-full object-cover rounded-lg cursor-pointer"
                  @click="openImagePopup(product, index)"
                />
                <button
                  v-if="isAdmin"
                  @click="deleteImage(product.productName)"
                  class="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                >
                  ×
                </button>
              </div>
              <!-- Admin Upload Section -->
              <div
                v-else-if="isAdmin"
                class="w-full aspect-[3/4] flex flex-col items-center justify-center gap-2 flex-shrink-0"
              >
                <input
                  type="file"
                  accept="image/*"
                  @change="handleFileChange($event, product.productName)"
                  class="text-xs text-white"
                />
                <button
                  @click="uploadImage(product.productName)"
                  :disabled="
                    !imageFiles[product.productName] ||
                    uploading[product.productName]
                  "
                  class="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded"
                >
                  {{
                    uploading[product.productName] ? "Uploading..." : "Upload"
                  }}
                </button>
                <div
                  v-if="uploadErrors[product.productName]"
                  class="text-red-500 text-xs"
                >
                  {{ uploadErrors[product.productName] }}
                </div>
              </div>
              <!-- No Image Placeholder -->
              <div
                v-else
                class="w-full aspect-[3/4] flex items-center justify-center text-gray-500 text-sm rounded-lg bg-gray-700 flex-shrink-0"
              >
                No Image
              </div>
              <!-- Text Section -->
              <div
                class="mt-2 text-center flex flex-col flex-grow justify-between"
              >
                <p
                  class="text-white text-base font-sans font-light tracking-wide line-clamp-2 leading-tight"
                >
                  {{ product.productName }}
                </p>
                <p class="text-gray-400 text-xs font-sans font-light mt-0.5">
                  Qty: {{ product.quantity }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Go to Top Button -->
    <div
      v-if="showGoToTop"
      @click="scrollToTop"
      class="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg go-to-top flex items-center justify-center w-10 h-10 cursor-pointer"
    >
      ↑
    </div>
    <!-- Image Zoom Popup -->
    <div
      v-if="showImagePopup"
      class="fixed inset-0 bg-black bg-opacity-50 flex flex-col z-50"
      @touchstart="handleTouchStart"
      @touchend="handleTouchEnd"
    >
      <!-- Group Name Bar (Top, Sticky) -->
      <div
        class="fixed top-0 left-0 right-0 backdrop-blur-md bg-white bg-opacity-10 text-white font-bold text-center py-2 z-50"
      >
        {{ currentGroupName }}
      </div>
      <!-- Image Section with Liquid Glass Effect -->
      <div class="flex-grow flex items-center justify-center px-4 py-16">
        <div
          class="relative w-full max-w-3xl backdrop-blur-md bg-white bg-opacity-10 rounded-lg shadow-lg"
        >
          <img
            v-if="currentProduct.imageUrl"
            :src="currentProduct.imageUrl"
            alt="Enlarged Image"
            class="w-full max-h-[70vh] object-contain rounded-lg"
          />
          <div v-else class="text-gray-500 text-center py-4">No Image</div>
          <!-- Navigation Arrows -->
          <button
            v-if="currentProductIndex > 0"
            @click="navigateImage(-1)"
            class="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-800 hover:bg-gray-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg"
          >
            ←
          </button>
          <button
            v-if="currentProductIndex < currentGroupProducts.length - 1"
            @click="navigateImage(1)"
            class="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-800 hover:bg-gray-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg"
          >
            →
          </button>
        </div>
      </div>
      <!-- Product Details Bar (Bottom, Sticky) -->
      <div
        class="fixed bottom-0 left-0 right-0 backdrop-blur-md bg-white bg-opacity-10 text-white text-center py-2 flex justify-between px-4 z-50"
      >
        <span class="text-sm truncate">{{ currentProduct.productName }}</span>
        <span class="text-sm">Qty: {{ currentProduct.quantity }}</span>
      </div>
      <!-- Close Button -->
      <button
        @click="closeImagePopup"
        class="fixed top-2 right-2 bg-gray-800 hover:bg-gray-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg z-50"
      >
        ×
      </button>
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
      isLocal:
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1",
      isAdmin: false,
      showImagePopup: false,
      currentProduct: {},
      currentGroupIndex: null,
      currentProductIndex: 0,
      currentGroupProducts: [],
      currentGroupName: "",
      touchStartX: 0,
      brands: [
        {
          name: "Paragon",
          logo: "https://res.cloudinary.com/dg365ewal/image/upload/v1749667072/paragonLogo_rqk3hu.webp",
        },
        {
          name: "Reliance",
          logo: "https://res.cloudinary.com/dg365ewal/image/upload/v1749667072/relianceLogo_bvgwwz.png",
        },
        {
          name: "Cubix",
          logo: "https://res.cloudinary.com/dg365ewal/image/upload/v1749667073/cubixLogo_bwawj3.jpg",
        },
        {
          name: "Florex",
          logo: "https://res.cloudinary.com/dg365ewal/image/upload/v1749667072/florexLogo_wn50tj.jpg",
        },
        {
          name: "Eeken",
          logo: "https://res.cloudinary.com/dg365ewal/image/upload/v1749668232/eekenLogo_rg5xwa.webp",
        },
        {
          name: "Escoute",
          logo: "https://res.cloudinary.com/dg365ewal/image/upload/v1749667072/escouteLogo_maieji.jpg",
        },
      ],
      paragonSubgroups: [
        "Walkaholic",
        "VERTEX, SLICKERS & FENDER",
        "Stimulus",
        "Solea & Meriva , Mascara",
        "P-TOES",
        "Paralite",
        "PARAGON COMFY",
        "Paragon Blot",
        "PARAGON",
        "Max",
        "Hawai Chappal",
      ],
    };
  },
  computed: {
    filteredStockData() {
      let filtered = this.stockData;
      if (this.searchQuery) {
        filtered = filtered
          .map((group) => ({
            ...group,
            products: group.products.filter((product) =>
              product.productName
                .toLowerCase()
                .includes(this.searchQuery.toLowerCase())
            ),
          }))
          .filter((group) => group.products.length > 0);
      }
      if (this.selectedGroup !== "All") {
        if (this.selectedGroup === "Paragon") {
          filtered = filtered.filter((group) =>
            this.paragonSubgroups.includes(group.groupName)
          );
        } else if (this.selectedGroup === "Reliance") {
          filtered = filtered.filter(
            (group) => group.groupName === "RELIANCE FOOTWEAR"
          );
        } else if (this.selectedGroup === "Florex") {
          filtered = filtered.filter(
            (group) => group.groupName === "Florex (Swastik)"
          );
        } else if (this.selectedGroup === "Cubix") {
          filtered = filtered.filter((group) => group.groupName === "CUBIX");
        } else if (this.selectedGroup === "Kids") {
          filtered = filtered
            .map((group) => ({
              ...group,
              products: group.products.filter((product) =>
                product.productName
                  .toLowerCase()
                  .match(/kid|toes|boy|girl|chu|1\*/)
              ),
            }))
            .filter((group) => group.products.length > 0);
        } else {
          filtered = filtered.filter(
            (group) => group.groupName === this.selectedGroup
          );
        }
      }
      return filtered;
    },
  },
  async mounted() {
    await this.loadStockData();
    this.expandedGroups = this.stockData.reduce(
      (acc, _, index) => ({ ...acc, [index]: true }),
      {}
    );
    window.addEventListener("scroll", this.handleScroll);
  },
  beforeUnmount() {
    window.removeEventListener("scroll", this.handleScroll);
  },
  methods: {
    async loadStockData() {
      try {
        if (false) {
          const response = await axios.get("http://localhost:3000/api/stock");
          this.stockData = response.data;
        } else {
          const response = await fetch("/sbe/assets/stock-data.json");
          this.stockData = await response.json();
        }
        this.error = null;
        this.lastRefresh = new Date();
      } catch (error) {
        this.error = this.isLocal
          ? error.response?.data?.error || "Failed to fetch stock data"
          : "Failed to load stock-data.json";
        this.stockData = [];
        toast.error(this.error, { autoClose: 3000 });
      }
    },
    async updateStockData() {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.post(
          "http://localhost:3000/api/updateStockData"
        );
        this.stockData = response.data.data;
        this.lastRefresh = new Date();
        this.expandedGroups = this.stockData.reduce(
          (acc, _, index) => ({ ...acc, [index]: true }),
          {}
        );
        toast.success("Stock data updated successfully!", {
          autoClose: 2500,
        });
      } catch (error) {
        this.error =
          error.response?.data?.error || "Failed to update stock data";
        toast.error(this.error, { autoClose: 3000 });
      } finally {
        this.loading = false;
      }
    },
    promptAdminLogin() {
      const password = prompt("Enter admin password:");
      if (password === "admin123") {
        this.isAdmin = true;
      } else {
        toast.error("Incorrect password", { autoClose: 3000 });
      }
    },
    toggleGroup(index) {
      this.expandedGroups[index] = !this.expandedGroups[index];
    },
    handleFileChange(event, productName) {
      this.imageFiles[productName] = event.target.files[0];
      this.uploadErrors[productName] = null;
    },
    async uploadImage(productName) {
      if (!this.imageFiles[productName]) return;
      this.uploading[productName] = true;
      this.uploadErrors[productName] = null;
      try {
        const formData = new FormData();
        formData.append("file", this.imageFiles[productName]);
        formData.append("upload_preset", "sbe-stock");
        const response = await fetch(
          "https://api.cloudinary.com/v1_1/dg365ewal/image/upload",
          {
            method: "POST",
            body: formData,
          }
        );
        const data = await response.json();
        if (!data.secure_url) {
          throw new Error("Upload failed");
        }

        // Update stock-data.json via backend
        await axios.post("http://localhost:3000/api/updateImage", {
          productName,
          imageUrl: data.secure_url,
        });

        // Update local stockData
        this.stockData = this.stockData.map((group) => ({
          ...group,
          products: group.products.map((product) =>
            product.productName === productName
              ? { ...product, imageUrl: data.secure_url }
              : product
          ),
        }));

        toast.success("Image uploaded and stock-data.json updated!", {
          autoClose: 2500,
        });
      } catch (error) {
        this.uploadErrors[productName] = "Failed to upload image";
        toast.error(this.uploadErrors[productName], { autoClose: 3000 });
      } finally {
        this.uploading[productName] = false;
        this.imageFiles[productName] = null;
      }
    },
    async deleteImage(productName) {
      try {
        await axios.post("http://localhost:3000/api/removeImage", {
          productName,
        });
        this.stockData = this.stockData.map((group) => ({
          ...group,
          products: group.products.map((product) =>
            product.productName === productName
              ? { ...product, imageUrl: null }
              : product
          ),
        }));
        toast.success(`Image removed for ${productName}.`, {
          autoClose: 2500,
        });
      } catch (error) {
        toast.error("Failed to remove image", { autoClose: 3000 });
      }
    },
    openImagePopup(product, groupIndex) {
      this.currentProduct = product;
      this.currentGroupIndex = groupIndex;
      this.currentGroupProducts = this.filteredStockData[groupIndex].products;
      this.currentGroupName = this.filteredStockData[groupIndex].groupName;
      this.currentProductIndex = this.currentGroupProducts.findIndex(
        (p) => p.productName === product.productName
      );
      this.showImagePopup = true;
    },
    closeImagePopup() {
      this.showImagePopup = false;
      this.currentProduct = {};
      this.currentGroupIndex = null;
      this.currentGroupProducts = [];
      this.currentGroupName = "";
      this.currentProductIndex = 0;
    },
    navigateImage(direction) {
      const newIndex = this.currentProductIndex + direction;
      if (newIndex >= 0 && newIndex < this.currentGroupProducts.length) {
        this.currentProductIndex = newIndex;
        this.currentProduct = this.currentGroupProducts[newIndex];
      }
    },
    handleTouchStart(event) {
      this.touchStartX = event.touches[0].clientX;
    },
    handleTouchEnd(event) {
      const touchEndX = event.changedTouches[0].clientX;
      const diff = this.touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        // Threshold for swipe detection
        if (diff > 0) {
          // Swipe left
          this.navigateImage(1);
        } else {
          // Swipe right
          this.navigateImage(-1);
        }
      }
    },
    selectGroup(groupName) {
      this.selectedGroup = groupName;
    },
    handleScroll() {
      this.showGoToTop = window.scrollY > 300;
    },
    scrollToTop() {
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
  },
};
</script>
<style scoped>
/* Ensure backdrop-blur is supported, with fallback for unsupported browsers */
.backdrop-blur-md {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px); /* For Safari */
  background-color: rgba(255, 255, 255, 0.1); /* Semi-transparent white */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
</style>
