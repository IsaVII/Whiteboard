import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: [],
    coverage: {
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{js,jsx}"],
      exclude: [
        "src/main.jsx",
        "src/index.css",
        "src/**/*.css",
        "src/assets/**",
      ],
    },
  },
});
