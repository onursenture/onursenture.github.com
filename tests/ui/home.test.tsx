import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Bio } from "@/components/home/bio";
import { ExperienceList } from "@/components/home/experience-list";
import { LabGrid } from "@/components/home/lab-grid";
import { SelectedWork, SelectedWorkItem } from "@/components/home/selected-work";
import { Heatmap } from "@/components/ui/heatmap";
import { OrgMark } from "@/components/ui/org-mark";
import { labIndex } from "@/content/lab-index";
import type { PinView } from "@/lib/work/derive";

const html = renderToStaticMarkup;

describe("OrgMark", () => {
  it("renders the org's logo as a decorative 16px image", () => {
    const markup = html(<OrgMark org="primetek" />);
    expect(markup).toContain('src="/logos/primetek.png"');
    expect(markup).toContain('alt=""');
    expect(markup).toContain('aria-hidden="true"');
  });
});

describe("Bio", () => {
  it("renders text with the org mark and name inline", () => {
    const markup = html(<Bio paragraphs={[["At ", { org: "orkestra" }, " since 2013."]]} />);
    expect(markup).toContain("At ");
    expect(markup).toContain("Orkestra Studios");
    expect(markup).toContain('src="/logos/orkestra.png"');
    expect(markup).toContain(" since 2013.");
  });
});

describe("Bio indent", () => {
  it("has no first-line indent", () => {
    const markup = html(<Bio paragraphs={[["Hello."]]} />);
    expect(markup).not.toContain("indent-[3ch]");
  });
});

describe("ExperienceList", () => {
  const markup = html(
    <ExperienceList
      entries={[
        {
          org: "primetek",
          role: "Design lead",
          start: "2016-05",
          end: "2026-04",
          children: [
            { title: "PrimeOne", note: "design system", href: "/work/primeone/", years: "2022–2026" },
            { title: "Nebuu", note: "word game", years: "2013–now" },
          ],
        },
        { org: "etiya", role: "Design specialist", start: "2014-04", end: "2016-03", children: [] },
      ]}
    />,
  );

  it("renders each role's products as rows, linked only when they have a page, with no tree glyphs", () => {
    expect(markup).toContain('href="/work/primeone/"');
    expect(markup).toContain("Nebuu");
    expect(markup.match(/<a /g)).toHaveLength(1);
    expect(markup).not.toMatch(/[├└]/);
    expect(markup).toContain("May 2016–Apr 2026");
  });

  it("gives every product row a third, right-aligned year column", () => {
    expect(markup).toContain("grid-cols-[minmax(0,140px)_minmax(0,1fr)_auto]");
    expect(markup).toMatch(/<span class="[^"]*tabular-nums[^"]*">2022–2026<\/span>/);
    expect(markup).toMatch(/<span class="[^"]*tabular-nums[^"]*">2013–now<\/span>/);
  });

  it("doesn't clip a product link's focus ring: the link truncates itself, not a wrapper", () => {
    expect(markup).toMatch(/<a [^>]*class="[^"]*\bblock truncate\b/);
    expect(markup).not.toContain('<span class="truncate"><a');
  });
});

const pin: PinView = {
  slug: "primeone",
  pageTitle: "PrimeOne",
  blockId: "highlights",
  image: { id: "components", caption: "Components", credits: [], image: null, fig: 1, label: "FIG. 01", context: "Highlights" },
  pin: { title: "Components", note: "The Figma kit" },
  order: 1,
};

describe("SelectedWork", () => {
  it("renders the title, the muted note and the source link to the images block", () => {
    const markup = html(<SelectedWorkItem pin={pin} />);
    expect(markup).toContain("FIG. 01 · Components");
    expect(markup).toMatch(/<p class="mt-2 type-body">Components<\/p>/);
    expect(markup).toMatch(/<p class="truncate type-meta text-fg-muted">The Figma kit<\/p>/);
    expect(markup).toMatch(/<a [^>]*href="\/work\/primeone\/#highlights"[^>]*><span[^>]*>PrimeOne<\/span><span aria-hidden="true">\u00a0→<\/span><\/a>/);
  });

  it("leaves out the note line when the note is empty", () => {
    const markup = html(<SelectedWorkItem pin={{ ...pin, pin: { title: "Components", note: "" } }} />);
    expect(markup).toMatch(/<p class="mt-2 type-body">Components<\/p>/);
    expect(markup).not.toContain("text-fg-muted");
    expect(markup).not.toMatch(/<p[^>]*><\/p>/);
    expect(markup.match(/<p /g)).toHaveLength(2);
  });

  it("links the frame too, hidden from assistive tech and the tab order", () => {
    const markup = html(<SelectedWorkItem pin={pin} />);
    expect(markup.match(/href="\/work\/primeone\/#highlights"/g)).toHaveLength(2);
    expect(markup).toMatch(/<a [^>]*aria-hidden="true"[^>]*tabindex="-1"|<a [^>]*tabindex="-1"[^>]*aria-hidden="true"/i);
  });

  it("is a wide row in a three-column grid, and renders nothing without pins", () => {
    const markup = html(<SelectedWork pins={[pin, { ...pin, slug: "primeicons", pageTitle: "PrimeIcons" }]} />);
    expect(markup).toContain('id="selected-work"');
    expect(markup).toContain("Selected work");
    expect(markup).toContain("lg:col-span-2");
    expect(markup).toContain("grid gap-4 md:grid-cols-2 lg:grid-cols-3");
    expect(markup.match(/<li /g)).toHaveLength(2);
    expect(html(<SelectedWork pins={[]} />)).toBe("");
  });
});

describe("LabGrid", () => {
  it("renders nothing while empty and links only entries with a link", () => {
    expect(html(<LabGrid entries={[]} />)).toBe("");
    const markup = html(
      <LabGrid
        entries={[
          { title: "Linked", description: "d", href: "https://example.com" },
          { title: "Plain", description: "d" },
        ]}
      />,
    );
    expect(markup.match(/<a /g)).toHaveLength(1);
    expect(markup).toContain("↗");
  });

  it("renders text rows without avatars", () => {
    const markup = html(
      <LabGrid
        entries={[
          {
            title: "onursenture.com",
            description: "This site.",
            year: "2026",
            href: "https://github.com/onursenture/onursenture.github.com",
          },
        ]}
      />,
    );
    expect(markup).toContain("onursenture.com");
    expect(markup).toContain("This site.");
    expect(markup).toContain("2026");
    // The row starts with the title link: no status glyph, no avatar.
    expect(markup).not.toContain('role="img"');
    expect(markup).toMatch(/<li[^>]*><span[^>]*><a /);
  });
});

describe("labIndex", () => {
  it("holds only real projects, no placeholders", () => {
    expect(labIndex.every((entry) => !("placeholder" in entry))).toBe(true);
    expect(labIndex.some((entry) => /^Project 0\d$/.test(entry.title))).toBe(false);
  });

  it("lists this site, then Onur's six 2026 projects in his order, each linked over https", () => {
    expect(labIndex.map((entry) => entry.title)).toEqual([
      "onursenture.com",
      "Cehennem Rebirth",
      "count.do Remastered",
      "Motif",
      "tanerman.com",
      "Dönerverse",
      "Nebuu Deck Studio",
    ]);
    for (const entry of labIndex) expect(entry.href, entry.title).toMatch(/^https:\/\//);
  });
});

describe("Heatmap", () => {
  it("colours the heatmap in accent steps", () => {
    const data = {
      total: 10,
      weeks: [
        {
          days: [
            { date: "2026-09-27", count: 0, level: 0 },
            { date: "2026-09-28", count: 1, level: 1 },
            { date: "2026-09-29", count: 2, level: 2 },
            { date: "2026-09-30", count: 3, level: 3 },
            { date: "2026-10-01", count: 4, level: 4 },
          ],
        },
      ],
    };
    const markup = html(<Heatmap data={data} />);
    for (const level of ["bg-line", "_25%", "_50%", "_75%", "bg-accent"]) expect(markup).toContain(level);
    expect(markup).not.toMatch(/bg-\[#/);
  });
});
