import type { CapacitorConfig } from "@capacitor/cli";

// D-033: the native wrapper around the same PWA build (web/dist), so the app
// can reach the radio. Setup and the iOS plugin: native/README.md.
const config: CapacitorConfig = {
  appId: "ph.pasabi.app",
  appName: "PASAbi",
  webDir: "web/dist",
  ios: {
    // Content never goes under the notch or home bar; the band handles insets.
    contentInset: "never",
  },
};

export default config;
