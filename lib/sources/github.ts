import { z } from "zod";
import { fetchJson } from "./http";
import type { SourceDefinition } from "./types";

const LOGIN = "onursenture";
const QUERY = `query {
  user(login: "${LOGIN}") {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { contributionCount date contributionLevel } }
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

// GitHub's own quartile for each day (ContributionLevel enum), mapped to 0–4
// so the heatmap matches github.com. An unknown value counts as 0.
const LEVELS: Record<string, number> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

const errorsSchema = z.object({ errors: z.array(z.object({ message: z.string() })).min(1) });

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
                  contributionLevel: z.string().nullish(),
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
  const failed = errorsSchema.safeParse(json);
  if (failed.success) throw new Error(`GitHub GraphQL: ${failed.data.errors[0].message}`);
  const calendar =
    responseSchema.parse(json).data.user.contributionsCollection
      .contributionCalendar;
  return {
    total: calendar.totalContributions,
    weeks: calendar.weeks.map((week) => ({
      days: week.contributionDays.map((day) => ({
        count: day.contributionCount,
        date: day.date,
        level: LEVELS[day.contributionLevel ?? ""] ?? 0,
      })),
    })),
  };
}

export const github: SourceDefinition<Contributions, "github"> = {
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
