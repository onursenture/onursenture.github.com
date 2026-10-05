import { describe, expect, it } from "vitest";
import {
  bookArchive,
  countLabel,
  filmArchive,
  latestPlays,
  monthDay,
  savedItems,
  theatreArchive,
} from "@/lib/life/archive";
import type { LifeLogRow } from "@/lib/life-log/types";
import type { Book } from "@/lib/sources/goodreads";
import { parseInstapaper } from "@/lib/sources/instapaper";
import { fixture } from "../helpers/fixtures";

const rows = JSON.parse(fixture("life-log.json")) as LifeLogRow[];

describe("labels", () => {
  it("formats days and counts", () => {
    expect(monthDay("2026-09-08")).toBe("Sep 8");
    expect(countLabel(1, "film")).toBe("1 film");
    expect(countLabel(9, "film")).toBe("9 films");
    expect(countLabel(2, "play")).toBe("2 plays");
  });
});

describe("filmArchive", () => {
  const archive = filmArchive(rows);

  it("groups dated films by year and month, newest first, with real counts", () => {
    expect(archive.years.map((y) => y.year)).toEqual([2026, 2025]);
    expect(archive.years[0].months.map((m) => [m.label, m.items.map((i) => i.title)])).toEqual([
      ["September", ["Love & Other Drugs", "Pickled"]],
      ["August", ["Disclosure Day"]],
    ]);
  });

  it("captions with the watch day, ↻ on a rewatch, and never the release year", () => {
    const [love] = archive.years[0].months[0].items;
    expect(love.meta).toEqual(["Sep 26"]);
    const [heat] = archive.years[1].months[0].items;
    expect(heat.meta).toEqual(["Dec 14 · ↻"]);
    expect(heat.image).toBe("");
    const captions = archive.years.flatMap((y) => y.months.flatMap((m) => m.items.flatMap((i) => [i.title, ...i.meta])));
    expect(captions.join(" ")).not.toMatch(/1995|2010|2022/);
  });

  it("lists undated films alphabetically", () => {
    expect(archive.undated.map((i) => i.title)).toEqual(["Amélie", "The Matrix"]);
  });

  it("drops an undated row once the same film has a dated row", () => {
    const film = (key: string, occurredOn: string | null, title: string, year: number | null): LifeLogRow => ({
      source: "letterboxd",
      key,
      occurredOn,
      precision: occurredOn ? "day" : "none",
      data: { title, year, link: "", rewatch: false },
    });
    const archive = filmArchive([
      film("2026-05-18|heat|1995|0", "2026-05-18", "Heat", 1995),
      film("undated|heat|1995|0", null, "  HEAT ", 1995),
      film("undated|heat|1986|0", null, "Heat", 1986),
      film("undated|alien|1979|0", null, "Alien", 1979),
    ]);
    expect(archive.years[0].months[0].items.map((i) => i.title)).toEqual(["Heat"]);
    expect(archive.undated.map((i) => i.key)).toEqual(["undated|alien|1979|0", "undated|heat|1986|0"]);
  });

  it("skips rows from other sources and rows whose data doesn't parse", () => {
    const broken: LifeLogRow = { source: "letterboxd", key: "x", occurredOn: "2026-01-01", precision: "day", data: { nope: 1 } };
    expect(filmArchive([...rows, broken]).years[0].months).toHaveLength(2);
  });
});

describe("bookArchive", () => {
  const book = (title: string, readAt: string, extra: Partial<Book> = {}): Book => ({
    title,
    author: "Author",
    cover: "https://i.gr-assets.com/c.jpg",
    numRating: 0,
    review: "",
    link: `https://www.goodreads.com/review/show/${title.length}`,
    date: readAt || "2026-01-01T00:00:00.000Z",
    readAt,
    addedAt: "2026-01-01T00:00:00.000Z",
    ...extra,
  });

  it("puts reading now first, dated reads by Istanbul month, then undated", () => {
    const archive = bookArchive({
      currentlyReading: [book("Harry Potter and the Deathly Hallows (Harry Potter, #7)", "")],
      read: [book("Annem Şefika", "2026-09-24T21:30:00.000Z"), book("No Date", ""), book("Hacı Komünist", "2026-07-18T00:00:00.000Z")],
    });
    expect(archive.reading[0]).toMatchObject({
      title: "Harry Potter and the Deathly Hallows",
      fullTitle: "Harry Potter and the Deathly Hallows (Harry Potter, #7)",
      meta: ["Author"],
    });
    // 21:30 UTC on Sep 24 is Sep 25 in Istanbul.
    expect(archive.years[0].months[0]).toMatchObject({ label: "September", items: [{ title: "Annem Şefika", meta: ["Author", "Sep 25"] }] });
    expect(archive.years[0].months[1].label).toBe("July");
    expect(archive.undated.map((i) => i.title)).toEqual(["No Date"]);
  });
});

describe("theatreArchive", () => {
  it("groups by year, newest first, newest post first, and flags and-earlier", () => {
    const years = theatreArchive(rows);
    expect(years.map((y) => [y.year, y.andEarlier, y.items.map((i) => i.title)])).toEqual([
      [2026, false, ["Adel Seni Seçti", "İki"]],
      [2015, true, ["Woyzeck Masalı", "Söylentiler"]],
    ]);
    expect(years[0].items[0].meta).toEqual(["Ankara Devlet Tiyatrosu"]);
  });

  it("latestPlays takes the newest across years", () => {
    expect(latestPlays(rows, 3).map((i) => i.title)).toEqual(["Adel Seni Seçti", "İki", "Woyzeck Masalı"]);
  });
});

describe("savedItems", () => {
  const articles = parseInstapaper(JSON.parse(fixture("instapaper.json")));
  const enrichments = JSON.parse(fixture("enrichments.json"));

  it("prefers the enriched description and a wide enough image", () => {
    const [jurassic] = savedItems(articles, enrichments);
    expect(jurassic).toEqual({
      link: "https://fabiensanglard.net/jurrasic_park_computers/index.html",
      title: "Jurassic Park computers in excruciating detail",
      site: "fabiensanglard.net",
      minutes: 13,
      description: "I watched the movie again and researched every computer and piece of software I spotted.",
      image: "https://fabiensanglard.net/jurrasic_park_computers/og.jpg",
    });
  });

  it("drops a small avatar image and a description that only repeats the title", () => {
    const [, mozilla] = savedItems(articles, enrichments);
    expect(mozilla.image).toBe("");
    expect(mozilla.description).toMatch(/^After more than 15 years/);
  });

  it("drops an article whose link isn't http(s), e.g. from an older snapshot", () => {
    const unsafe = { ...articles[0], link: "javascript:alert(1)" };
    const items = savedItems([unsafe, articles[1]], enrichments);
    expect(items.map((i) => i.title)).toEqual([articles[1].title]);
  });

  it("works with no enrichments at all", () => {
    expect(savedItems(articles, []).map((i) => i.title)).toEqual(articles.map((a) => a.title));
  });
});
