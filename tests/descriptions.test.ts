import { describe, expect, it } from "vitest";
import { DESCRIPTIONS } from "@/content/descriptions";

describe("page descriptions", () => {
  it.each(Object.entries(DESCRIPTIONS))("%s is one sentence of 50–160 characters", (_key, text) => {
    expect(text.length).toBeGreaterThanOrEqual(50);
    expect(text.length).toBeLessThanOrEqual(160);
    expect(text).toMatch(/^[A-Z].*\.$/);
    expect(text.slice(0, -1)).not.toMatch(/[.!?]\s/);
  });

  it("has no email address", () => {
    for (const text of Object.values(DESCRIPTIONS)) expect(text).not.toContain("@");
  });
});
