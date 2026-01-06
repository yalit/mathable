import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/tests/setup.ts",
    include: ["src/tests/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@components": resolve(__dirname, "./src/components"),
      "@context": resolve(__dirname, "./src/context"),
      "@hooks": resolve(__dirname, "./src/hooks"),
      "@libraries": resolve(__dirname, "./src/libraries"),
      "@cvx": resolve(__dirname, "./convex"),
    },
  },
});
