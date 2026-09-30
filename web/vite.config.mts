import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// ADR-009: the PASAbi PWA. packages/core is shared with the engine tests,
// unchanged. Every route must open offline, so the app shell is precached
// and every navigation falls back to index.html (CLAUDE.md "Offline first").
export default defineConfig({
  root: here("."),
  envDir: here(".."),
  resolve: {
    alias: {
      "@pasabi/core": here("../packages/core/index.ts"),
    },
  },
  server: { fs: { allow: [here("..")] } },
  build: { outDir: "dist", emptyOutDir: true },
  plugins: [
    react(),
    VitePWA({
      // "prompt": a new build waits instead of reloading the page mid-report
      // or mid-transfer. main.tsx applies it at a safe moment.
      registerType: "prompt",
      includeAssets: ["favicon.png", "apple-touch-icon.png"],
      manifest: {
        name: "PASAbi",
        short_name: "PASAbi",
        description: "Keep the barangay's picture alive when the network is down.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#FFFFFF",
        theme_color: "#FFFFFF",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,woff,woff2}"],
        navigateFallback: "/index.html",
        // User data lives in IndexedDB, never in this cache.
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
