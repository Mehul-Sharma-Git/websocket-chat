import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      "/socket.io": {
        target: "ws://localhost:3000",
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
// Compare this snippet from src/context/AppContext.tsx:
