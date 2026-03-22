import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // If 8000/8080 hit WinError 10013 on Windows, run API on 8001 (see README)
    proxy: {
      "/api": { target: "http://127.0.0.1:8765", changeOrigin: true },
      "/predict": { target: "http://127.0.0.1:8765", changeOrigin: true },
      "/health": { target: "http://127.0.0.1:8765", changeOrigin: true },
    },
  },
});
