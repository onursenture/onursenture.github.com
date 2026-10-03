import type { Contributions } from "./github";

export interface ContributionStats {
  total: number;
  activeDays: number;
  // Most consecutive days with at least one contribution.
  longestStreak: number;
}

export function contributionStats(data: Contributions): ContributionStats {
  const days = data.weeks.flatMap((week) => week.days);
  let longestStreak = 0;
  let streak = 0;
  for (const day of days) {
    streak = day.count > 0 ? streak + 1 : 0;
    longestStreak = Math.max(longestStreak, streak);
  }
  return { total: data.total, activeDays: days.filter((day) => day.count > 0).length, longestStreak };
}
