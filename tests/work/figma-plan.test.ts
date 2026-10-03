import { describe, expect, it } from "vitest";
import type { ArchiveEntry, CaseStudy } from "@/content/work/types";
import { type FigmaConfig, collectTargets, groupByFile, isFresh, parseFigmaConfig } from "@/lib/work/figma-plan";

const study = (media: CaseStudy["hero"][]): CaseStudy => ({
  slug: "primeone",
  org: "primetek",
  title: "PrimeOne",
  kind: "k",
  years: "y",
  lead: { strong: "", rest: "" },
  intro: [],
  facts: [],
  links: [],
  hero: { id: "cover", caption: "c" },
  entries: [{ id: "e", date: "2024-01", note: "n", media }],
});

describe("parseFigmaConfig", () => {
  it("reads the frames map and normalises node ids", () => {
    const config = parseFigmaConfig({ frames: { "work/primeone/cover": { fileKey: "F1", nodeId: "1-2" } } });
    expect(config.frames).toEqual({ "work/primeone/cover": { fileKey: "F1", nodeId: "1:2" } });
  });

  it("rejects a missing frames map, bad keys and incomplete frames", () => {
    expect(() => parseFigmaConfig(null)).toThrow(/frames/);
    expect(() => parseFigmaConfig({})).toThrow(/frames/);
    expect(() => parseFigmaConfig({ frames: { "../escape": { fileKey: "F", nodeId: "1:2" } } })).toThrow(/key/);
    expect(() => parseFigmaConfig({ frames: { "work/primeone/cover": { fileKey: "F" } } })).toThrow(/nodeId/);
    expect(() => parseFigmaConfig({ frames: { "work/primeone/cover": { fileKey: "F", nodeId: "nope" } } })).toThrow(/nodeId/);
  });
});

describe("collectTargets", () => {
  const frames: FigmaConfig["frames"] = {
    "work/primeone/cover": { fileKey: "F1", nodeId: "1:2" },
    "work/primeone/tokens": { fileKey: "F1", nodeId: "3:4" },
    "work/primeone/manual": { fileKey: "F1", nodeId: "5:6" },
    "work/primeone/derived": { fileKey: "F1", nodeId: "7:8" },
    "work/archive/aura": { fileKey: "F2", nodeId: "9:9" },
    "work/primeone/not-in-content": { fileKey: "F2", nodeId: "2:2" },
  };
  const archive: ArchiveEntry[] = [
    { id: "aura", org: "primetek", date: "2024-01", title: "A", note: "n", source: "https://x.com/1", media: { id: "aura", caption: "a" } },
  ];
  const studies = [
    study([
      { id: "tokens", caption: "t" },
      { id: "manual", caption: "m", image: "photos/x" },
      { id: "derived", caption: "d", image: "work/primeone/derived" },
      { id: "plain", caption: "p" },
    ]),
  ];

  it("builds targets from the frames map and skips media with a hand-set image", () => {
    const targets = collectTargets({ frames }, studies, archive);
    expect(targets).toEqual([
      { key: "work/primeone/cover", fileKey: "F1", nodeId: "1:2", out: "images-src/work/primeone/cover.png" },
      { key: "work/primeone/tokens", fileKey: "F1", nodeId: "3:4", out: "images-src/work/primeone/tokens.png" },
      { key: "work/primeone/derived", fileKey: "F1", nodeId: "7:8", out: "images-src/work/primeone/derived.png" },
      { key: "work/archive/aura", fileKey: "F2", nodeId: "9:9", out: "images-src/work/archive/aura.png" },
      { key: "work/primeone/not-in-content", fileKey: "F2", nodeId: "2:2", out: "images-src/work/primeone/not-in-content.png" },
    ]);
    expect([...groupByFile(targets).keys()]).toEqual(["F1", "F2"]);
  });

  it("works from the map alone when no content is passed", () => {
    expect(collectTargets({ frames: { "work/primeone/cover": { fileKey: "F1", nodeId: "1:2" } } })).toHaveLength(1);
  });

  it("normalises node ids that were not normalised on the way in", () => {
    expect(collectTargets({ frames: { "work/primeone/cover": { fileKey: "F1", nodeId: "1-2" } } })[0].nodeId).toBe("1:2");
  });
});

describe("isFresh", () => {
  const target = { key: "work/primeone/cover", fileKey: "F1", nodeId: "1:2", out: "images-src/work/primeone/cover.png" };
  const lock = { "work/primeone/cover": { fileKey: "F1", nodeId: "1:2", lastModified: "2026-01-01T00:00:00Z", exportedAt: "x" } };

  it("is fresh only when file, node and the file's lastModified all match", () => {
    expect(isFresh(target, lock, "2026-01-01T00:00:00Z")).toBe(true);
    expect(isFresh(target, lock, "2026-02-01T00:00:00Z")).toBe(false);
    expect(isFresh({ ...target, nodeId: "1:3" }, lock, "2026-01-01T00:00:00Z")).toBe(false);
    expect(isFresh(target, {}, "2026-01-01T00:00:00Z")).toBe(false);
  });
});
