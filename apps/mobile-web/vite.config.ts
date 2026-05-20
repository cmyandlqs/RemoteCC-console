import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Agent Console Mobile",
        short_name: "ACM",
        theme_color: "#f5f0e7",
        background_color: "#f5f0e7",
        display: "standalone",
      },
    }),
  ],
  server: {
    port: 4174,
  },
});
