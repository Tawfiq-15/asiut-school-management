import { defineConfig, devices } from "@playwright/test";

/**
 * E2E smoke suite. Requires a running stack:
 *   1. Backend on :8080 (with a seeded DB) and Redis.
 *   2. Frontend on :3000  (npm run dev / npm start).
 *   3. One-time browser install:  npx playwright install --with-deps
 * Then:  npm run e2e
 *
 * Not part of the unit-test (vitest) run — it needs live services.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,               // dev server (Turbopack) can't handle parallel load
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    navigationTimeout: 30_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
