import { defineConfig, devices } from "@playwright/test";

const PORT = 3221;

// The admin end to end (Sprint 7): a production build (`npm run build` first)
// served with a JSON-file content store, local media and the test sign-in, so
// it never needs GitHub, Neon or Blob. Serial: the tests share one store.
export default defineConfig({
  testDir: "./e2e-admin",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? "github" : "list",
  globalSetup: "./e2e-admin/global-setup.ts",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure", viewport: { width: 1440, height: 900 } },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
  webServer: {
    command: `npm run start -- --port ${PORT}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      CONTENT_STORE_FILE: ".e2e-admin/content.json",
      MEDIA_DEV_DIR: ".e2e-admin/media",
      ADMIN_E2E: "1",
      ADMIN_GITHUB_ID: "1",
      SYNC_SECRET: "e2e-sync-secret",
      AUTH_SECRET: "e2e-only-secret-e2e-only-secret-000000",
      // Blanked so a local .env.local can never point the e2e at production
      // Neon, Blob or GitHub OAuth: @next/env doesn't override a key that is
      // already set, even to "", and getDb()/uploadMode() treat "" as unset.
      DATABASE_URL: "",
      BLOB_READ_WRITE_TOKEN: "",
      AUTH_GITHUB_ID: "",
      AUTH_GITHUB_SECRET: "",
    },
  },
});
