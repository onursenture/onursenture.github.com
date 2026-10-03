import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    environment: "node",
    // next.config.ts sets trailingSlash. Next inlines this flag at build
    // time; next/link reads it at runtime here, so set it to render the same
    // hrefs as the site.
    env: { __NEXT_TRAILING_SLASH: "true" },
  },
});
