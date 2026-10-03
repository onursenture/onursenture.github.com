// Exports the Figma frames listed in figma.local.json into images-src/work/,
// then `npm run images` optimises them (the npm script chains both).
//
//   npm run figma
//
// Runs on Onur's machine only. It needs FIGMA_TOKEN in .env.local, a Figma
// personal access token with the file_content:read scope (Figma → Settings →
// Security), and figma.local.json (copy figma.example.json). Both files, and
// the figma.lock.local.json this writes, are gitignored: no Figma ref reaches
// the public repo. CI, builds and production never call Figma. Commit the
// PNGs, the renditions and lib/images/manifest.json.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { archive, caseStudies } from "../content/work";
import { exportFrames } from "../lib/work/figma-export";
import { type FigmaLock, collectTargets, parseFigmaConfig } from "../lib/work/figma-plan";

const ROOT = process.cwd();
const CONFIG = join(ROOT, "figma.local.json");
const LOCK = join(ROOT, "figma.lock.local.json");

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

  if (!existsSync(CONFIG)) {
    console.error(
      'figma.local.json is missing. Copy figma.example.json to figma.local.json and list your frames: { "frames": { "work/<slug>/<media id>": { "fileKey": "...", "nodeId": "12:345" } } }. The file is gitignored, so no Figma ref reaches the public repo.',
    );
    return 1;
  }
  let targets: ReturnType<typeof collectTargets>;
  try {
    targets = collectTargets(parseFigmaConfig(JSON.parse(readFileSync(CONFIG, "utf8"))), caseStudies, archive);
  } catch (error) {
    console.error((error as Error).message);
    return 1;
  }
  if (targets.length === 0) {
    console.log("No frames in figma.local.json.");
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
