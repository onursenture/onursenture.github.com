import { describe, expect, it } from "vitest";
import { MemoryLifeLogStore } from "@/lib/life-log/memory-store";
import { filmSlug, fillPosters, resolvePoster } from "@/lib/life-log/posters";

const filmPage = (image: string) =>
  `<html><script type="application/ld+json">{"@type":"Movie","image":"${image}","name":"X"}</script></html>`;

function routes(map: Record<string, Response | (() => Response)>): typeof globalThis.fetch {
  return (async (input: RequestInfo | URL) => {
    const hit = map[String(input)];
    if (!hit) return new Response("nope", { status: 404 });
    return typeof hit === "function" ? hit() : hit.clone();
  }) as typeof globalThis.fetch;
}

describe("filmSlug", () => {
  it("reads the slug from a diary or film URL", () => {
    expect(filmSlug("https://letterboxd.com/onur/film/pickled/")).toBe("pickled");
    expect(filmSlug("https://letterboxd.com/film/heat-1995/")).toBe("heat-1995");
    expect(filmSlug("https://letterboxd.com/onur/film/heat-1995/1/")).toBe("heat-1995");
    expect(filmSlug("https://boxd.it/aaaa")).toBeNull();
  });
});

describe("resolvePoster", () => {
  it("uses the slug in a diary link directly", async () => {
    const fetch = routes({ "https://letterboxd.com/film/pickled/": new Response(filmPage("https://a.ltrbxd.com/p-0-600-0-900-crop.jpg?v=1")) });
    expect(await resolvePoster(fetch, "https://letterboxd.com/onur/film/pickled/")).toBe("https://a.ltrbxd.com/p-0-230-0-345-crop.jpg?v=1");
  });

  it("follows a boxd.it redirect by its Location header only", async () => {
    const fetch = routes({
      "https://boxd.it/aaaa": () => new Response(null, { status: 302, headers: { Location: "https://letterboxd.com/onur/film/heat-1995/" } }),
      "https://letterboxd.com/film/heat-1995/": new Response(filmPage("https://a.ltrbxd.com/h-0-600-0-900-crop.jpg")),
    });
    expect(await resolvePoster(fetch, "https://boxd.it/aaaa")).toBe("https://a.ltrbxd.com/h-0-230-0-345-crop.jpg");
  });

  it("returns empty on any failure", async () => {
    expect(await resolvePoster(routes({}), "https://letterboxd.com/onur/film/gone/")).toBe("");
    expect(await resolvePoster(routes({}), "https://boxd.it/zzzz")).toBe("");
    expect(await resolvePoster(routes({}), "")).toBe("");
  });
});

describe("fillPosters", () => {
  it("fills the newest rows without a poster, up to the limit, and counts failures", async () => {
    const store = new MemoryLifeLogStore();
    const at = new Date("2026-10-05T10:00:00Z");
    const row = (key: string, occurredOn: string, link: string, poster?: string) => ({
      source: "letterboxd" as const,
      key,
      occurredOn,
      precision: "day" as const,
      data: { title: key, year: null, link, rewatch: false, ...(poster ? { poster } : {}) },
    });
    await store.upsert(
      [
        row("old", "2020-01-01", "https://letterboxd.com/onur/film/old/"),
        row("new", "2026-01-01", "https://letterboxd.com/onur/film/new/"),
        row("mid", "2023-01-01", "https://letterboxd.com/onur/film/gone/"),
        row("has", "2026-02-01", "https://letterboxd.com/onur/film/has/", "https://p/has.jpg"),
      ],
      { redate: false, at },
    );
    const fetch = routes({
      "https://letterboxd.com/film/new/": new Response(filmPage("https://a.ltrbxd.com/n-0-600-0-900-crop.jpg")),
    });
    expect(await fillPosters(store, fetch, { limit: 2, at })).toEqual({ filled: 1, failed: 1 });
    const byKey = Object.fromEntries((await store.list("letterboxd")).map((r) => [r.key, r.data.poster]));
    expect(byKey).toEqual({ has: "https://p/has.jpg", new: "https://a.ltrbxd.com/n-0-230-0-345-crop.jpg", mid: undefined, old: undefined });
  });

  const filmRow = (key: string, occurredOn: string, slug: string, extra: Record<string, unknown> = {}) => ({
    source: "letterboxd" as const,
    key,
    occurredOn,
    precision: "day" as const,
    data: { title: key, year: null, link: `https://letterboxd.com/onur/film/${slug}/`, rewatch: false, ...extra },
  });

  it("records a failed attempt and moves on to older rows on the next call", async () => {
    const store = new MemoryLifeLogStore();
    const at = new Date("2026-10-05T10:00:00Z");
    await store.upsert([filmRow("old", "2020-01-01", "old"), filmRow("gone", "2026-01-01", "gone")], { redate: false, at });
    const fetch = routes({
      "https://letterboxd.com/film/old/": new Response(filmPage("https://a.ltrbxd.com/o-0-600-0-900-crop.jpg")),
    });
    expect(await fillPosters(store, fetch, { limit: 1, at })).toEqual({ filled: 0, failed: 1 });
    const rows = Object.fromEntries((await store.list("letterboxd")).map((r) => [r.key, r.data]));
    expect(rows.gone.posterTriedAt).toBe(at.toISOString());
    expect(rows.old.posterTriedAt).toBeUndefined();
    expect(await fillPosters(store, fetch, { limit: 1, at })).toEqual({ filled: 1, failed: 0 });
    expect(await fillPosters(store, fetch, { limit: 1, at })).toEqual({ filled: 0, failed: 0 });
  });

  it("retries a row last tried more than 7 days ago", async () => {
    const store = new MemoryLifeLogStore();
    const at = new Date("2026-10-05T10:00:00Z");
    const tried = new Date(at.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString();
    const recent = new Date(at.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString();
    await store.upsert(
      [filmRow("stale", "2026-02-01", "stale", { posterTriedAt: tried }), filmRow("fresh", "2026-03-01", "fresh", { posterTriedAt: recent })],
      { redate: false, at },
    );
    const fetch = routes({
      "https://letterboxd.com/film/stale/": new Response(filmPage("https://a.ltrbxd.com/s-0-600-0-900-crop.jpg")),
      "https://letterboxd.com/film/fresh/": new Response(filmPage("https://a.ltrbxd.com/f-0-600-0-900-crop.jpg")),
    });
    expect(await fillPosters(store, fetch, { limit: 5, at })).toEqual({ filled: 1, failed: 0 });
    const byKey = Object.fromEntries((await store.list("letterboxd")).map((r) => [r.key, r.data.poster]));
    expect(byKey.stale).toBe("https://a.ltrbxd.com/s-0-230-0-345-crop.jpg");
    expect(byKey.fresh).toBeUndefined();
  });
});
