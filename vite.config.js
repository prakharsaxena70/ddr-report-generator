import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { viteGeminiPlugin } from "./server/viteGeminiPlugin";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY;
  process.env.GEMINI_MODEL = process.env.GEMINI_MODEL || env.GEMINI_MODEL;

  return {
    plugins: [react(), viteGeminiPlugin()],
    server: {
      port: 5173,
    },
  };
});
