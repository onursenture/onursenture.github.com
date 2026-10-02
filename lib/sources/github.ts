import { z } from "zod";
import { fetchJson } from "./http";
import type { SourceDefinition } from "./types";

const LOGIN = "onursenture";
const QUERY = `query {
  user(login: "${LOGIN}") {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { contributionCount date color } }
      }
    }
  }
}`;

export const contributionsSchema = z.object({
  total: z.number(),
  weeks: z.array(
    z.object({
      days: z.array(
        z.object({
          count: z.number(),
          date: z.string(),
          level: z.number().int().min(0).max(4),
        }),
      ),
    }),
  ),
});
export type Contributions = z.infer<typeof contributionsSchema>;

// GitHub encodes each day's level as one of five colors; map them to 0–4 so
// the distribution matches github.com exactly.
const COLOR_TO_LEVEL: Record<string, number> = {
  "#ebedf0": 0,
  "#9be9a8": 1,
  "#40c463": 2,
  "#30a14e": 3,
  "#216e39": 4,
};

const responseSchema = z.object({
  data: z.object({
    user: z.object({
      contributionsCollection: z.object({
        contributionCalendar: z.object({
          totalContributions: z.number(),
          weeks: z.array(
            z.object({
              contributionDays: z.array(
                z.object({
                  contributionCount: z.number(),
                  date: z.string(),
                  color: z.string().nullish(),
                }),
              ),
            }),
          ),
        }),
      }),
    }),
  }),
});

export function parseGithub(json: unknown): Contributions {
  const calendar =
    responseSchema.parse(json).data.user.contributionsCollection
      .contributionCalendar;
  return {
    total: calendar.totalContributions,
    weeks: calendar.weeks.map((week) => ({
      days: week.contributionDays.map((day) => ({
        count: day.contributionCount,
        date: day.date,
        level: COLOR_TO_LEVEL[(day.color ?? "").toLowerCase()] ?? 0,
      })),
    })),
  };
}

export const github: SourceDefinition<Contributions> = {
  id: "github",
  intervalMinutes: 60,
  empty: { total: 0, weeks: [] },
  schema: contributionsSchema,
  fetch: async ({ fetch, env }) => {
    const token = env.GH_PAT || env.GITHUB_PAT;
    if (!token) throw new Error("GH_PAT is not set");
    const json = await fetchJson(fetch, "https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: QUERY }),
    });
    return parseGithub(json);
  },
  count: (data) => data.total,
};
