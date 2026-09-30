import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// The PWA's storage modules import "@pasabi/core" like the app does (the
// alias web/vite.config.ts sets); tests resolve it the same way.
export default defineConfig({
  resolve: {
    alias: {
      "@pasabi/core": fileURLToPath(new URL("./packages/core/index.ts", import.meta.url)),
    },
  },
});
