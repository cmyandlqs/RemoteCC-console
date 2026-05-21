import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    port: 4173,
    host: "0.0.0.0",
    hmr: {
      host: "100.112.95.15",
    },
  },
});
