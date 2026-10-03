import { describe, expect, it } from "vitest";
import type { ArchiveEntry, CaseStudy } from "@/content/work/types";
import type { ImageEntry } from "@/lib/images/plan";
import {
  buildArchiveView,
  buildStudyView,
  filterMedia,
  formatYearMonth,
  groupCredits,
  resolveImage,
  viewerItems,
} from "@/lib/work/derive";

const IMAGE: ImageEntry = { width: 2560, height: 1600, widths: [640, 1280, 2560] };
const lookup = (key: string) => (key === "work/primeone/cover" || key === "custom/pic" ? IMAGE : undefined);

const study: CaseStudy = {
  slug: "primeone",
  org: "primetek",
  title: "PrimeOne",
  kind: "design system",
  years: "2023–2026",
  lead: { strong: "PrimeOne.", rest: "A kit." },
  intro: ["Intro."],
  facts: [{ label: "Role", value: "Design lead" }],
  links: [],
  hero: { id: "cover", caption: "Cover" },
  entries: [
    {
      id: "3-0",
      date: "2024-11",
      version: "3.0",
      note: "Rebuilt.",
      media: [
        { id: "overview", caption: "Overview" },
        { id: "tokens", caption: "Tokens", tags: ["tokens"], credits: [{ name: "Ada" }] },
        { id: "button", caption: "Button", tags: ["components"], image: "custom/pic" },
      ],
    },
    { id: "4-0", date: "2026-01", version: "4.0", note: "Variables.", media: [] },
    { id: "2-2", date: "2023-12", version: "2.2", note: "Aligned.", media: [{ id: "table", caption: "Token table", tags: ["tokens"] }] },
  ],
};

describe("formatYearMonth", () => {
  it("formats YYYY-MM as a short month and year", () => {
    expect(formatYearMonth("2024-11")).toBe("Nov 2024");
    expect(formatYearMonth("2017-01")).toBe("Jan 2017");
  });
});

describe("resolveImage", () => {
  it("uses the explicit key, else work/<scope>/<id>, else none", () => {
    expect(resolveImage("primeone", { id: "x", caption: "", image: "custom/pic" }, lookup)?.key).toBe("custom/pic");
    expect(resolveImage("primeone", { id: "cover", caption: "" }, lookup)).toEqual({ key: "work/primeone/cover", ...IMAGE });
    expect(resolveImage("primeone", { id: "nope", caption: "" }, lookup)).toBeNull();
  });
});

describe("buildStudyView", () => {
  const view = buildStudyView(study, lookup);

  it("labels the hero FIG. 01 and resolves its image", () => {
    expect(view.hero.label).toBe("FIG. 01");
    expect(view.hero.image?.key).toBe("work/primeone/cover");
    expect(view.hero.group).toBe("Cover");
    expect(view.hero.entryId).toBeNull();
  });

  it("groups entries by year, newest first", () => {
    expect(view.groups.map((g) => g.year)).toEqual(["2026", "2024", "2023"]);
    expect(view.groups[1].items[0]).toMatchObject({ id: "3-0", heading: "3.0", month: "Nov" });
  });

  it("numbers entry figures from the oldest entry (02), so new entries don't renumber", () => {
    const labels = view.media.map((m) => m.label);
    expect(labels).toEqual(["FIG. 01", "FIG. 03.1", "FIG. 03.2", "FIG. 03.3", "FIG. 02.1"]);
  });

  it("gives each figure its entry context and defaults", () => {
    const tokens = view.media.find((m) => m.id === "tokens")!;
    expect(tokens).toMatchObject({ group: "3.0", context: "3.0 · Nov 2024", aspect: "16/10", entryId: "3-0", figma: null });
    expect(tokens.credits).toEqual([{ name: "Ada" }]);
  });

  it("builds chips: All, then entries with media, then tags, each with a computed count", () => {
    expect(view.chips).toEqual([
      { key: "all", label: "All", count: 5 },
      { key: "3-0", label: "3.0", count: 3 },
      { key: "2-2", label: "2.2", count: 1 },
      { key: "tokens", label: "Tokens", count: 2 },
      { key: "components", label: "Components", count: 1 },
    ]);
  });

  it("says 'page(s) in Grid' only on Templates", () => {
    expect(view.moreLabel).toEqual({ one: "in Grid", many: "in Grid" });
    expect(buildStudyView({ ...study, slug: "templates" }, lookup).moreLabel).toEqual({ one: "page in Grid", many: "pages in Grid" });
  });
});

describe("filterMedia and viewerItems", () => {
  const view = buildStudyView(study, lookup);

  it("filters by entry id or tag; 'all' keeps everything", () => {
    expect(filterMedia(view.media, "all")).toHaveLength(5);
    expect(filterMedia(view.media, "3-0").map((m) => m.id)).toEqual(["overview", "tokens", "button"]);
    expect(filterMedia(view.media, "tokens").map((m) => m.id)).toEqual(["tokens", "table"]);
  });

  it("uses the full set in Log, the filtered set elsewhere, and falls back to the full set for an outside fig", () => {
    expect(viewerItems(view.media, "log", "tokens", null)).toHaveLength(5);
    expect(viewerItems(view.media, "grid", "tokens", "tokens").map((m) => m.id)).toEqual(["tokens", "table"]);
    expect(viewerItems(view.media, "grid", "tokens", "cover")).toHaveLength(5);
  });
});

describe("groupCredits", () => {
  it("groups by role, defaulting to Design, keeping first-seen order", () => {
    expect(
      groupCredits([
        { name: "A" },
        { name: "B", role: "implementation" },
        { name: "C", role: "design" },
      ]),
    ).toEqual([
      { role: "Design", people: [{ name: "A" }, { name: "C", role: "design" }] },
      { role: "Implementation", people: [{ name: "B", role: "implementation" }] },
    ]);
  });
});

describe("buildArchiveView", () => {
  const entries: ArchiveEntry[] = [
    { id: "aura", org: "primetek", date: "2024-01", title: "Aura", note: "A theme.", source: "https://x.com/a/status/1", media: { id: "aura", caption: "Aura" } },
    { id: "gallery", org: "primetek", date: "2023-09", title: "Gallery", note: "A gallery.", source: "https://x.com/a/status/2" },
    { id: "editor", org: "primetek", date: "2024-11", title: "Editor", note: "An editor.", source: "https://x.com/a/status/3" },
  ];
  const view = buildArchiveView(entries, () => undefined);

  it("groups rows by year, newest first, with the org name and month", () => {
    expect(view.groups.map((g) => g.year)).toEqual(["2024", "2023"]);
    expect(view.groups[0].items.map((r) => r.id)).toEqual(["editor", "aura"]);
    expect(view.groups[0].items[1]).toMatchObject({ monthYear: "Jan 2024", orgName: "PrimeTek" });
  });

  it("numbers archive figures from the oldest entry and lists them for the viewer", () => {
    expect(view.media.map((m) => [m.id, m.label, m.context])).toEqual([["aura", "FIG. 02", "Aura · Jan 2024"]]);
  });
});
