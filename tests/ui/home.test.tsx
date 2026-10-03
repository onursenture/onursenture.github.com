import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LabBand, labIndexEntry } from "@/components/home/lab-index";
import { MetaLine, visibleSegments } from "@/components/home/meta-line";
import type { LabEntry } from "@/content/lab-index";
import type { MetaSegment } from "@/content/profile";

const html = renderToStaticMarkup;

describe("Lab index", () => {
  it("renders nothing while the list is empty", () => {
    expect(html(<LabBand entries={[]} />)).toBe("");
  });

  it("collapses the empty year column in the site band", () => {
    const markup = html(<LabBand entries={[{ title: "a", description: "b" }]} />);
    expect(markup).not.toContain("type-mono-13");
    expect(markup).toContain("md:col-span-11");
  });

  it("renders one row per entry with its status glyph", () => {
    const entries: LabEntry[] = [
      { title: "Shipped thing", description: "Live now.", year: "2025", href: "https://example.com/", status: "live" },
      { title: "Half-built thing", description: "Not yet.", status: "wip" },
      { title: "Plain thing", description: "No status." },
    ];
    const markup = html(<LabBand entries={entries} />);
    expect(markup).toContain(">Lab<");
    expect(markup.match(/class="group grid/g)).toHaveLength(3);
    expect(markup).toContain('aria-label="live"');
    expect(markup).toContain('aria-label="in progress"');
    expect(markup).toContain('rel="noopener noreferrer"');
    expect(markup).not.toContain(">All<");
  });

  it("maps description to the inline meta and year to the year column", () => {
    expect(labIndexEntry({ title: "t", description: "d", year: "2026", status: "wip" })).toEqual({
      title: "t",
      meta: "d",
      years: "2026",
      href: undefined,
      status: "late",
      statusLabel: "in progress",
    });
  });
});

describe("MetaLine", () => {
  const segments: MetaSegment[] = [
    { text: "DESIGNER + BUILDER" },
    { clock: "Europe/Istanbul", label: "ANKARA" },
    { availability: true },
  ];

  it("shows OPEN TO ROLES only while available", () => {
    expect(visibleSegments(segments, true)).toHaveLength(3);
    expect(visibleSegments(segments, false)).toEqual(segments.slice(0, 2));
  });

  it("joins segments with a middle dot and prerenders the clock as --:--", () => {
    const markup = html(<MetaLine segments={segments} available />);
    expect(markup).toContain("DESIGNER + BUILDER");
    expect(markup).toContain('ANKARA <time aria-label="Local time in Ankara">--:--</time>');
    expect(markup).toContain("OPEN TO ROLES");
    expect(markup.match(/ · /g)).toHaveLength(2);
  });

  it("keeps every segment on one line", () => {
    const markup = html(<MetaLine segments={segments} available />);
    expect(markup.match(/whitespace-nowrap/g)).toHaveLength(3);
  });
});
