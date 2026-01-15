import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [vue()],
  base: mode === 'android' ? "./" : "/sbe/", // '/sbe/' for GH Pages, './' for Android
}));
