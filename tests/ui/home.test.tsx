import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Bio } from "@/components/home/bio";
import { ExperienceTree } from "@/components/home/experience-tree";
import { LabGrid } from "@/components/home/lab-grid";
import { WorkTiles } from "@/components/home/work-tiles";
import { OrgMark } from "@/components/ui/org-mark";

const html = renderToStaticMarkup;

describe("OrgMark", () => {
  it("falls back to a decorative monogram while there is no logo file", () => {
    const markup = html(<OrgMark org="primetek" />);
    expect(markup).toContain(">P<");
    expect(markup).toContain('aria-hidden="true"');
  });
});

describe("Bio", () => {
  it("renders text with the org mark and name inline", () => {
    const markup = html(<Bio paragraphs={[["At ", { org: "orkestra" }, " since 2013."]]} />);
    expect(markup).toContain("At ");
    expect(markup).toContain("Orkestra Studios");
    expect(markup).toContain(">O<");
    expect(markup).toContain(" since 2013.");
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
});

describe("LabGrid", () => {
  it("renders nothing while empty and links only entries with a link", () => {
    expect(html(<LabGrid entries={[]} />)).toBe("");
    const markup = html(
      <LabGrid
        entries={[
          { title: "Linked", description: "d", href: "https://example.com", status: "wip" },
          { title: "Plain", description: "d", status: "wip", placeholder: true },
        ]}
      />,
    );
    expect(markup.match(/<a /g)).toHaveLength(1);
    expect(markup).toContain("↗");
  });
});
