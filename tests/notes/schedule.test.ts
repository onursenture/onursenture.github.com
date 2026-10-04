import { describe, expect, it } from "vitest";
import { QUARTER_TIMES, isQuarterHour, nextQuarter, scheduleIssue, utcToZoned, zonedToUtc } from "@/lib/notes/schedule";

describe("Istanbul time", () => {
  it("converts an Istanbul date and time to UTC (UTC+3)", () => {
    expect(zonedToUtc("2026-10-05", "09:15")?.toISOString()).toBe("2026-10-05T06:15:00.000Z");
    expect(zonedToUtc("2027-01-01", "00:00")?.toISOString()).toBe("2026-12-31T21:00:00.000Z");
  });

  it("refuses malformed input", () => {
    expect(zonedToUtc("2026-10-5", "09:15")).toBeNull();
    expect(zonedToUtc("2026-10-05", "9:15")).toBeNull();
  });

  it("converts UTC back to the Istanbul date and time", () => {
    expect(utcToZoned("2026-10-05T06:15:00.000Z")).toEqual({ date: "2026-10-05", time: "09:15" });
    expect(utcToZoned("2026-12-31T21:00:00.000Z")).toEqual({ date: "2027-01-01", time: "00:00" });
  });

  it("offers the 96 quarter-hour times of a day", () => {
    expect(QUARTER_TIMES).toHaveLength(96);
    expect(QUARTER_TIMES.slice(0, 3)).toEqual(["00:00", "00:15", "00:30"]);
    expect(QUARTER_TIMES.at(-1)).toBe("23:45");
  });
});

describe("schedule rules", () => {
  const now = new Date("2026-10-04T11:07:00.000Z");

  it("knows a quarter hour", () => {
    expect(isQuarterHour(new Date("2026-10-04T11:15:00.000Z"))).toBe(true);
    expect(isQuarterHour(new Date("2026-10-04T11:16:00.000Z"))).toBe(false);
    expect(isQuarterHour(new Date("2026-10-04T11:15:01.000Z"))).toBe(false);
  });

  it("finds the next quarter hour, strictly after now", () => {
    expect(nextQuarter(now).toISOString()).toBe("2026-10-04T11:15:00.000Z");
    expect(nextQuarter(new Date("2026-10-04T11:15:00.000Z")).toISOString()).toBe("2026-10-04T11:30:00.000Z");
  });

  it("accepts a future quarter hour and refuses the rest", () => {
    expect(scheduleIssue(new Date("2026-10-04T11:15:00.000Z"), now)).toBeNull();
    expect(scheduleIssue(new Date("2026-10-04T11:00:00.000Z"), now)).toBe("Pick a time in the future.");
    expect(scheduleIssue(new Date("2026-10-04T11:20:00.000Z"), now)).toBe("Pick a time on the quarter hour.");
    expect(scheduleIssue(new Date("nope"), now)).toBe("Pick a date and a time.");
  });
});
