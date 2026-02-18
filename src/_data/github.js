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
          level: getLevel(day.contributionCount),
        })),
      })),
    };
  } catch (e) {
    console.warn("[data] Failed to fetch GitHub contributions:", e.message);
    return { total: 0, weeks: [] };
  }
};

function getLevel(count) {
  if (count === 0) return 0;
  if (count <= 3) return 1;
  if (count <= 6) return 2;
  if (count <= 9) return 3;
  return 4;
}
