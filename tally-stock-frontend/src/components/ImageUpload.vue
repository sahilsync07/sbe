<template>
  <div class="max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-4 text-center">Image Upload</h1>
    <input
      type="file"
      accept="image/*"
      @change="handleFileChange"
      class="mb-4 w-full text-sm"
    />
    <button @click="uploadImage" :disabled="!file || uploading">
      {{ uploading ? "Uploading..." : "Upload Image" }}
    </button>
    <div v-if="uploadError" class="text-red-600 mt-2">{{ uploadError }}</div>
    <div v-if="uploadedImageUrl" class="mt-4">
      <p class="text-green-600">Image uploaded successfully!</p>
      <img
        :src="uploadedImageUrl"
        alt="Uploaded Image"
        class="max-w-full h-auto mt-2"
      />
    </div>
    <router-link
      to="/"
      class="block text-center mt-4 text-blue-600 hover:underline"
      >Back to Stock Summary</router-link
    >
  </div>
</template>

<script>
import { Cloudinary } from "@cloudinary/url-gen";

export default {
  name: "ImageUpload",
  data() {
    return {
      file: null,
      uploading: false,
      uploadError: null,
      uploadedImageUrl: null,
      cloudinary: new Cloudinary({ cloud: { cloudName: "dg365ewal" } }),
    };
  },
  methods: {
    handleFileChange(event) {
      this.file = event.target.files[0];
    },
    async uploadImage() {
      if (!this.file) return;
      this.uploading = true;
      this.uploadError = null;
      try {
        const formData = new FormData();
        formData.append("file", this.file);
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
          this.uploadedImageUrl = data.secure_url;
        } else {
          throw new Error("Upload failed");
        }
      } catch (error) {
        this.uploadError = "Failed to upload image";
        console.error(error);
      } finally {
        this.uploading = false;
        this.file = null;
      }
    },
  },
};
</script>
