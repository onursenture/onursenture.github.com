import { describe, expect, it } from "vitest";
import { isTakenAt, wallClock, withDay } from "@/lib/photos/taken-at";

describe("isTakenAt", () => {
  it("accepts real wall-clock times only", () => {
    expect(isTakenAt("2026-08-17T18:42:10")).toBe(true);
    expect(isTakenAt("2026-02-30T00:00:00")).toBe(false);
    expect(isTakenAt("0000-00-00T00:00:00")).toBe(false);
    expect(isTakenAt("2026-08-17 18:42:10")).toBe(false);
    expect(isTakenAt("2026-08-17T18:42:10Z")).toBe(false);
    expect(isTakenAt("2026-08-17")).toBe(false);
  });
});

describe("wallClock", () => {
  it("is the Istanbul clock (UTC+3), to the second", () => {
    expect(wallClock(new Date("2026-10-05T21:30:07.900Z"))).toBe("2026-10-06T00:30:07");
  });
});

describe("withDay", () => {
  it("changes the day and keeps the time of day", () => {
    expect(withDay("2026-08-17T18:42:10", "2026-08-20")).toBe("2026-08-20T18:42:10");
  });

  it("refuses an invalid day", () => {
    expect(withDay("2026-08-17T18:42:10", "")).toBeNull();
    expect(withDay("2026-08-17T18:42:10", "2026-02-30")).toBeNull();
  });
});
