import { describe, expect, it } from "vitest";
import type { ArchiveEntry, CaseStudy } from "@/content/work/types";
import type { ImageEntry } from "@/lib/images/plan";
import {
  buildArchiveView,
  buildStudyView,
  formatYearMonth,
  groupCredits,
  postUrl,
  resolveImage,
  w00fPostUrl,
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
    expect(view.hero.context).toBe("Cover");
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
    expect(tokens).toMatchObject({ context: "3.0 · Nov 2024", aspect: "16/10", figma: null });
    expect(tokens.credits).toEqual([{ name: "Ada" }]);
  });

  it("defaults an entry to one column and passes 2 or 3 through", () => {
    expect(view.groups.flatMap((g) => g.items).map((e) => e.columns)).toEqual([1, 1, 1]);
    const wide = buildStudyView({ ...study, entries: study.entries.map((e, i) => ({ ...e, columns: ([2, 3, 1] as const)[i] })) }, lookup);
    expect(wide.groups.flatMap((g) => g.items).map((e) => [e.id, e.columns])).toEqual([
      ["4-0", 3],
      ["3-0", 2],
      ["2-2", 1],
    ]);
  });
});

describe("posts", () => {
  const withPosts: CaseStudy = {
    ...study,
    posts: [
      { date: "2023-12-11", account: "primevue", id: "300", summary: "Tokens improved.", entryId: "2-2" },
      { date: "2024-11-07", account: "primereact", id: "100", summary: "Launch.", entryId: "3-0" },
      { date: "2024-11-07", account: "w00f", id: "200", summary: "Achievement unlocked.", entryId: "3-0" },
      { date: "2026-01-07", account: "w00f", id: "400", summary: "Arriving soon.", entryId: "4-0" },
      { date: "2024-03-05", account: "prime_ng", id: "500", summary: "Roadmap.", entryId: "3-0" },
    ],
  };
  const view = buildStudyView(withPosts, lookup);
  const entry = (id: string) => view.groups.flatMap((g) => g.items).find((e) => e.id === id)!;

  it("builds the URL from the account and id", () => {
    expect(postUrl({ date: "2024-11-07", account: "primereact", id: "100", summary: "s", entryId: "3-0" })).toBe("https://x.com/primereact/status/100");
  });

  it("lists each entry's posts oldest first, ties by id ascending", () => {
    expect(entry("3-0").posts.map((p) => p.id)).toEqual(["500", "100", "200"]);
    expect(entry("2-2").posts.map((p) => p.id)).toEqual(["300"]);
    expect(entry("4-0").posts.map((p) => p.id)).toEqual(["400"]);
  });

  it("formats the date and account, and links only @w00f posts", () => {
    expect(entry("3-0").posts[1]).toEqual({
      id: "100",
      display: "Nov 7, 2024",
      account: "@primereact",
      summary: "Launch.",
      url: null,
    });
    expect(entry("3-0").posts[2].url).toBe("https://x.com/w00f/status/200");
    expect(entry("2-2").posts[0].display).toBe("Dec 11, 2023");
  });

  it("has no posts under an entry that has none", () => {
    for (const e of buildStudyView(study, lookup).groups.flatMap((g) => g.items)) expect(e.posts).toEqual([]);
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

describe("w00fPostUrl", () => {
  it("keeps only x.com and twitter.com @w00f status URLs", () => {
    expect(w00fPostUrl("https://x.com/w00f/status/1")).toBe("https://x.com/w00f/status/1");
    expect(w00fPostUrl("https://twitter.com/w00f/status/1")).toBe("https://twitter.com/w00f/status/1");
    expect(w00fPostUrl("https://x.com/primevue/status/1")).toBeNull();
    expect(w00fPostUrl("https://x.com/w00f")).toBeNull();
    expect(w00fPostUrl("https://x.com/w00fs/status/1")).toBeNull();
    expect(w00fPostUrl("https://notx.com/w00f/status/1")).toBeNull();
    expect(w00fPostUrl("https://www.primefaces.org/blog/primeng-10-begins/")).toBeNull();
    expect(w00fPostUrl("https://web.archive.org/web/2016/https://x.com/w00f/status/1")).toBeNull();
    expect(w00fPostUrl(undefined)).toBeNull();
  });

  it("is applied to an entry's source and an archive row's source", () => {
    const entries: CaseStudy["entries"] = [
      { id: "a", date: "2024-01", note: "n", source: "https://x.com/w00f/status/1", links: [{ label: "L", href: "https://example.com" }], media: [] },
      { id: "b", date: "2024-02", note: "n", source: "https://x.com/primevue/status/2", media: [] },
    ];
    const built = buildStudyView({ ...study, entries }, lookup).groups.flatMap((g) => g.items);
    expect(built.map((e) => e.source)).toEqual([null, "https://x.com/w00f/status/1"]);
    expect(JSON.stringify(built)).not.toContain("example.com");
  });
});

describe("buildArchiveView", () => {
  const entries: ArchiveEntry[] = [
    { id: "aura", org: "primetek", date: "2024-01", title: "Aura", note: "A theme.", source: "https://x.com/a/status/1", media: { id: "aura", caption: "Aura" } },
    { id: "gallery", org: "primetek", date: "2023-09", title: "Gallery", note: "A gallery.", source: "https://x.com/a/status/2" },
    { id: "editor", org: "primetek", date: "2024-11", title: "Editor", note: "An editor.", source: "https://x.com/w00f/status/3" },
  ];
  const view = buildArchiveView(entries, () => undefined);

  it("groups rows by year, newest first, with the org name and month", () => {
    expect(view.groups.map((g) => g.year)).toEqual(["2024", "2023"]);
    expect(view.groups[0].items.map((r) => r.id)).toEqual(["editor", "aura"]);
    expect(view.groups[0].items[1]).toMatchObject({ monthYear: "Jan 2024", orgName: "PrimeTek" });
  });

  it("keeps a row's source only when it is an @w00f post", () => {
    expect(view.groups.flatMap((g) => g.items).map((r) => [r.id, r.source])).toEqual([
      ["editor", "https://x.com/w00f/status/3"],
      ["aura", null],
      ["gallery", null],
    ]);
  });

  it("numbers archive figures from the oldest entry and lists them for the viewer", () => {
    expect(view.media.map((m) => [m.id, m.label, m.context])).toEqual([["aura", "FIG. 02", "Aura · Jan 2024"]]);
  });
});

describe("figmaLinks option", () => {
  const FIGMA = { fileKey: "abc123", nodeId: "1:2", embed: true };
  const withFigma: CaseStudy = {
    ...study,
    hero: { ...study.hero, figma: FIGMA },
    entries: study.entries.map((entry) => ({ ...entry, media: entry.media.map((item) => ({ ...item, figma: FIGMA })) })),
  };
  const archiveEntries: ArchiveEntry[] = [
    { id: "a", org: "primetek", date: "2024-01", title: "A", note: "n", source: "https://x.com/a", media: { id: "m", caption: "M", figma: FIGMA } },
  ];

  it("keeps figma refs by default", () => {
    expect(buildStudyView(withFigma, lookup).media.every((m) => m.figma !== null)).toBe(true);
    expect(buildArchiveView(archiveEntries, lookup).media[0].figma).toEqual(FIGMA);
  });

  it("nulls every figma ref when figmaLinks is false", () => {
    const study = buildStudyView(withFigma, lookup, { figmaLinks: false });
    expect(study.media.length).toBeGreaterThan(1);
    expect(study.media.every((m) => m.figma === null)).toBe(true);
    expect(study.hero.figma).toBeNull();
    expect(JSON.stringify(study)).not.toContain("abc123");
    const archive = buildArchiveView(archiveEntries, lookup, { figmaLinks: false });
    expect(archive.media.every((m) => m.figma === null)).toBe(true);
    expect(JSON.stringify(archive)).not.toContain("abc123");
  });

  it("keeps figma refs when figmaLinks is true", () => {
    expect(buildStudyView(withFigma, lookup, { figmaLinks: true }).hero.figma).toEqual(FIGMA);
  });
});
