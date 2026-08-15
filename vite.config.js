import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon-reference.ico", "pwa-192x192-reference.png", "pwa-512x512-reference.png", "apple-touch-icon-reference.png"],
      manifest: {
        name: "ShiftGuard Premium",
        short_name: "ShiftGuard",
        description: "ArbZG shift monitoring and compliance workspace.",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "/pwa-192x192-reference.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/pwa-512x512-reference.png", sizes: "512x512", type: "image/png", purpose: "any" }
        ]
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
