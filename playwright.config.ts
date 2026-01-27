import { defineConfig, devices } from "@playwright/test";

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./src/test/e2e",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [["html"], ["json", { outputFile: "playwright-report/results.json" }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://localhost:3000",
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    /* Take screenshot on failure */
    screenshot: "only-on-failure",
  },

  /* Configure projects for major browsers */
  projects: [
    // Setup project for authentication
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },

    // Main testing project with auth
    {
      name: "chromium-auth",
      use: {
        ...devices["Desktop Chrome"],
        // Use prepared auth state (only if file exists)
        storageState: "playwright/.auth/user.json",
        contextOptions: {
          ignoreHTTPSErrors: true,
        },
      },
      dependencies: ["setup"],
    },

    // Project for tests without auth
    {
      name: "chromium-no-auth",
      use: {
        ...devices["Desktop Chrome"],
        // No auth state
        storageState: { cookies: [], origins: [] },
        contextOptions: {
          ignoreHTTPSErrors: true,
        },
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "bun run dev:e2e",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
