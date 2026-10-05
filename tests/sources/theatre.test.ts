import { describe, expect, it } from "vitest";
import { MemoryEnrichmentStore, MemoryLifeLogStore } from "@/lib/life-log/memory-store";
import { historyRows, parseActivity, theatre } from "@/lib/sources/theatre";
import { theatreHistory } from "@/content/theatre-history";
import { fixture } from "../helpers/fixtures";

const watchLi = (id: string, ago: string, slug: string, title: string, company: string) => `
<li class="postli_${id}">
  <div class="post-header comment-handler follow-item">
    <a class="" href="/u/onursenture/izledikleri"><div class="icon-holder view"></div></a>
    <p><a href="https://tiyatrolar.com.tr/u/onursenture">Onur Senture</a>, tiyatro
      <a href="https://tiyatrolar.com.tr/u/onursenture/post/${id}"> izledi</a><br /><span>${ago}</span></p>
  </div>
  <div class="comment-figure"><ul class="image-list follow-list center-text"><li class="follow-item">
    <figure class="rating level-5">4.9</figure>
    <a href="https://tiyatrolar.com.tr/tiyatro/${slug}">
      <img src="https://tiyatrolar.com.tr/files/activity/a/${slug}/image/${slug}-41x59.jpg">
      <div class="act exhibition-img-title"><h6>${title}<span class="wall_extra_info"> / ${company}</span></h6></div>
    </a>
  </li></ul></div>
  <div class="post-actions"></div>
</li>`;
const otherLi = (id: string) => `
<li class="postli_${id}"><div class="post-header comment-handler follow-item"><p>
  <a href="https://tiyatrolar.com.tr/u/onursenture">Onur Senture</a>, tiyatroyu
  <a href="https://tiyatrolar.com.tr/u/onursenture/post/${id}"> alkışladı</a><br /><span>3 gün önce</span></p></div>
  <div class="post-actions"></div></li>`;
const page = (items: string[], more: boolean, next: number) =>
  JSON.stringify({ sta: 1, msg: "Başarılı", html: items.join(""), html_btn: more, new_offset: next });

describe("parseActivity", () => {
  it("keeps only watch posts and reads title, company, slug and the full-size poster", () => {
    const { ids, watches } = parseActivity(
      [otherLi("9"), watchLi("8", "3 gün önce", "adel-seni-secti-1", "Adel Seni Seçti", "Ankara Devlet Tiyatrosu")].join(""),
    );
    expect(ids).toEqual(["9", "8"]);
    expect(watches).toEqual([
      {
        id: "8",
        title: "Adel Seni Seçti",
        slug: "adel-seni-secti-1",
        company: "Ankara Devlet Tiyatrosu",
        poster: "https://tiyatrolar.com.tr/files/activity/a/adel-seni-secti-1/image/adel-seni-secti-1.jpg",
        link: "https://tiyatrolar.com.tr/tiyatro/adel-seni-secti-1",
        ago: "3 gün önce",
      },
    ]);
  });

  it("parses the recorded page", () => {
    const json = JSON.parse(fixture("theatre-activity.json"));
    const { ids, watches } = parseActivity(json.html);
    expect(ids.length).toBeGreaterThan(0);
    expect(watches.length).toBeGreaterThan(0);
    for (const watch of watches) {
      expect(watch.link).toMatch(/^https:\/\/tiyatrolar\.com\.tr\/tiyatro\//);
      expect(watch.poster).not.toContain("-41x59");
      expect(watch.title).not.toContain("/");
    }
  });
});

describe("theatre.fetch", () => {
  const endpoint = "https://tiyatrolar.com.tr/posts/load_more_user_item_via_ajax/";

  function pagedFetch(pages: string[]) {
    const offsets: number[] = [];
    const impl = (async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input) !== endpoint) return new Response("no", { status: 404 });
      const offset = Number(new URLSearchParams(String(init?.body)).get("offset"));
      offsets.push(offset);
      return new Response(pages[offset / 5] ?? page([], false, offset));
    }) as typeof globalThis.fetch;
    return { impl, offsets };
  }

  it("returns every watch up to the first page holding a known post id", async () => {
    const lifeLog = new MemoryLifeLogStore();
    await lifeLog.upsert(
      [{ source: "theatre", key: "50", occurredOn: "2026-01-01", precision: "year", data: {} }],
      { redate: false, at: new Date() },
    );
    const { impl, offsets } = pagedFetch([
      page([watchLi("90", "3 gün önce", "a", "A", "X"), otherLi("89")], true, 5),
      page([watchLi("70", "1 hafta önce", "b", "B", "Y"), watchLi("50", "2 hafta önce", "d", "D", "W")], true, 10),
      page([watchLi("40", "1 ay önce", "c", "C", "Z")], false, 15),
    ]);
    const watches = await theatre.fetch({ fetch: impl, env: {}, stores: { lifeLog, enrichments: new MemoryEnrichmentStore() } });
    expect(offsets).toEqual([0, 5]);
    expect(watches.map((w) => w.id)).toEqual(["90", "70", "50"]);
  });

  it("does not throw when page 0 has only other activity and a later page holds a known watch", async () => {
    const lifeLog = new MemoryLifeLogStore();
    await lifeLog.upsert(
      [{ source: "theatre", key: "50", occurredOn: "2026-01-01", precision: "year", data: {} }],
      { redate: false, at: new Date() },
    );
    const { impl, offsets } = pagedFetch([
      page([otherLi("90"), otherLi("89")], true, 5),
      page([watchLi("50", "2 hafta önce", "d", "D", "W")], true, 10),
    ]);
    const watches = await theatre.fetch({ fetch: impl, env: {}, stores: { lifeLog, enrichments: new MemoryEnrichmentStore() } });
    expect(offsets).toEqual([0, 5]);
    expect(watches.map((w) => w.id)).toEqual(["50"]);
  });

  it("throws when no watch post was found", async () => {
    const { impl } = pagedFetch([page([otherLi("1")], false, 5)]);
    await expect(theatre.fetch({ fetch: impl, env: {} })).rejects.toThrow("no watches");
  });
});

describe("theatre.archive", () => {
  it("seeds the history file and adds new watches with their year", async () => {
    const lifeLog = new MemoryLifeLogStore();
    const now = new Date("2026-10-05T09:00:00Z");
    const outcome = await theatre.archive!(
      [
        { id: "9999999", title: "New Play", slug: "new-play", company: "Co", poster: "https://p/x.jpg", link: "https://tiyatrolar.com.tr/tiyatro/new-play", ago: "2 gün önce" },
      ],
      { stores: { lifeLog, enrichments: new MemoryEnrichmentStore() }, fetch: globalThis.fetch, now, deadline: Number.POSITIVE_INFINITY },
    );
    const rows = await lifeLog.list("theatre");
    expect(rows).toHaveLength(theatreHistory.length + 1);
    expect(rows.find((r) => r.key === "9999999")).toMatchObject({ occurredOn: "2026-01-01", precision: "year", data: { title: "New Play", andEarlier: false } });
    expect(outcome.note).toBe(`+${theatreHistory.length + 1} plays`);
    expect(outcome.tags).toEqual(["life:theatre"]);
  });

  it("a history-only run seeds an empty store and reports the seeded rows", async () => {
    const lifeLog = new MemoryLifeLogStore();
    const outcome = await theatre.archive!([], {
      stores: { lifeLog, enrichments: new MemoryEnrichmentStore() },
      fetch: globalThis.fetch,
      now: new Date("2026-10-05T09:00:00Z"),
      deadline: Number.POSITIVE_INFINITY,
    });
    expect(outcome.note).toBe(`+${theatreHistory.length} plays`);
    expect(outcome.tags).toEqual(["life:theatre"]);
  });

  it("revalidates the tag when only a corrected year was re-seeded", async () => {
    const lifeLog = new MemoryLifeLogStore();
    const stores = { lifeLog, enrichments: new MemoryEnrichmentStore() };
    const now = new Date("2026-10-05T09:00:00Z");
    await theatre.archive!([], { stores, fetch: globalThis.fetch, now, deadline: Number.POSITIVE_INFINITY });
    const first = theatreHistory[0];
    await lifeLog.upsert([{ ...historyRows()[0], occurredOn: "1999-01-01" }], { redate: true, at: now });
    const outcome = await theatre.archive!([], { stores, fetch: globalThis.fetch, now, deadline: Number.POSITIVE_INFINITY });
    expect(outcome.note).toBe("+0 plays");
    expect(outcome.tags).toEqual(["life:theatre"]);
    expect((await lifeLog.list("theatre")).find((r) => r.key === first.id)?.occurredOn).toBe(`${first.year}-01-01`);
  });

  it("history rows carry the file's year and the and-earlier flag", () => {
    const rows = historyRows();
    expect(rows).toHaveLength(theatreHistory.length);
    const oldest = Math.min(...theatreHistory.map((r) => r.year));
    for (const row of rows) {
      const source = theatreHistory.find((r) => r.id === row.key)!;
      expect(row.occurredOn).toBe(`${source.year}-01-01`);
      expect(row.data.andEarlier).toBe(source.year === oldest);
    }
  });
});
