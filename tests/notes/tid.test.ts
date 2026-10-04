import { describe, expect, it } from "vitest";
import { TID_PATTERN, tidFromTime, tidTime } from "@/lib/notes/tid";

describe("TIDs", () => {
  it("are 13 sortable base32 characters", () => {
    const tid = tidFromTime(Date.parse("2026-10-04T11:00:00.000Z"), 0, 7);
    expect(tid).toMatch(TID_PATTERN);
    expect(tid).toHaveLength(13);
  });

  it("sort like their times", () => {
    const a = tidFromTime(Date.parse("2025-12-31T23:59:59.999Z"));
    const b = tidFromTime(Date.parse("2026-01-01T00:00:00.000Z"));
    const c = tidFromTime(Date.parse("2026-01-01T00:00:00.000Z"), 1);
    expect([c, a, b].sort()).toEqual([a, b, c]);
  });

  it("round-trip to the millisecond", () => {
    const ms = Date.parse("2026-10-04T11:15:00.000Z");
    expect(tidTime(tidFromTime(ms, 0, 1023))).toBe(ms);
  });

  it("differ by clock id at the same time", () => {
    const ms = Date.parse("2026-10-04T11:15:00.000Z");
    expect(tidFromTime(ms, 0, 1)).not.toBe(tidFromTime(ms, 0, 2));
  });

  it("refuses times before 1970 and clock ids out of range", () => {
    expect(() => tidFromTime(-1)).toThrow();
    expect(() => tidFromTime(0, 0, 1024)).toThrow();
  });
});
