import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 개발 중 CORS 회피를 위해 /api → FastAPI(18000)로 프록시.
// VITE_API_TARGET 미설정 시 SSH 포워딩 기준 localhost:18000 사용.
const target = process.env.VITE_API_TARGET || "http://localhost:18000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
