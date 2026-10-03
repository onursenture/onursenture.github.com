import type { Contributions } from "./github";

export interface WeekTotal {
  // The week's first day (YYYY-MM-DD), as GitHub returns it.
  week: string;
  count: number;
}

// Weekly sums for the contribution chart: the last 52 weeks of GitHub's
// 12-month calendar (it sometimes returns 53, the first one partial).
export function weeklyTotals(data: Contributions): WeekTotal[] {
  return data.weeks.slice(-52).map((week) => ({
    week: week.days[0]?.date ?? "",
    count: week.days.reduce((sum, day) => sum + day.count, 0),
  }));
}
