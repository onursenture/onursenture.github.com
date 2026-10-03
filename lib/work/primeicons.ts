import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { cacheLife } from "next/cache";
import { type IconSet, recolorIcon } from "./icons";

// primeicons is pinned to exactly 7.0.0, the last MIT release. 8.x is under
// PrimeTek's commercial PrimeUI license (key required, no redistribution):
// never upgrade it. Read at build time; the page is static.
const PACKAGE_DIR = join(process.cwd(), "node_modules", "primeicons");

export function loadIcons(dir: string = PACKAGE_DIR): IconSet {
  const { version } = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as { version: string };
  const svgDir = join(dir, "raw-svg");
  const icons = readdirSync(svgDir)
    .filter((file) => file.endsWith(".svg"))
    .sort()
    .map((file) => ({ name: file.replace(/\.svg$/, ""), svg: recolorIcon(readFileSync(join(svgDir, file), "utf8")) }));
  return { version, icons };
}

export async function getPrimeIcons(): Promise<IconSet> {
  "use cache";
  cacheLife("max");
  return loadIcons();
}
