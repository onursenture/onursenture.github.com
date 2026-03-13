const raw = require("./habitkit_export.json");

module.exports = function () {
  const habits = raw.habits.filter((h) => !h.archived);

  // Build a set of completion dates per habit
  const completionsByHabit = {};
  for (const c of raw.completions) {
    if (!completionsByHabit[c.habitId]) {
      completionsByHabit[c.habitId] = new Set();
    }
    // Normalize to YYYY-MM-DD using timezone offset
    const d = new Date(c.date);
    d.setMinutes(d.getMinutes() + (c.timezoneOffsetInMinutes || 0));
    const key = d.toISOString().slice(0, 10);
    if (c.amountOfCompletions > 0) {
      completionsByHabit[c.habitId].add(key);
    }
  }

  // For each habit, build a week-based grid (last 6 months)
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // Align to the start of the week (Monday)
  const startDay = new Date(sixMonthsAgo);
  startDay.setDate(startDay.getDate() - ((startDay.getDay() + 6) % 7));

  return habits
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((habit) => {
      const dates = completionsByHabit[habit.id] || new Set();
      const weeks = [];
      const months = [];
      let current = new Date(startDay);
      let lastMonth = -1;

      while (current <= now) {
        const week = [];
        for (let d = 0; d < 7; d++) {
          const dateStr = current.toISOString().slice(0, 10);
          const month = current.getMonth();

          // Track month labels at week boundaries
          if (month !== lastMonth && current.getDay() === 1) {
            const monthNames = [
              "Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
            ];
            months.push({ index: weeks.length, label: monthNames[month] });
            lastMonth = month;
          }

          const isFuture = current > now;
          week.push({
            date: dateStr,
            done: !isFuture && dates.has(dateStr),
            future: isFuture,
          });
          current.setDate(current.getDate() + 1);
        }
        weeks.push(week);
      }

      // Calculate streak and completion rate
      let streak = 0;
      const today = now.toISOString().slice(0, 10);
      let checkDate = new Date(now);
      while (true) {
        const key = checkDate.toISOString().slice(0, 10);
        if (dates.has(key)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (key === today) {
          // Today not yet completed, check yesterday
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      // Completion rate for last 30 days
      let completed30 = 0;
      for (let i = 0; i < 30; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        if (dates.has(d.toISOString().slice(0, 10))) completed30++;
      }

      return {
        name: habit.name,
        color: habit.color,
        isInverse: habit.isInverse,
        weeks,
        months,
        streak,
        rate: Math.round((completed30 / 30) * 100),
      };
    });
};
