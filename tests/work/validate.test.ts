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

  it("rejects tags that would collide with a chip key", () => {
    const errors = validateWork(
      [study({ entries: [{ id: "3-0", date: "2024-11", note: "n", media: [{ id: "o", caption: "", tags: ["all", "3-0", "Bad Tag"] }] }] })],
      [],
      noImages,
    );
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('tag "all" collides'),
        expect.stringContaining('tag "3-0" collides'),
        expect.stringContaining('tag "Bad Tag" is not kebab-case'),
      ]),
    );
  });

  it("rejects duplicate slugs", () => {
    expect(validateWork([study(), study()], [], noImages)).toEqual([expect.stringContaining('duplicate slug "primeone"')]);
  });
});
