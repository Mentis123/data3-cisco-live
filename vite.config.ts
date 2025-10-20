import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(moduleDir, "client", "src"),
      "@shared": path.resolve(moduleDir, "shared"),
      "@assets": path.resolve(moduleDir, "attached_assets"),
    },
  },
  root: path.resolve(moduleDir, "client"),
  build: {
    outDir: path.resolve(moduleDir, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (id.includes("recharts") || id.includes("framer-motion")) {
            return "visualisation";
          }

          if (id.includes("@radix-ui")) {
            return "radix";
          }

          if (id.includes("@tanstack/react-query")) {
            return "query";
          }

          if (id.includes("lucide-react")) {
            return "icons";
          }

          return "vendor";
        },
      },
    },
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
