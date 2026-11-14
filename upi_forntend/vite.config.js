import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// PWA = the app shell is cached, so the app can open even with no internet
// (works in `npm run build && npm run preview` or after deploy, not in `npm run dev`).
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: { name: "Offline UPI Mesh", short_name: "MeshPay", theme_color: "#243a7c", background_color: "#f4f5f7", display: "standalone" },
    }),
  ],
});
