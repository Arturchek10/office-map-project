import { defineConfig } from "vite"
import tailwindcss from '@tailwindcss/vite'
import react from "@vitejs/plugin-react"
import svgr from 'vite-plugin-svgr';
import path from "path"

export default defineConfig({
  plugins: [react(), svgr(), tailwindcss()],
  server: {
    proxy: {
      // всё что идёт на /api/v1/auth → отправляем на 8080 так как бэк поднят там
      "/api/v1/auth": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },

      "/api/v1/admin": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },

      "/api/v1/register": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },

      // остальные /api → на 8080
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@features": path.resolve(__dirname, "src/features"),
      "@app": path.resolve(__dirname, "src/app"),
      "@shared": path.resolve(__dirname, "src/shared"),
      "@pages": path.resolve(__dirname, "src/pages"),
      "@entities": path.resolve(__dirname, "src/entities")
    },
  },
})
