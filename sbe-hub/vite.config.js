import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import fs from "fs";

// Smart fallback plugin: if a file doesn't exist in sbe-hub/src, it pulls from frontend/src
const fallbackToFrontend = () => {
  return {
    name: 'fallback-to-frontend',
    enforce: 'pre',
    resolveId(source, importer, options) {
      // Intercept both '@/' aliases (if plugin runs first) and absolute paths (if Vite alias ran first)
      let resolvedPath = null;
      
      if (source.startsWith('@/')) {
        resolvedPath = path.resolve(__dirname, 'src', source.slice(2));
      } else if (source.startsWith(path.resolve(__dirname, 'src'))) {
        resolvedPath = source;
      }

      if (resolvedPath) {
        if (fs.existsSync(resolvedPath)) {
          return resolvedPath; // Exists in sbe-hub
        }
        
        // Convert to frontend path
        const relativeToSrc = path.relative(path.resolve(__dirname, 'src'), resolvedPath);
        const frontendPath = path.resolve(__dirname, '../frontend/src', relativeToSrc);
        
        const extensions = ['', '.js', '.vue', '/index.js'];
        for (const ext of extensions) {
          if (fs.existsSync(frontendPath + ext)) {
            return frontendPath + ext; // Share from frontend
          }
        }
      }
      return null;
    }
  };
};

export default defineConfig({
  plugins: [
    vue(),
    fallbackToFrontend()
  ],
  resolve: {
    dedupe: ['vue', 'pinia', 'vue-router'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'vue': path.resolve(__dirname, 'node_modules/vue'),
      'pinia': path.resolve(__dirname, 'node_modules/pinia'),
      'vue-router': path.resolve(__dirname, 'node_modules/vue-router'),
    }
  },
  build: {
    minify: true,
    sourcemap: false
  },
  base: "./",
});
