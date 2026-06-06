import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // next-intl imports "next/navigation" (no extension); map it to the
      // resolvable module so component tests can load the UI tree.
      "next/navigation": path.resolve(__dirname, "./node_modules/next/navigation.js"),
    },
  },
});
