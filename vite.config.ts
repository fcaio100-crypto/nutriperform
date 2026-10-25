import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" para funcionar tanto no artifact do Claude quanto na Vercel
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: { assetsDir: "assets", chunkSizeWarningLimit: 900 },
});
