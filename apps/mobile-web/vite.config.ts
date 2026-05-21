import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Agent Console Mobile",
        short_name: "ACM",
        theme_color: "#faf8f5",
        background_color: "#faf8f5",
        display: "standalone",
      },
    }),
  ],
  build: {
    outDir: "../mobile-web-dist",
    emptyOutDir: true,
  },
  server: {
    port: 4174,
    host: "0.0.0.0",
    allowedHosts: true,
    hmr: {
      host: "100.112.95.15",
    },
    proxy: {
      "/api": "http://localhost:8787",
      "/ws": { target: "ws://localhost:8787", ws: true },
    },
  },
});
