import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The Sprint 4 spec's colour table (§2). Changing a token means changing the
// spec and app/globals.css together.
const COLORS = {
  "--color-bg": { light: "#FAFAF8", dark: "#0B0B0C" },
  "--color-fg": { light: "#1F1F22", dark: "#EDEDED" },
  "--color-fg-muted": { light: "#6E6E73", dark: "#8A8A90" },
  "--color-fg-soft": { light: "#52525A", dark: "#B4B4BA" },
  "--color-line": { light: "#E6E6E1", dark: "#222225" },
  "--color-accent": { light: "#2F55F5", dark: "#6E8BFF" },
  "--color-danger": { light: "#C9281C", dark: "#F97066" },
  "--color-danger-bg": { light: "#FEF3F2", dark: "#2A0F0C" },
};

const css = readFileSync(join(__dirname, "..", "app", "globals.css"), "utf8");

// The body of the first rule whose prelude starts with `prelude`, found by
// brace matching (the blocks we read contain no nested rules).
function block(prelude: string): string {
  const start = css.indexOf(prelude);
  if (start === -1) throw new Error(`globals.css has no "${prelude}" block`);
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  return css.slice(open + 1, close);
}

function colorTokens(body: string): Record<string, string> {
  const tokens: Record<string, string> = {};
  for (const [, name, value] of body.matchAll(/(--color-[a-z-]+):\s*(#[0-9A-Fa-f]{6})\s*;/g)) {
    tokens[name] = value.toUpperCase();
  }
  return tokens;
}

const expected = (mode: "light" | "dark") =>
  Object.fromEntries(Object.entries(COLORS).map(([name, values]) => [name, values[mode]]));

describe("color tokens", () => {
  it("@theme declares exactly the light values", () => {
    expect(colorTokens(block("@theme static {"))).toEqual(expected("light"));
  });

  it('[data-side="life"] redefines every token with its dark value', () => {
    // Line start: the @custom-variant line also contains '[data-side="life"],'.
    expect(colorTokens(block('\n[data-side="life"] {'))).toEqual(expected("dark"));
  });

  it("is light only: no data-theme attribute and no prefers-color-scheme rule", () => {
    expect(css).not.toMatch(/data-theme/);
    expect(css).not.toMatch(/prefers-color-scheme/);
  });

  it("dark: utilities apply only inside the Life side", () => {
    expect(css).toContain('@custom-variant dark (&:where([data-side="life"], [data-side="life"] *));');
  });

  it("defines no shadows and only the control radius", () => {
    expect(css).not.toMatch(/box-shadow/);
    expect(css.match(/--radius-[a-z]+:/g)).toEqual(["--radius-control:"]);
  });

  it("defines exactly the six Sprint 4 type classes", () => {
    expect([...css.matchAll(/@utility (type-[a-z0-9-]+)/g)].map((m) => m[1])).toEqual([
      "type-name",
      "type-lead",
      "type-body",
      "type-meta",
      "type-label",
      "type-boot",
    ]);
  });
});
