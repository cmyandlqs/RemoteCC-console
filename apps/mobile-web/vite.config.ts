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
  server: {
    port: 4174,
  },
});
