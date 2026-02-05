import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react({
      jsxImportSource: "@emotion/react",
      babel: {
        plugins: [["@emotion/babel-plugin"]],
      },
    }),
    mode === "development" && componentTagger(),
    VitePWA({
      disable: true, // DISABLED - testing auth without service worker caching issues
      registerType: "autoUpdate",
      injectRegister: "script-defer",
      includeAssets: ["favicon.ico", "robots.txt"],
      manifest: {
        name: "LEJIO Fri – Biludlejningsplatform",
        short_name: "LEJIO Fri",
        description: "LEJIO Fri - white-label biludlejningsplatform for forhandlere.",
        theme_color: "#3b82f6",
        background_color: "#FDF8F3",
        display: "standalone",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      workbox: {
        // Include all necessary files for SPA
        globPatterns: ["**/*.{js,css,woff2,html}"],
        ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/aqzggwewjttbkaqnbmrb\.supabase\.co/,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60,
              },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "ES2020",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: mode === "production",
        drop_debugger: true,
      },
    },
    reportCompressedSize: false,
    sourcemap: mode === "development",
    rollupOptions: {
      output: {
        manualChunks: undefined, // Disable to reduce memory during build
      },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
  },
}));
