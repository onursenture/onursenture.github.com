import { afterEach, describe, expect, it, vi } from "vitest";
import { enrichPending, enrichUrl, parseMeta } from "@/lib/life-log/enrich";
import { MemoryEnrichmentStore } from "@/lib/life-log/memory-store";

const FAR = Number.POSITIVE_INFINITY;

const page = `<html><head>
  <meta property="og:title" content="Designing Depth">
  <meta property="og:description" content="  How do you   distill a 3D world?  ">
  <meta property="og:image" content="/static/og-depth.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:site_name" content="rauno.me">
</head><body>…</body></html>`;

describe("parseMeta", () => {
  it("reads og tags and resolves a relative image", () => {
    expect(parseMeta(page, "https://rauno.me/craft/depth")).toEqual({
      title: "Designing Depth",
      description: "How do you distill a 3D world?",
      imageUrl: "https://rauno.me/static/og-depth.png",
      imageWidth: 1200,
      siteName: "rauno.me",
    });
  });

  it("falls back to twitter and name=description, and drops non-http images", () => {
    const meta = parseMeta(
      `<meta name="description" content="Plain"><meta name="twitter:image" content="data:image/png;base64,AA">`,
      "https://a.test/",
    );
    expect(meta).toMatchObject({ description: "Plain", imageUrl: null, imageWidth: null });
  });
});

describe("enrichUrl", () => {
  it("records an error instead of throwing", async () => {
    const fetch = (async () => new Response("no", { status: 500 })) as typeof globalThis.fetch;
    const result = await enrichUrl(fetch, "https://a.test/x", new Date("2026-10-05T10:00:00Z"));
    expect(result).toMatchObject({ url: "https://a.test/x", error: "https://a.test/x returned 500", fetchedAt: "2026-10-05T10:00:00.000Z" });
  });
});

describe("enrichPending", () => {
  const now = new Date("2026-10-05T10:00:00Z");
  const ok = (async () => new Response(page)) as typeof globalThis.fetch;

  it("fetches only URLs without a row, up to the limit", async () => {
    const store = new MemoryEnrichmentStore();
    await store.put({ url: "https://done.test/", title: "x", description: null, imageUrl: null, imageWidth: null, siteName: null, fetchedAt: now.toISOString(), error: null });
    const result = await enrichPending(store, ok, ["https://done.test/", "https://a.test/", "https://b.test/", "https://c.test/"], now, { limit: 2, deadline: FAR });
    expect(result).toEqual({ fetched: 2, failed: 0 });
    expect((await store.all()).map((e) => e.url).sort()).toEqual(["https://a.test/", "https://b.test/", "https://done.test/"]);
  });

  it("retries an errored row only after 7 days", async () => {
    const store = new MemoryEnrichmentStore();
    const errored = (days: number) => ({
      url: `https://e${days}.test/`,
      title: null, description: null, imageUrl: null, imageWidth: null, siteName: null,
      fetchedAt: new Date(now.getTime() - days * 86_400_000).toISOString(),
      error: "boom",
    });
    await store.put(errored(3));
    await store.put(errored(8));
    const result = await enrichPending(store, ok, ["https://e3.test/", "https://e8.test/"], now, { deadline: FAR });
    expect(result).toEqual({ fetched: 1, failed: 0 });
  });

  describe("time budget", () => {
    afterEach(() => vi.restoreAllMocks());

    it("starts nothing when the deadline has passed and stores no row", async () => {
      const store = new MemoryEnrichmentStore();
      let calls = 0;
      const fetch = (async () => {
        calls++;
        return new Response(page);
      }) as typeof globalThis.fetch;
      const result = await enrichPending(store, fetch, ["https://a.test/", "https://b.test/"], now, { deadline: Date.now() - 1 });
      expect(result).toEqual({ fetched: 0, failed: 0 });
      expect(calls).toBe(0);
      expect(await store.all()).toEqual([]);
    });

    it("stops before a link that might not finish by the deadline; the rest stays pending", async () => {
      const store = new MemoryEnrichmentStore();
      let clock = 0;
      vi.spyOn(Date, "now").mockImplementation(() => clock);
      const fetch = (async () => {
        clock = 15_000; // the first link took 15 s of a 20 s budget
        return new Response(page);
      }) as typeof globalThis.fetch;
      const result = await enrichPending(store, fetch, ["https://a.test/", "https://b.test/"], now, { deadline: 20_000 });
      expect(result).toEqual({ fetched: 1, failed: 0 });
      expect((await store.all()).map((e) => e.url)).toEqual(["https://a.test/"]);
    });

    it("ends a request at the timeout it is given", async () => {
      const fetch = (async (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_, reject) => {
          init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
        })) as typeof globalThis.fetch;
      const started = performance.now();
      const result = await enrichUrl(fetch, "https://slow.test/", now, 20);
      expect(result.error).toBeTruthy();
      expect(performance.now() - started).toBeLessThan(2_000);
    });
  });

  it("enriches five links a run by default", async () => {
    const store = new MemoryEnrichmentStore();
    const urls = [1, 2, 3, 4, 5, 6, 7].map((n) => `https://n${n}.test/`);
    expect(await enrichPending(store, ok, urls, now, { deadline: FAR })).toEqual({ fetched: 5, failed: 0 });
  });
});
