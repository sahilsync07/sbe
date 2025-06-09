import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  base: "/sbe/tally-stock-frontend/",
  plugins: [vue()],
});
