import { describe, expect, it } from "vitest";
import { formatClock, formatDate, formatDateTime, formatRelative } from "@/lib/format";

describe("format", () => {
  it("formats in Europe/Istanbul", () => {
    expect(formatDate("2026-09-30T22:30:00.000Z")).toBe("Oct 1, 2026");
    expect(formatDateTime("2026-09-30T22:30:00.000Z")).toBe("Oct 1, 2026, 1:30 AM");
  });

  it("returns empty for unusable input", () => {
    expect(formatDate("")).toBe("");
    expect(formatDateTime("nope")).toBe("");
    expect(formatRelative("nope", Date.now())).toBe("");
  });
});

describe("formatRelative", () => {
  const now = Date.parse("2026-10-03T12:00:00.000Z");
  const ago = (ms: number) => new Date(now - ms).toISOString();

  it("counts minutes, hours and days", () => {
    expect(formatRelative(ago(30_000), now)).toBe("just now");
    expect(formatRelative(ago(12 * 60_000), now)).toBe("12m ago");
    expect(formatRelative(ago(2 * 3_600_000 + 59 * 60_000), now)).toBe("2h ago");
    expect(formatRelative(ago(3 * 86_400_000), now)).toBe("3d ago");
  });

  it("treats future times as just now and old ones as a date", () => {
    expect(formatRelative(ago(-5 * 60_000), now)).toBe("just now");
    expect(formatRelative("2026-08-01T12:00:00.000Z", now)).toBe("Aug 1, 2026");
  });
});

describe("formatClock", () => {
  it("prints 24-hour HH:mm in the given zone", () => {
    expect(formatClock(Date.parse("2026-10-03T11:32:00.000Z"), "Europe/Istanbul")).toBe("14:32");
    expect(formatClock(Date.parse("2026-10-03T21:05:00.000Z"), "Europe/Istanbul")).toBe("00:05");
  });
});
