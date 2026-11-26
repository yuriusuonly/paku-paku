import { defineConfig, devices } from "@playwright/test";
import config from "./src/constants/config.js";

/**
 * Playwright configuration for reactive-flow E2E tests under `test/src/app/`.
 * @module playwright.config
 */

const port = process.env.URL_PORT || "3000";
const proxyPort = process.env.URL_PROXY_PORT || "8443";
const baseURL = `https://localhost:${proxyPort}`;

export default defineConfig({
  testDir: "./test/src/app",
  testMatch: "**/*.e2e.js",
  setupFiles: ["./test/src/app/setup.js"],
  outputDir: ".playwright",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  expect: {
    timeout: 30000
  },
  use: {
    baseURL,
    ignoreHTTPSErrors: true
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"]
      }
    }
  ],
  webServer: [
    {
      command: "bun run expo:start",
      url: `http://localhost:${port}${config.api.endpoints.health}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120000
    },
    {
      command: "bun run caddy",
      url: `${baseURL}${config.api.endpoints.health}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120000
    }
  ]
});
