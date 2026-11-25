import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for reactive-flow E2E tests under `test/app/`.
 * @module playwright.config
 */

const port = process.env.URL_PORT || "3000";
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./test/app",
  testMatch: "**/*.e2e.js",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"]
      }
    }
  ],
  webServer: {
    command: "bun run expo:start",
    url: `${baseURL}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  }
});
