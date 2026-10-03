import { describe, expect, it } from "vitest";
import type { ArchiveEntry, CaseStudy } from "@/content/work/types";
import { validateWork } from "@/lib/work/validate";

function study(overrides: Partial<CaseStudy> = {}): CaseStudy {
  return {
    slug: "primeone",
    org: "primetek",
    title: "PrimeOne",
    kind: "design system",
    years: "2023–2026",
    lead: { strong: "PrimeOne.", rest: "A kit." },
    intro: [],
    facts: [],
    links: [{ label: "primevue.org", href: "https://primevue.org" }],
    hero: { id: "cover", caption: "Cover" },
    entries: [
      { id: "3-0", date: "2024-11", version: "3.0", note: "n", source: "https://x.com/w00f/status/1", media: [{ id: "overview", caption: "o", tags: ["tokens"] }] },
    ],
    ...overrides,
  };
}

const row: ArchiveEntry = { id: "aura", org: "primetek", date: "2024-01", title: "Aura", note: "n", source: "https://x.com/primevue/status/1" };
const noImages = () => false;

describe("validateWork", () => {
  it("accepts valid content", () => {
    expect(validateWork([study()], [row], noImages)).toEqual([]);
  });

  it("rejects an entry marked both remaster and update", () => {
    const errors = validateWork(
      [study({ entries: [{ id: "a", date: "2024-01", note: "n", remaster: true, update: true, media: [] }] })],
      [row],
      noImages,
    );
    expect(errors).toEqual([expect.stringContaining("cannot be both a remaster and an update")]);
  });

  it("rejects ids that aren't kebab-case or repeat", () => {
    const errors = validateWork(
      [study({ hero: { id: "Cover", caption: "c" }, entries: [
        { id: "a", date: "2024-01", note: "n", media: [{ id: "x", caption: "" }] },
        { id: "a", date: "2024-02", note: "n", media: [{ id: "x", caption: "" }] },
      ] })],
      [row, row],
      noImages,
    );
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('media id "Cover" is not kebab-case'),
        expect.stringContaining('duplicate entry id "a"'),
        expect.stringContaining('duplicate media id "x"'),
        expect.stringContaining('duplicate archive id "aura"'),
      ]),
    );
  });

  it("rejects bad dates, non-https URLs, unknown images and bad node ids", () => {
    const errors = validateWork(
      [study({ links: [{ label: "x", href: "http://x.com" }], entries: [
        { id: "b", date: "2024-13", note: "n", source: "http://x.com", media: [
          { id: "y", caption: "", image: "work/missing", figma: { fileKey: "k", nodeId: "12-3" }, credits: [{ name: "A", href: "ftp://a" }] },
        ] },
      ] })],
      [{ ...row, date: "2024", source: "x.com/1" }],
      noImages,
    );
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('date "2024-13"'),
        expect.stringContaining('"http://x.com" must be https'),
        expect.stringContaining('image "work/missing" is not in the manifest'),
        expect.stringContaining('nodeId "12-3"'),
        expect.stringContaining('"ftp://a" must be https'),
        expect.stringContaining('date "2024"'),
        expect.stringContaining('"x.com/1" must be https'),
      ]),
    );
  });

  it("rejects tags that aren't kebab-case", () => {
    const errors = validateWork(
      [study({ entries: [{ id: "3-0", date: "2024-11", note: "n", media: [{ id: "o", caption: "", tags: ["page", "Bad Tag"] }] }] })],
      [],
      noImages,
    );
    expect(errors).toEqual([expect.stringContaining('tag "Bad Tag" is not kebab-case')]);
  });

  it("accepts columns 1, 2 and 3, and rejects any other value", () => {
    const entry = (columns: unknown) => ({ id: "3-0", date: "2024-11", note: "n", columns: columns as 1, media: [] });
    for (const ok of [undefined, 1, 2, 3]) expect(validateWork([study({ entries: [entry(ok)] })], [], noImages)).toEqual([]);
    for (const bad of [0, 4, 1.5, "2"]) {
      expect(validateWork([study({ entries: [entry(bad)] })], [], noImages), String(bad)).toEqual([expect.stringContaining("columns")]);
    }
    expect(validateWork([study({ entries: [entry(4)] })], [], noImages)[0]).toContain("must be 1, 2 or 3");
  });

  it("accepts valid posts", () => {
    const posts = [
      { date: "2024-11-07", account: "w00f" as const, id: "1854537901700186303", summary: "s", entryId: "3-0" },
      { date: "2024-02-29", account: "primevue" as const, id: "2", summary: "s", entryId: "3-0" },
    ];
    expect(validateWork([study({ posts })], [], noImages)).toEqual([]);
  });

  it("rejects bad post dates, ids, accounts, duplicate ids and unknown entries", () => {
    const posts = [
      { date: "2024-11", account: "w00f" as const, id: "1", summary: "s", entryId: "3-0" },
      { date: "2023-02-29", account: "w00f" as const, id: "2", summary: "s", entryId: "3-0" },
      { date: "2024-13-01", account: "w00f" as const, id: "3", summary: "s", entryId: "3-0" },
      { date: "2024-11-07", account: "w00f" as const, id: "12ab", summary: "s", entryId: "3-0" },
      { date: "2024-11-07", account: "someone" as never, id: "5", summary: "s", entryId: "3-0" },
      { date: "2024-11-07", account: "w00f" as const, id: "6", summary: "s", entryId: "3-0" },
      { date: "2024-11-08", account: "primevue" as const, id: "6", summary: "s", entryId: "3-0" },
      { date: "2024-11-07", account: "w00f" as const, id: "7", summary: "s", entryId: "9-9" },
      { date: "2024-11-07", account: "w00f" as const, id: "8", summary: "s" } as never,
    ];
    const errors = validateWork([study({ posts })], [], noImages);
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('post date "2024-11" must be YYYY-MM-DD'),
        expect.stringContaining('post date "2023-02-29" must be YYYY-MM-DD'),
        expect.stringContaining('post date "2024-13-01" must be YYYY-MM-DD'),
        expect.stringContaining('post id "12ab" must be digits'),
        expect.stringContaining('post account "someone" is not one of'),
        expect.stringContaining('duplicate post id "6"'),
        expect.stringContaining('entryId "9-9" is not an entry'),
        expect.stringContaining("needs an entryId"),
      ]),
    );
    expect(errors).toHaveLength(8);
  });

  it("rejects duplicate slugs", () => {
    expect(validateWork([study(), study()], [], noImages)).toEqual([expect.stringContaining('duplicate slug "primeone"')]);
  });
});
