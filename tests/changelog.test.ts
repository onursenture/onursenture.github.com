import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { type Era, type Release, eras, releases } from "@/content/changelog";
import { anchorOf, changelogIssues, compareVersions, eraSpan, latestRelease, parseVersion } from "@/lib/changelog";

const packageVersion = (JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf8")) as { version: string }).version;

const release = (version: string, date: string, items = ["Something changed."]): Release => ({ version, date, title: `Release ${version}`, items });
const era = (major: number, from: string, to: string | null): Era => ({ major, name: `Era ${major}`, from, to, summary: "An era." });
const okEras = [era(2, "2026-10-02", null), era(1, "2026-02-18", "2026-10-02")];

describe("the changelog", () => {
  it("follows every rule, and package.json carries the newest version", () => {
    expect(changelogIssues(releases, eras, packageVersion)).toEqual([]);
    expect(latestRelease().version).toBe(packageVersion);
  });

  it("starts in 2011 and has the three eras", () => {
    expect(eras.map((e) => e.major)).toEqual([2, 1, 0]);
    expect(eras.at(-1)?.from).toBe("2011-12-30");
  });
});

describe("versions", () => {
  it("parses major.minor.patch only", () => {
    expect(parseVersion("2.8.1")).toEqual([2, 8, 1]);
    expect(parseVersion("2.8")).toBeNull();
    expect(parseVersion("v2.8.1")).toBeNull();
  });

  it("compares numerically, not as text", () => {
    expect(compareVersions("2.10.0", "2.9.0")).toBeGreaterThan(0);
    expect(compareVersions("2.8.0", "2.8.1")).toBeLessThan(0);
    expect(compareVersions("2.8.1", "2.8.1")).toBe(0);
  });

  it("anchors a version", () => {
    expect(anchorOf("2.8.1")).toBe("v2-8-1");
  });
});

describe("eraSpan", () => {
  it("names the years", () => {
    expect(eraSpan(era(0, "2011-12-30", "2026-02-18"))).toBe("2011–2026");
    expect(eraSpan(era(1, "2026-02-18", "2026-10-02"))).toBe("2026");
    expect(eraSpan(era(2, "2026-10-02", null))).toBe("since 2026");
  });
});

describe("changelogIssues", () => {
  const ok = [release("2.1.0", "2026-10-04"), release("2.0.0", "2026-10-03")];

  it("accepts a valid list", () => {
    expect(changelogIssues(ok, okEras, "2.1.0")).toEqual([]);
  });

  it("refuses a package version that isn't the newest release", () => {
    expect(changelogIssues(ok, okEras, "2.0.0")).toContain("package.json is 2.0.0, but the newest release is 2.1.0");
  });

  it("refuses versions out of order, repeated or malformed", () => {
    expect(changelogIssues([release("2.0.0", "2026-10-04"), release("2.1.0", "2026-10-03")], okEras, "2.0.0")).toContain(
      "2.1.0 must be older than 2.0.0",
    );
    expect(changelogIssues([release("2.0.0", "2026-10-04"), release("2.0.0", "2026-10-03")], okEras, "2.0.0")).toContain(
      "2.0.0 must be older than 2.0.0",
    );
    expect(changelogIssues([release("2.0", "2026-10-04")], okEras, "2.0")).toContain("2.0 is not major.minor.patch");
  });

  it("refuses dates that go up, or aren't dates", () => {
    expect(changelogIssues([release("2.1.0", "2026-10-03"), release("2.0.0", "2026-10-04")], okEras, "2.1.0")).toContain(
      "2.0.0 is dated after 2.1.0",
    );
    expect(changelogIssues([release("2.0.0", "2026-13-01")], okEras, "2.0.0")).toContain("2.0.0 has an invalid date 2026-13-01");
  });

  it("refuses a release outside the current era", () => {
    expect(changelogIssues([release("1.0.0", "2026-10-03")], okEras, "1.0.0")).toContain("1.0.0 is not in the current era (v2)");
    expect(changelogIssues([release("2.0.0", "2026-10-01")], okEras, "2.0.0")).toContain("2.0.0 is dated before the current era began (2026-10-02)");
  });

  it("refuses an empty title, no items, more than five, or an empty item", () => {
    expect(changelogIssues([{ ...release("2.0.0", "2026-10-03"), title: " " }], okEras, "2.0.0")).toContain("2.0.0 has no title");
    expect(changelogIssues([release("2.0.0", "2026-10-03", [])], okEras, "2.0.0")).toContain("2.0.0 needs 1–5 items, has 0");
    expect(changelogIssues([release("2.0.0", "2026-10-03", ["a.", "b.", "c.", "d.", "e.", "f."])], okEras, "2.0.0")).toContain(
      "2.0.0 needs 1–5 items, has 6",
    );
    expect(changelogIssues([release("2.0.0", "2026-10-03", ["a.", " "])], okEras, "2.0.0")).toContain("2.0.0 has an empty item");
  });

  it("refuses eras that leave a gap or don't end with the current one", () => {
    expect(changelogIssues(ok, [era(2, "2026-10-02", null), era(1, "2026-02-18", "2026-10-01")], "2.1.0")).toContain(
      "v1 must end where v2 begins (2026-10-02)",
    );
    expect(changelogIssues(ok, [era(2, "2026-10-02", "2026-10-05"), era(1, "2026-02-18", "2026-10-02")], "2.1.0")).toContain(
      "the current era (v2) must have no end",
    );
    expect(changelogIssues(ok, [era(2, "2026-10-02", null), era(0, "2026-02-18", "2026-10-02")], "2.1.0")).toContain(
      "v0 must follow v2 as v1",
    );
  });
});
