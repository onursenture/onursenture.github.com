import { describe, expect, it } from "vitest";
import { contributionStats } from "@/lib/sources/github-stats";

const day = (date: string, count: number) => ({ date, count, level: count > 0 ? 1 : 0 });

describe("contributionStats", () => {
  it("counts active days and the longest run of them, across weeks", () => {
    const stats = contributionStats({
      total: 9,
      weeks: [
        { days: [day("2026-09-26", 1), day("2026-09-27", 0), day("2026-09-28", 2)] },
        { days: [day("2026-09-29", 3), day("2026-09-30", 3), day("2026-10-01", 0)] },
      ],
    });
    expect(stats).toEqual({ total: 9, activeDays: 4, longestStreak: 3 });
  });

  it("is all zero without data", () => {
    expect(contributionStats({ total: 0, weeks: [] })).toEqual({ total: 0, activeDays: 0, longestStreak: 0 });
  });
});
