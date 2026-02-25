import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return;
            if (id.includes("react") || id.includes("scheduler") || id.includes("react-router")) return "vendor-react";
            if (id.includes("firebase")) return "vendor-firebase";
            if (id.includes("@radix-ui")) return "vendor-radix";
            if (id.includes("framer-motion")) return "vendor-motion";
            if (id.includes("lucide-react")) return "vendor-icons";
            return;
          },
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    server: {
      port: 3000,
      strictPort: true,
      proxy: {
        "/api": {
          target: env.VITE_API_PROXY_TARGET || "http://localhost:3001",
          changeOrigin: true,
        },
      },
    },
  };
});
