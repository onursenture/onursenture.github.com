import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ArchiveTile, initialOf } from "@/components/life/archive/archive-tile";
import { SavedList } from "@/components/life/archive/saved-list";
import { TileRow } from "@/components/life/archive/tile-row";
import { YearIndex } from "@/components/life/archive/year-index";
import { YearMonths } from "@/components/life/archive/year-months";

const item = { key: "k", title: "Pickled", meta: ["Sep 8"], href: "https://letterboxd.com/onur/film/pickled/", image: "https://a.ltrbxd.com/p.jpg" };

describe("ArchiveTile", () => {
  it("links the poster and caption upstream, with the meta line", () => {
    const html = renderToStaticMarkup(<ArchiveTile item={item} />);
    expect(html).toContain('href="https://letterboxd.com/onur/film/pickled/"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('src="https://a.ltrbxd.com/p.jpg"');
    expect(html).toContain("Pickled");
    expect(html).toContain("Sep 8");
  });

  it("falls back to the dither tile with the initial, and keeps the full title", () => {
    const html = renderToStaticMarkup(<ArchiveTile item={{ ...item, image: "", title: "İki", fullTitle: "İki (Series, #2)" }} />);
    expect(html).not.toContain("<img");
    expect(html).toContain(">İ<");
    expect(html).toContain('title="İki (Series, #2)"');
  });

  it("initialOf uppercases with Turkish rules", () => {
    expect(initialOf("iki")).toBe("İ");
    expect(initialOf("  ölü deniz")).toBe("Ö");
  });
});

describe("YearMonths and TileRow", () => {
  it("renders the year, each month with its real count, and tiles", () => {
    const html = renderToStaticMarkup(
      <YearMonths group={{ year: 2026, months: [{ month: 9, label: "September", items: [item, { ...item, key: "k2" }] }, { month: 8, label: "August", items: [item] }] }} noun="film" />,
    );
    expect(html).toContain(">2026<");
    expect(html).toContain("September");
    expect(html).toContain("2 films");
    expect(html).toContain("1 film<");
  });

  it("TileRow prints its extra label lines", () => {
    const html = renderToStaticMarkup(<TileRow heading="2015" lines={["17 plays", "and earlier"]} items={[item]} as="h2" />);
    expect(html).toContain("17 plays");
    expect(html).toContain("and earlier");
  });
});

describe("YearIndex", () => {
  it("marks the current year and links the others with trailing slashes", () => {
    const html = renderToStaticMarkup(
      <YearIndex
        entries={[
          { label: "2026", href: "/life/films/2026/", current: true, doto: true },
          { label: "Undated", href: "/life/films/undated/", current: false, doto: false },
        ]}
      />,
    );
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('href="/life/films/undated/"');
  });
});

describe("SavedList", () => {
  it("renders site, minutes, title, description and the image", () => {
    const html = renderToStaticMarkup(
      <SavedList items={[{ link: "https://rauno.me/craft/depth", title: "Designing Depth", site: "rauno.me", minutes: 6, description: "How do you distill…", image: "https://rauno.me/og.png" }]} />,
    );
    for (const text of ["rauno.me", "6 min", "Designing Depth", "How do you distill…", 'src="https://rauno.me/og.png"', 'href="https://rauno.me/craft/depth"']) {
      expect(html).toContain(text);
    }
  });
});
