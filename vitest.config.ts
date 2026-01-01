import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "edge-runtime",
    server: { deps: { inline: ["convex-test"] } },
    // Ensure tests can access the convex directory
    globals: true,
  },
  resolve: {
    alias: {
      "@cvx": "/convex",
    },
  },
});
