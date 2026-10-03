import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CreditLine } from "@/components/work/credit-line";
import { LogView } from "@/components/work/log-view";
import { MediaFigure } from "@/components/work/media-figure";
import type { CaseStudy } from "@/content/work/types";
import { buildStudyView } from "@/lib/work/derive";

const html = renderToStaticMarkup;

const study: CaseStudy = {
  slug: "primeone",
  org: "primetek",
  title: "PrimeOne",
  kind: "design system",
  years: "2023–2026",
  lead: { strong: "PrimeOne.", rest: "A kit." },
  intro: [],
  facts: [],
  links: [],
  hero: { id: "cover", caption: "Cover" },
  entries: [
    {
      id: "3-0",
      date: "2024-11",
      version: "3.0",
      note: "Rebuilt.",
      source: "https://x.com/w00f/status/1",
      credits: [{ name: "Ada", href: "https://ada.example" }],
      media: [
        { id: "overview", caption: "Overview" },
        { id: "tokens", caption: "Tokens" },
      ],
    },
    { id: "4-0", date: "2026-01", version: "4.0", note: "Variables.", media: [] },
  ],
};
const view = buildStudyView(study, (key) => (key === "work/primeone/cover" ? { width: 1600, height: 1000, widths: [640, 1280, 1600] } : undefined));

describe("MediaFigure", () => {
  it("renders the image when one exists", () => {
    const markup = html(<MediaFigure media={view.hero} sizes="100vw" />);
    expect(markup).toContain("/images/work/primeone/cover-1600.jpg");
    expect(markup).toContain('alt="Cover"');
  });

  it("renders a labelled placeholder otherwise, and drops the label when bare", () => {
    const placeholder = view.media.find((m) => m.id === "tokens")!;
    expect(html(<MediaFigure media={placeholder} sizes="100vw" />)).toContain("FIG. 02.2 · Tokens");
    expect(html(<MediaFigure media={placeholder} sizes="100vw" bare />)).not.toContain("FIG.");
  });
});

describe("CreditLine", () => {
  it("renders nothing without credits, and role-grouped linked names otherwise", () => {
    expect(html(<CreditLine credits={[]} />)).toBe("");
    const markup = html(<CreditLine credits={[{ name: "Ada", href: "https://ada.example" }, { name: "Bo", role: "implementation" }]} />);
    expect(markup).toContain("Design: ");
    expect(markup).toContain('href="https://ada.example"');
    expect(markup).toContain(" · Implementation: ");
    expect(markup).toContain("Bo");
  });
});

describe("LogView", () => {
  const markup = html(<LogView study={view} />);

  it("groups by year, newest first", () => {
    expect(markup.indexOf(">2026<")).toBeLessThan(markup.indexOf(">2024<"));
  });

  it("shows the heading with its month, the note, the credit and the source", () => {
    expect(markup).toContain("3.0");
    expect(markup).toContain("· Nov");
    expect(markup).toContain("Rebuilt.");
    expect(markup).toContain("Design: ");
    expect(markup).toContain('href="https://x.com/w00f/status/1"');
  });

  it("shows the first figure and a link to the rest", () => {
    expect(markup).toContain('data-media="overview"');
    expect(markup).not.toContain('data-media="tokens"');
    expect(markup).toContain("+1 in Grid →");
  });
});
