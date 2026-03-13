module.exports = async function () {
  const token = process.env.GITHUB_PAT || process.env.GH_PAT;
  if (!token) {
    console.warn("[data] No GITHUB_PAT set, skipping GitHub contribution data");
    return { total: 0, weeks: [] };
  }

  const query = `query {
    user(login: "onursenture") {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
              color
            }
          }
        }
      }
    }
  }`;

  try {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      console.warn(`[data] GitHub API returned ${response.status}`);
      return { total: 0, weeks: [] };
    }

    const data = await response.json();
    const calendar =
      data.data.user.contributionsCollection.contributionCalendar;

    return {
      total: calendar.totalContributions,
      weeks: calendar.weeks.map((week) => ({
        days: week.contributionDays.map((day) => ({
          count: day.contributionCount,
          date: day.date,
          level: getLevelFromColor(day.color),
        })),
      })),
    };
  } catch (e) {
    console.warn("[data] Failed to fetch GitHub contributions:", e.message);
    return { total: 0, weeks: [] };
  }
};

// GitHub API returns a color per day that encodes its contribution level.
// Map the 5 known colors to levels 0-4 so the distribution matches GitHub exactly.
const COLOR_TO_LEVEL = {
  "#ebedf0": 0,
  "#9be9a8": 1,
  "#40c463": 2,
  "#30a14e": 3,
  "#216e39": 4,
};

function getLevelFromColor(color) {
  if (!color) return 0;
  return COLOR_TO_LEVEL[color.toLowerCase()] ?? 0;
}
