import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  trailingSlash: true,
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
