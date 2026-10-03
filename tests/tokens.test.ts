import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The S1 spec's color table. Changing a token means changing the spec, the
// Figma variables and app/globals.css together.
const S1_COLORS = {
  "--color-bg": { light: "#FFFFFF", dark: "#000000" },
  "--color-surface": { light: "#FAFAFA", dark: "#0A0A0A" },
  "--color-fg": { light: "#000000", dark: "#F2F2F2" },
  "--color-fg-muted": { light: "#737373", dark: "#8A8A8A" },
  "--color-line": { light: "#E5E5E5", dark: "#262626" },
  "--color-line-strong": { light: "#D4D4D4", dark: "#404040" },
  "--color-danger": { light: "#D92D20", dark: "#F97066" },
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
  Object.fromEntries(Object.entries(S1_COLORS).map(([name, values]) => [name, values[mode]]));

describe("color tokens", () => {
  it("@theme declares exactly the S1 light values", () => {
    expect(colorTokens(block("@theme static {"))).toEqual(expected("light"));
  });

  it('[data-theme="dark"] redefines every token with the S1 dark value', () => {
    expect(colorTokens(block('[data-theme="dark"] {'))).toEqual(expected("dark"));
  });

  it("the no-JS prefers-color-scheme fallback matches the dark values", () => {
    expect(colorTokens(block(":root:not([data-theme]) {"))).toEqual(expected("dark"));
  });

  it("defines no shadows and only the control radius", () => {
    expect(css).not.toMatch(/box-shadow/);
    expect(css.match(/--radius-[a-z]+:/g)).toEqual(["--radius-control:"]);
  });
});
