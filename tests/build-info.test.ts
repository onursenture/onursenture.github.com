import { describe, expect, it } from "vitest";
import { buildLine } from "@/lib/build-info";

describe("buildLine", () => {
  it("joins version, build date and short commit", () => {
    expect(buildLine({ version: "2.0.0", date: "2026-10-03", commit: "a2c817a" })).toBe(
      "v2.0.0 · updated Oct 3, 2026 · commit a2c817a",
    );
  });

  it("leaves out what a local build doesn't have", () => {
    expect(buildLine({ version: "2.0.0", date: "", commit: "" })).toBe("v2.0.0");
  });
});
