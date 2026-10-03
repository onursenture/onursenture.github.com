import { describe, expect, it } from "vitest";
import type { ArchiveEntry, CaseStudy } from "@/content/work/types";
import { collectTargets, groupByFile, isFresh } from "@/lib/work/figma-plan";

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
  hero: { id: "cover", caption: "c", figma: { fileKey: "F1", nodeId: "1-2" } },
  entries: [{ id: "e", date: "2024-01", note: "n", media }],
});

describe("collectTargets", () => {
  it("collects Figma-backed media, normalising node ids, and skips hand-set images", () => {
    const archive: ArchiveEntry[] = [
      { id: "aura", org: "primetek", date: "2024-01", title: "A", note: "n", source: "https://x.com/1", media: { id: "aura", caption: "a", figma: { fileKey: "F2", nodeId: "9:9" } } },
    ];
    const targets = collectTargets(
      [
        study([
          { id: "tokens", caption: "t", figma: { fileKey: "F1", nodeId: "3:4" } },
          { id: "manual", caption: "m", image: "photos/x", figma: { fileKey: "F1", nodeId: "5:6" } },
          { id: "derived", caption: "d", image: "work/primeone/derived", figma: { fileKey: "F1", nodeId: "7:8" } },
          { id: "plain", caption: "p" },
        ]),
      ],
      archive,
    );
    expect(targets).toEqual([
      { key: "work/primeone/cover", fileKey: "F1", nodeId: "1:2", out: "images-src/work/primeone/cover.png" },
      { key: "work/primeone/tokens", fileKey: "F1", nodeId: "3:4", out: "images-src/work/primeone/tokens.png" },
      { key: "work/primeone/derived", fileKey: "F1", nodeId: "7:8", out: "images-src/work/primeone/derived.png" },
      { key: "work/archive/aura", fileKey: "F2", nodeId: "9:9", out: "images-src/work/archive/aura.png" },
    ]);
    expect([...groupByFile(targets).keys()]).toEqual(["F1", "F2"]);
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
