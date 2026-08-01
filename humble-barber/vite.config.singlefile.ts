import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Preview-only build: forces everything (including the lazy-loaded 3D
// scene) into one JS file and one CSS file, so a post-build script can
// inline them into a single self-contained HTML artifact. The real
// deployable build (`npm run build`, vite.config.ts) keeps proper code
// splitting — this file exists only to produce a one-file preview.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist-singlefile",
    cssCodeSplit: false,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
