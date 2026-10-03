// Exports the Figma frames named in content/work/ into images-src/work/, then
// `npm run images` optimises them (the npm script chains both).
//
//   npm run figma
//
// Runs on Onur's machine only. It needs FIGMA_TOKEN in .env.local, a Figma
// personal access token with the file_content:read scope (Figma → Settings →
// Security). CI, builds and production never call Figma. Commit the PNGs,
// the renditions, lib/images/manifest.json and lib/images/figma-lock.json.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { archive, caseStudies } from "../content/work";
import { exportFrames } from "../lib/work/figma-export";
import { type FigmaLock, collectTargets } from "../lib/work/figma-plan";

const ROOT = process.cwd();
const LOCK = join(ROOT, "lib", "images", "figma-lock.json");

async function main(): Promise<number> {
  try {
    process.loadEnvFile(join(ROOT, ".env.local"));
  } catch {
    // No .env.local: FIGMA_TOKEN may still come from the environment.
  }
  const token = process.env.FIGMA_TOKEN;
  if (!token) {
    console.error(
      "FIGMA_TOKEN is not set. Create a personal access token in Figma (Settings → Security, scope file_content:read) and add FIGMA_TOKEN=... to .env.local.",
    );
    return 1;
  }

  const targets = collectTargets(caseStudies, archive);
  if (targets.length === 0) {
    console.log("No Figma frames in content/work/.");
    return 0;
  }

  const lock: FigmaLock = existsSync(LOCK) ? JSON.parse(readFileSync(LOCK, "utf8")) : {};
  const result = await exportFrames(targets, lock, token, {
    fetch,
    exists: (path) => existsSync(join(ROOT, path)),
    write: (path, data) => {
      const out = join(ROOT, path);
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, data);
    },
    log: (message) => console.log(message),
    warn: (message) => console.warn(message),
    now: () => new Date().toISOString(),
  });
  writeFileSync(LOCK, `${JSON.stringify(result.lock, null, 2)}\n`);
  console.log(`${result.written.length} frame(s) exported.`);
  return result.failed ? 1 : 0;
}

main().then(
  (code) => process.exit(code),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
