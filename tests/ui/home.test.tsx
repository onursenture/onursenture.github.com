import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Bio } from "@/components/home/bio";
import { ExperienceTree } from "@/components/home/experience-tree";
import { LabGrid } from "@/components/home/lab-grid";
import { WorkTiles } from "@/components/home/work-tiles";
import { Heatmap } from "@/components/ui/heatmap";
import { OrgMark } from "@/components/ui/org-mark";
import { labIndex } from "@/content/lab-index";

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

describe("ExperienceTree", () => {
  it("draws products as a tree under their org, last child with └─", () => {
    const markup = html(
      <ExperienceTree
        entries={[
          {
            org: "primetek",
            role: "Design lead",
            start: "2016-05",
            end: "2026-04",
            children: [
              { title: "PrimeOne", note: "design system" },
              { title: "PrimeIcons", note: "icon set" },
            ],
          },
        ]}
      />,
    );
    expect(markup).toContain("PrimeTek");
    expect(markup).toContain("May 2016–Apr 2026");
    expect(markup).toContain("├─");
    expect(markup).toContain("└─");
    expect(markup.indexOf("├─")).toBeLessThan(markup.indexOf("└─"));
  });
});

describe("WorkTiles", () => {
  it("renders one numbered placeholder per entry, at most four", () => {
    const entries = ["A", "B", "C", "D", "E"].map((title) => ({ title, meta: `${title} meta` }));
    const markup = html(<WorkTiles entries={entries} />);
    expect(markup).toContain("FIG. 01 · A");
    expect(markup).toContain("FIG. 04 · D");
    expect(markup).not.toContain("FIG. 05");
  });

  it("links a tile to its case study", () => {
    const markup = html(<WorkTiles entries={[{ title: "PrimeOne", meta: "design system", href: "/work/primeone/" }]} />);
    expect(markup).toContain('href="/work/primeone/"');
  });
});

describe("LabGrid", () => {
  it("renders nothing while empty and links only entries with a link", () => {
    expect(html(<LabGrid entries={[]} />)).toBe("");
    const markup = html(
      <LabGrid
        entries={[
          { title: "Linked", description: "d", href: "https://example.com", status: "wip" },
          { title: "Plain", description: "d", status: "wip" },
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
            status: "wip",
            href: "https://github.com/onursenture/onursenture.github.com",
          },
        ]}
      />,
    );
    expect(markup).toContain("onursenture.com");
    expect(markup).toContain("This site.");
    expect(markup).toContain("2026");
    // The row starts with its status glyph, then the title; no aria-hidden avatar leads it.
    const row = markup.slice(markup.indexOf("<li"));
    expect(row.replace(/^<li[^>]*>/, "")).toMatch(/^<span[^>]*><span[^>]*role="img"[^>]*aria-label="in progress"/);
    expect(markup).not.toMatch(/<li[^>]*><span[^>]*aria-hidden="true"/);
  });
});

describe("labIndex", () => {
  it("holds only real projects, no placeholders", () => {
    expect(labIndex.every((entry) => !("placeholder" in entry))).toBe(true);
    expect(labIndex.some((entry) => /^Project 0\d$/.test(entry.title))).toBe(false);
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
