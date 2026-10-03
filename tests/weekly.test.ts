import { describe, expect, it } from "vitest";
import { weeklyTotals } from "@/lib/sources/weekly";
import type { Contributions } from "@/lib/sources/github";

const week = (start: string, counts: number[]) => ({
  days: counts.map((count, i) => ({ count, date: `${start.slice(0, 8)}${String(Number(start.slice(8)) + i).padStart(2, "0")}`, level: 0 })),
});

describe("weeklyTotals", () => {
  it("sums each week and labels it with its first day", () => {
    const data: Contributions = { total: 9, weeks: [week("2026-01-04", [1, 2, 0, 0, 0, 0, 0]), week("2026-01-11", [0, 0, 6, 0, 0, 0, 0])] };
    expect(weeklyTotals(data)).toEqual([
      { week: "2026-01-04", count: 3 },
      { week: "2026-01-11", count: 6 },
    ]);
  });

  it("keeps only the last 52 weeks", () => {
    const weeks = Array.from({ length: 53 }, (_, i) => ({ days: [{ count: i, date: `w${i}`, level: 0 }] }));
    const totals = weeklyTotals({ total: 0, weeks });
    expect(totals).toHaveLength(52);
    expect(totals[0]).toEqual({ week: "w1", count: 1 });
  });

  it("returns nothing for an empty calendar", () => {
    expect(weeklyTotals({ total: 0, weeks: [] })).toEqual([]);
  });
});
