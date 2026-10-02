import { defineConfig, devices } from "@playwright/test";

const PORT = 3219;

// Second smoke pass, against a build made with SOURCE_FIXTURES=1 (see
// `npm run e2e:fixtures` in CLAUDE.md): every source renders the recorded
// rows from tests/fixtures/ instead of its empty state. Same settings as
// playwright.config.ts, but its own folder and port.
export default defineConfig({
  testDir: "./e2e-fixtures",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run start -- --port ${PORT}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    // The pages were prerendered with fixtures at build time; the flag also
    // keeps them in fixture mode if the server ever regenerates one.
    env: { SOURCE_FIXTURES: "1" },
  },
});
