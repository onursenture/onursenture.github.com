import { describe, expect, it } from "vitest";
import { exportRows, parseCsv } from "@/lib/life-log/letterboxd-csv";

const diary = [
  "﻿Date,Name,Year,Letterboxd URI,Rating,Rewatch,Tags,Watched Date",
  '2026-05-19,Heat,1995,https://boxd.it/aaaa,5,Yes,,2026-05-18',
  '2026-04-21,"Howl\'s Moving Castle",2004,https://boxd.it/bbbb,4.5,,,2026-04-20',
  '2026-04-21,"Soyut Dışavurumcu Bir Dostluğun Anatomisi Veyahut Yan Yana",2025,https://boxd.it/cccc,,,"a, b",2026-04-18',
].join("\r\n");
const watched = [
  "Date,Name,Year,Letterboxd URI",
  "2015-01-01,Heat,1995,https://boxd.it/w1",
  '2015-01-01,"The ""Odd"" One",1999,https://boxd.it/w2',
].join("\n");

describe("parseCsv", () => {
  it("handles a BOM, CRLF, quoted commas and doubled quotes", () => {
    const rows = parseCsv(diary);
    expect(rows).toHaveLength(3);
    expect(rows[2].Tags).toBe("a, b");
    expect(rows[1].Name).toBe("Howl's Moving Castle");
    expect(parseCsv(watched)[1].Name).toBe('The "Odd" One');
  });
});

describe("exportRows", () => {
  it("makes dated diary rows, oldest first, and undated rows for watched-only films", () => {
    const rows = exportRows(diary, watched);
    expect(rows.map((r) => r.key)).toEqual([
      "2026-04-18|soyut dışavurumcu bir dostluğun anatomisi veyahut yan yana|2025|0",
      "2026-04-20|howl's moving castle|2004|0",
      "2026-05-18|heat|1995|0",
      'undated|the "odd" one|1999|0',
    ]);
    expect(rows[2].data).toEqual({ title: "Heat", year: 1995, link: "https://boxd.it/aaaa", rewatch: true });
    expect(rows[3]).toMatchObject({ occurredOn: null, precision: "none" });
  });
});
