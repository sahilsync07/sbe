<template>
  <div class="max-w-4xl mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4 text-center">Tally Stock Summary</h1>
    <!-- Admin Button -->
    <div class="flex justify-end mb-4" v-if="!isAdmin">
      <button
        @click="promptAdminLogin"
        class="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm"
      >
        Admin
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
    <!-- Group Filter Dropdown -->
    <div class="mb-4">
      <select
        v-model="selectedGroup"
        @change="selectGroup($event.target.value)"
        class="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-blue-500 text-sm"
      >
        <option value="All">All</option>
        <option
          v-for="group in stockData"
          :key="group.groupName"
          :value="group.groupName"
        >
          {{ group.groupName }}
        </option>
      </select>
    </div>
    <!-- Refresh and Last Refreshed -->
    <div
      class="flex justify-between items-center mb-6 flex-col sm:flex-row gap-2"
    >
      <button
        v-if="isAdmin"
        @click="updateStockData"
        :disabled="loading"
        class="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg"
      >
        {{ loading ? "Updating..." : "Refresh" }}
      </button>
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
    <!-- Stock Table -->
    <div class="table-container">
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
                    @click="openImagePopup(product.imageUrl)"
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
    <!-- Go to Top Button -->
    <button
      v-if="showGoToTop"
      @click="scrollToTop"
      class="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg go-to-top"
    >
      ↑
    </button>
    <!-- Image Zoom Popup -->
    <div
      v-if="showImagePopup"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="closeImagePopup"
    >
      <div class="relative max-w-3xl max-h-[90vh] p-4">
        <img
          :src="imageUrl"
          alt="Enlarged Image"
          class="max-w-full max-h-auto object-contain"
        />
        <button
          @click.stop="closeImagePopup"
          class="absolute top-2 right-2 bg-gray-800 hover:bg-gray-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg"
        >
          ×
        </button>
      </div>
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
      imageUrl: "",
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
        filtered = filtered.filter(
          (group) => group.groupName === this.selectedGroup
        );
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
        toast.success(
          "Stock data updated successfully! Please commit and push src/assets/stock-data.json to GitHub.",
          {
            autoClose: 5000,
          }
        );
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

        toast.success(
          "Image uploaded and stock-data.json updated! Please commit and push src/assets/stock-data.json to GitHub.",
          {
            autoClose: 5000,
          }
        );
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
        toast.success(
          `Image removed for ${productName}. Please commit and push src/assets/stock-data.json to GitHub.`,
          {
            autoClose: 5000,
          }
        );
      } catch (error) {
        toast.error("Failed to remove image", { autoClose: 3000 });
      }
    },
    openImagePopup(url) {
      this.imageUrl = url;
      this.showImagePopup = true;
    },
    closeImagePopup() {
      this.showImagePopup = false;
      this.imageUrl = "";
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
