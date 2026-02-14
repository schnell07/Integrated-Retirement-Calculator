import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in all files */
  testMatch: '**/*.test.ts',

  /* Run your local dev server before starting the tests (only if DEPLOY_URL is not set) */
  webServer: process.env.DEPLOY_URL ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:5176',
    reuseExistingServer: !process.env.CI,
  },

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.DEPLOY_URL || 'http://localhost:5176',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
});
