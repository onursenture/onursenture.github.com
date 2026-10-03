import { readFileSync } from "node:fs";
import type { NextConfig } from "next";

const { version } = JSON.parse(readFileSync("package.json", "utf8")) as { version: string };

const nextConfig: NextConfig = {
  cacheComponents: true,
  trailingSlash: true,
  // Build metadata for the footer line (lib/build-info.ts). Inlined at build
  // time; the commit only exists on Vercel.
  env: {
    NEXT_PUBLIC_BUILD_VERSION: version,
    NEXT_PUBLIC_BUILD_DATE: new Date().toISOString().slice(0, 10),
    NEXT_PUBLIC_BUILD_COMMIT: (process.env.VERCEL_GIT_COMMIT_SHA ?? "").slice(0, 7),
  },
  // Photos moved under the Life side in Sprint 4. 308 keeps old links and
  // the Eleventy-era URLs working.
  async redirects() {
    return [
      { source: "/photos/", destination: "/life/photos/", permanent: true },
      { source: "/photos/:slug/", destination: "/life/photos/:slug/", permanent: true },
    ];
  },
};

export default nextConfig;
