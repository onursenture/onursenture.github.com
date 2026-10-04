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
  // The admin can't be framed by another site (clickjacking). Its own draft
  // preview is a same-origin iframe, which 'self' keeps working. Admin only:
  // the public pages' headers stay as they are.
  async headers() {
    return [
      {
        source: "/admin/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
  // Photos moved under the Life side in Sprint 4. 308 keeps old links and
  // the Eleventy-era URLs working.
  async redirects() {
    return [
      { source: "/photos/", destination: "/life/photos/", permanent: true },
      { source: "/photos/:slug/", destination: "/life/photos/:slug/", permanent: true },
      // The work index and the Archive were removed in the work rethink (part
      // 2): the home's Selected work replaces them. With trailingSlash, Next
      // first sends /work to /work/, so the sources carry the slash, like the
      // photo redirects above.
      { source: "/work/", destination: "/", permanent: true },
      { source: "/work/archive/", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
