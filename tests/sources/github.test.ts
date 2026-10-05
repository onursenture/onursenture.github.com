import { describe, expect, it } from "vitest";
import { github, parseGithub } from "@/lib/sources/github";
import { fixture } from "../helpers/fixtures";

describe("parseGithub", () => {
  it("maps contributionLevel to 0–4, unknown levels to 0", () => {
    const data = parseGithub(JSON.parse(fixture("github.json")));
    expect(data.total).toBe(7);
    expect(data.weeks.flatMap((w) => w.days.map((d) => d.level))).toEqual([0, 1, 2, 4, 0]);
    expect(data.weeks[0].days[1]).toEqual({ count: 1, date: "2026-09-28", level: 1 });
  });

  it("surfaces the first GraphQL error message", () => {
    expect(() => parseGithub({ data: null, errors: [{ message: "Bad credentials" }] })).toThrow(
      "GitHub GraphQL: Bad credentials",
    );
  });
});

describe("github.fetch", () => {
  it("throws without a token instead of returning empty data", async () => {
    await expect(github.fetch({ fetch: globalThis.fetch, env: {} })).rejects.toThrow(
      "GH_PAT is not set",
    );
  });
});
