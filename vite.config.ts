import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { componentTagger } from "lovable-tagger";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  root: ".",
  publicDir: path.resolve(__dirname, "client", "public"),
  build: {
    outDir: path.resolve(__dirname, "dist", "public"),
    emptyOutDir: true,
  },
  server: {
    port: 8080,
    host: true,
    allowedHosts: true,
  },
}));
