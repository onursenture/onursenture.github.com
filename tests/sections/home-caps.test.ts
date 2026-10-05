import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LifeLogRow } from "@/lib/life-log/types";
import type { Article } from "@/lib/sources/instapaper";

// The home rows cap what the archive pages show in full. The reads are
// mocked so the real `load()` slices are what is under test.
const readSource = vi.hoisted(() => vi.fn());
const readLifeLog = vi.hoisted(() => vi.fn());
vi.mock("@/lib/sources/read", () => ({ readSource }));
vi.mock("@/lib/life-log/read", () => ({ readLifeLog }));

import { articles } from "@/components/sections/articles";
import { theatre } from "@/components/sections/theatre";

const article = (n: number): Article => ({
  title: `Article ${n}`,
  link: `https://example.com/${n}`,
  domain: "example.com",
  minutes: n,
  date: "2026-09-01",
}) as Article;

const playRow = (id: number, year: number): LifeLogRow => ({
  source: "theatre",
  key: String(id),
  occurredOn: `${year}-01-01`,
  precision: "year",
  data: {
    title: `Play ${id}`,
    slug: `play-${id}`,
    company: "Company",
    poster: "",
    link: `https://tiyatrolar.com.tr/tiyatro/play-${id}`,
    andEarlier: false,
  },
}) as LifeLogRow;

beforeEach(() => {
  readSource.mockReset();
  readLifeLog.mockReset();
});

describe("home row caps", () => {
  it("Saved lists the first five of seven articles, in order", async () => {
    const seven = [1, 2, 3, 4, 5, 6, 7].map(article);
    readSource.mockResolvedValue({ data: seven, lastSuccessAt: null });
    const { data } = await articles.load();
    expect(data.map((a) => a.title)).toEqual(["Article 1", "Article 2", "Article 3", "Article 4", "Article 5"]);
  });

  it("Theatre lists the six newest of eight plays, newest first", async () => {
    // Ids 1..8 in 2026 (higher is newer), shuffled in the rows.
    const rows = [3, 8, 1, 6, 4, 7, 2, 5].map((id) => playRow(id, 2026));
    readLifeLog.mockResolvedValue(rows);
    const { data } = await theatre.load();
    expect(data.map((p) => p.title)).toEqual(["Play 8", "Play 7", "Play 6", "Play 5", "Play 4", "Play 3"]);
  });

  it("a Theatre tile with no link is not an anchor", () => {
    const html = renderToStaticMarkup(
      createElement(theatre.Render, { data: [{ key: "1", title: "Iki", meta: ["Company"], href: "", image: "" }] }),
    );
    expect(html).toContain("Iki");
    expect(html).not.toContain("<a");
  });
});
