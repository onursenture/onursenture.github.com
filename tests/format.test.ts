import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime } from "@/lib/format";

describe("format", () => {
  it("formats in Europe/Istanbul", () => {
    expect(formatDate("2026-09-30T22:30:00.000Z")).toBe("Oct 1, 2026");
    expect(formatDateTime("2026-09-30T22:30:00.000Z")).toBe("Oct 1, 2026, 1:30 AM");
  });

  it("returns empty for unusable input", () => {
    expect(formatDate("")).toBe("");
    expect(formatDateTime("nope")).toBe("");
  });
});
