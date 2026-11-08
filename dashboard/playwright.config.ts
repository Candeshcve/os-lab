import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://127.0.0.1:4322",
    ...devices["Desktop Chrome"],
    trace: "retain-on-failure"
  },
  webServer: {
    command: "python3 -m http.server 4322 --bind 127.0.0.1 --directory dist",
    url: "http://127.0.0.1:4322/",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000
  }
});
