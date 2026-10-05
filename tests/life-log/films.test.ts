import { describe, expect, it } from "vitest";
import { filmRows, normaliseTitle, posterCrop } from "@/lib/life-log/films";

const entry = (title: string, watchedOn: string | null, extra: Partial<Parameters<typeof filmRows>[0][number]> = {}) => ({
  title,
  year: 2010,
  link: "https://letterboxd.com/onur/film/x/",
  rewatch: false,
  watchedOn,
  ...extra,
});

describe("filmRows", () => {
  it("keys by watch date, normalised title, year and a same-key counter", () => {
    const rows = filmRows([entry("Heat", "2026-05-18"), entry("  HEAT ", "2026-05-18"), entry("Heat", null)]);
    expect(rows.map((r) => r.key)).toEqual(["2026-05-18|heat|2010|0", "2026-05-18|heat|2010|1", "undated|heat|2010|0"]);
    expect(rows[0]).toMatchObject({ source: "letterboxd", occurredOn: "2026-05-18", precision: "day" });
    expect(rows[2]).toMatchObject({ occurredOn: null, precision: "none" });
  });

  it("leaves an empty poster out of data so a merge keeps a filled one", () => {
    const [noPoster, withPoster] = filmRows([entry("A", "2026-01-01"), entry("B", "2026-01-02", { poster: "https://p/x.jpg" })]);
    expect(noPoster.data).toEqual({ title: "A", year: 2010, link: "https://letterboxd.com/onur/film/x/", rewatch: false });
    expect(withPoster.data.poster).toBe("https://p/x.jpg");
  });

  it("normalises NFC, case and whitespace", () => {
    expect(normaliseTitle("  Ölü̈  Deniz ")).toBe(normaliseTitle("ölü̈ deniz"));
  });
});

describe("posterCrop", () => {
  it("asks for the 230×345 crop", () => {
    expect(posterCrop("https://a.ltrbxd.com/resized/film-poster/9/4/947019-pickled-0-600-0-900-crop.jpg?v=1")).toBe(
      "https://a.ltrbxd.com/resized/film-poster/9/4/947019-pickled-0-230-0-345-crop.jpg?v=1",
    );
    expect(posterCrop("")).toBe("");
  });
});
