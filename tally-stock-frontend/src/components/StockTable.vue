<template>
  <div class="max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-4 text-center">Tally Stock Summary</h1>
    <div
      class="flex justify-between items-center mb-6 flex-col sm:flex-row gap-2"
    >
      <button
        @click="updateStockData"
        :disabled="loading"
        class="w-full sm:w-auto"
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
    <div v-if="error" class="text-red-600 mb-4 text-center">
      {{ error }} (Ensure Tally is running on localhost:9000 and backend is
      active)
    </div>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Quantity</th>
            <th>Image</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(group, index) in stockData" :key="index">
            <tr class="group-row" @click="toggleGroup(index)">
              <td>{{ group.groupName }}</td>
              <td>-</td>
              <td>-</td>
            </tr>
            <tr
              v-for="(product, pIndex) in group.products"
              :key="`${index}-${pIndex}`"
              v-show="expandedGroups[index]"
              class="product-row"
            >
              <td>{{ product.productName }}</td>
              <td>{{ product.quantity }}</td>
              <td>
                <div class="image-box">
                  <img
                    v-if="getImageUrl(product.productName)"
                    :src="getImageUrl(product.productName)"
                    alt="Product Image"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="flex flex-col items-center gap-2">
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
                      class="text-xs"
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
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
    <router-link
      to="/upload"
      class="block text-center mt-4 text-blue-400 hover:underline"
      >Upload General Images</router-link
    >
  </div>
</template>

<script>
import axios from "axios";
import { Cloudinary } from "@cloudinary/url-gen";
import stockData from "../assets/stock-data.json";

export default {
  name: "StockTable",
  data() {
    return {
      stockData: stockData,
      loading: false,
      error: null,
      lastRefresh: null,
      expandedGroups: {},
      imageFiles: {},
      uploading: {},
      uploadErrors: {},
      imageUrls: JSON.parse(localStorage.getItem("productImages")) || {},
      cloudinary: new Cloudinary({ cloud: { cloudName: "dg365ewal" } }),
    };
  },
  mounted() {
    this.expandedGroups = this.stockData.reduce(
      (acc, _, index) => ({ ...acc, [index]: true }),
      {}
    );
  },
  methods: {
    async updateStockData() {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.post(
          "http://localhost:3000/api/updateStockData"
        );
        this.stockData = response.data.data;
        if (response.data.error) {
          this.error = response.data.error;
        } else {
          this.lastRefresh = new Date();
          this.expandedGroups = this.stockData.reduce(
            (acc, _, index) => ({ ...acc, [index]: true }),
            {}
          );
          alert(
            "Stock data updated successfully! Please commit and push src/assets/stock-data.json to GitHub."
          );
        }
      } catch (error) {
        this.error =
          error.response?.data?.error || "Failed to update stock data";
        console.error("Update stock data error:", error);
      } finally {
        this.loading = false;
      }
    },
    toggleGroup(index) {
      this.expandedGroups[index] = !this.expandedGroups[index];
    },
    getImageUrl(productName) {
      return (
        this.stockData
          .flatMap((group) => group.products)
          .find((product) => product.productName === productName)?.imageUrl ||
        this.imageUrls[productName] ||
        null
      );
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
        if (data.secure_url) {
          this.imageUrls[productName] = data.secure_url;
          localStorage.setItem("productImages", JSON.stringify(this.imageUrls));
          this.stockData = this.stockData.map((group) => ({
            ...group,
            products: group.products.map((product) =>
              product.productName === productName
                ? { ...product, imageUrl: data.secure_url }
                : product
            ),
          }));
          await axios.post("http://localhost:3000/api/updateStockData");
          alert(
            "Image uploaded and stock data updated! Please commit and push src/assets/stock-data.json to GitHub."
          );
        } else {
          throw new Error("Upload failed");
        }
      } catch (error) {
        this.uploadErrors[productName] = "Failed to upload image";
        console.error(error);
      } finally {
        this.uploading[productName] = false;
        this.imageFiles[productName] = null;
      }
    },
  },
};
</script>
