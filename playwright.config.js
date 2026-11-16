import fs from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const envPath = path.resolve(process.cwd(), ".env");

/**
 * Loads `.env` so Playwright configuration uses project environment values.
 * `.env` is treated as the single source of truth for project configuration.
 * @returns {void}
 */
function loadProjectEnv() {
  if (!fs.existsSync(envPath)) return;

  if (typeof process.loadEnvFile === "function") {
    try {
      process.loadEnvFile(envPath);
      return;
    } catch {
      // Fall through to manual parsing for compatibility.
    }
  }

  const content = fs.readFileSync(envPath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const normalized = line.startsWith("export ") ? line.slice(7).trim() : line;
    const match = normalized.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] != null && process.env[key] !== "") continue;
    let value = rawValue.trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value.replace(/\\n/g, "\n");
  }
}

loadProjectEnv();

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ||
  process.env.BASE_URL ||
  `${process.env.URL_PROTOCOL || "http"}://${process.env.URL_HOST || "127.0.0.1"}:${process.env.URL_PORT || "3000"}`;

/**
 * Playwright configuration for automated browser tests.
 * @module playwright.config
 */
export default defineConfig({
  testDir: "./test/e2e",
  testMatch: "**/*.e2e.js",
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  outputDir: "test-results"
});
