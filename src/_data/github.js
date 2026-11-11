const cheerio = require("cheerio");

// Reads the contribution calendar from the same public, signed-out page that
// github.com/onursenture loads its graph from. It used to come from the
// GraphQL API with a token (GH_PAT), but from 2026-09-14 that token missed
// most private contributions: the site showed 1,455 for the year while the
// profile showed 3,421. This page counts private contributions exactly as the
// profile does and gives GitHub's own 0-4 level for each day, so no token is
// needed and the levels match the profile.

const USER = "onursenture";
const EMPTY = { total: 0, weeks: [] };

module.exports = async function () {
  try {
    const response = await fetch(
      `https://github.com/users/${USER}/contributions`
    );
    if (!response.ok) {
      console.warn(`[data] GitHub contributions page returned ${response.status}`);
      return EMPTY;
    }

    const $ = cheerio.load(await response.text());

    // Each day's count is only in its tooltip, linked to the cell by id:
    // "No contributions on …", "1 contribution on …", "32 contributions on …".
    const counts = {};
    $("tool-tip[for]").each((_, el) => {
      const match = $(el).text().trim().match(/^([\d,]+) contributions? on/);
      counts[$(el).attr("for")] = match ? parseInt(match[1].replace(/,/g, ""), 10) : 0;
    });

    // The table is laid out by weekday rows, so collect the cells and order
    // them by date; weeks start on Sunday, as on GitHub.
    const days = $("td.ContributionCalendar-day[data-date]")
      .map((_, el) => ({
        date: $(el).attr("data-date"),
        count: counts[$(el).attr("id")] ?? 0,
        level: Number($(el).attr("data-level")) || 0,
      }))
      .get()
      .sort((a, b) => a.date.localeCompare(b.date));

    if (days.length === 0) {
      console.warn("[data] GitHub contributions page had no days; markup may have changed");
      return EMPTY;
    }

    const weeks = [];
    for (const day of days) {
      const isSunday = new Date(`${day.date}T00:00:00Z`).getUTCDay() === 0;
      if (weeks.length === 0 || isSunday) weeks.push({ days: [] });
      weeks[weeks.length - 1].days.push(day);
    }

    // "3,421 contributions in the last year"; fall back to summing the days.
    const heading = $("#js-contribution-activity-description").text().replace(/\s+/g, " ");
    const totalMatch = heading.match(/([\d,]+) contributions? in the last year/);
    const total = totalMatch
      ? parseInt(totalMatch[1].replace(/,/g, ""), 10)
      : days.reduce((sum, day) => sum + day.count, 0);

    return { total, weeks };
  } catch (e) {
    console.warn("[data] Failed to fetch GitHub contributions:", e.message);
    return EMPTY;
  }
};
