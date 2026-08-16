import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages project site needs base like "/Smart_Utility/"
// Set via env: VITE_BASE=/Smart_Utility/
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || "/",
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": {
        // Must match local uvicorn port from README (8000).
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
