import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
    // Vendored third-party code (Dither Kit, MIT).
    "components/dither-kit/**",
  ]),
  // The native dialogs are banned in the app and its components: some browsers
  // (Firefox Focus on iOS) answer confirm() with "no" and show nothing, so a
  // Delete or a leave guard silently does nothing. Use useConfirm()
  // (components/admin/confirm-dialog.tsx).
  {
    files: ["components/**", "app/**"],
    rules: {
      "no-restricted-globals": [
        "error",
        ...["confirm", "alert", "prompt"].map((name) => ({
          name,
          message: `Native ${name}() is unreliable on mobile browsers (Firefox Focus answers it without showing it). Use useConfirm() from components/admin/confirm-dialog.tsx.`,
        })),
      ],
      "no-restricted-properties": [
        "error",
        ...["confirm", "alert", "prompt"].map((property) => ({
          object: "window",
          property,
          message: `Native window.${property}() is unreliable on mobile browsers (Firefox Focus answers it without showing it). Use useConfirm() from components/admin/confirm-dialog.tsx.`,
        })),
      ],
    },
  },
]);

export default eslintConfig;
