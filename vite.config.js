import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "ShiftGuard Premium",
        short_name: "ShiftGuard",
        description: "ArbZG shift monitoring and compliance workspace.",
        theme_color: "#0f172a",
        background_color: "#f5f7fb",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }]
      },
      workbox: {
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "document",
            handler: "NetworkFirst",
            options: { cacheName: "shiftguard-pages", networkTimeoutSeconds: 3 }
          },
          {
            urlPattern: ({ request }) => ["script", "style", "image", "font"].includes(request.destination),
            handler: "CacheFirst",
            options: { cacheName: "shiftguard-assets", expiration: { maxEntries: 80, maxAgeSeconds: 604800 } }
          }
        ]
      },
      devOptions: { enabled: false }
    })
  ],
  build: { outDir: "dist" }
});
