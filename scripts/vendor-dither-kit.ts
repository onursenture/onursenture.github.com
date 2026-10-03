// Vendors Dither Kit (https://www.tripwire.sh/dither-kit, MIT) into
// components/dither-kit/. The kit ships as a shadcn registry; this project
// has no components.json, so the files are copied instead of installed.
//
//   npx tsx scripts/vendor-dither-kit.ts
//
// Re-running overwrites the vendored files: reapply the local changes listed
// in components/dither-kit/README.md afterwards.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const ITEMS = ["core", "gradient", "button", "avatar", "area-chart"];
const BASE = "https://www.tripwire.sh/r";
const HEADER = (item: string) =>
  `// Vendored from Dither Kit (${BASE}/${item}.json), MIT licence.\n// Local changes: see components/dither-kit/README.md.\n`;

async function main() {
  const seen = new Set<string>();
  for (const item of ITEMS) {
    const response = await fetch(`${BASE}/${item}.json`);
    if (!response.ok) throw new Error(`${item}: HTTP ${response.status}`);
    const registry = (await response.json()) as { files: { path: string; content: string }[] };
    for (const file of registry.files) {
      if (seen.has(file.path)) continue;
      seen.add(file.path);
      const out = join(process.cwd(), file.path);
      mkdirSync(dirname(out), { recursive: true });
      // Keep a leading "use client" directive first.
      const content = file.content.startsWith('"use client"')
        ? file.content.replace('"use client"\n', `"use client"\n\n${HEADER(item)}`)
        : HEADER(item) + file.content;
      writeFileSync(out, content);
      console.log(`wrote ${file.path}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
