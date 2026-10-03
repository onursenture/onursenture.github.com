// Visual-review helper: full-page screenshots of the production build at
// 1440 and 390 wide, in both themes.
//
//   npm run build
//   npm run screenshots -- <outDir> <path> [<path>...]
//
// Starts `next start` on SCREENSHOT_PORT (default 3218), saves
// <outDir>/<page>-<width>-<theme>.png, then stops the server. For
// populated pages, build and run with SOURCE_FIXTURES=1.
import { type ChildProcess, spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const WIDTHS = [1440, 390];
const THEMES = ["light", "dark"];

const port = Number(process.env.SCREENSHOT_PORT ?? 3218);
const base = `http://localhost:${port}`;

async function waitForServer(server: ChildProcess) {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) throw new Error("next start exited early");
    try {
      if ((await fetch(`${base}/`)).ok) return;
    } catch {
      // Not listening yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`nothing answered on ${base} after 30s`);
}

function fileSlug(path: string): string {
  return path.replace(/^\/+|\/+$/g, "").replace(/[^a-z0-9]+/gi, "-") || "home";
}

async function main() {
  const [outDir, ...paths] = process.argv.slice(2);
  if (!outDir || paths.length === 0) {
    console.error("usage: npm run screenshots -- <outDir> <path> [<path>...]");
    process.exit(1);
  }
  mkdirSync(outDir, { recursive: true });

  const server = spawn(join("node_modules", ".bin", "next"), ["start", "--port", String(port)], {
    stdio: "ignore",
    env: process.env,
  });
  try {
    await waitForServer(server);
    const browser = await chromium.launch();
    for (const width of WIDTHS) {
      for (const theme of THEMES) {
        const context = await browser.newContext({
          viewport: { width, height: width < 768 ? 844 : 900 },
        });
        await context.addCookies([
          { name: "theme", value: theme, url: base },
        ]);
        const page = await context.newPage();
        for (const path of paths) {
          await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
          // Scroll through once so lazy images load before the capture.
          await page.evaluate(async () => {
            for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
              window.scrollTo(0, y);
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
            window.scrollTo(0, 0);
            await document.fonts.ready;
          });
          await page.waitForLoadState("networkidle");
          const file = join(outDir, `${fileSlug(path)}-${width}-${theme}.png`);
          await page.screenshot({ path: file, fullPage: true });
          console.log(`saved ${file}`);
        }
        await context.close();
      }
    }
    await browser.close();
  } finally {
    server.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
