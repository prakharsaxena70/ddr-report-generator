import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteGeminiPlugin } from "./server/viteGeminiPlugin";

export default defineConfig({
  plugins: [react(), viteGeminiPlugin()],
  server: {
    port: 5173,
  },
});
