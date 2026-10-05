import { beforeEach, describe, expect, it } from "vitest";
import type { EnrichmentStore, LifeLogRow, LifeLogStore } from "@/lib/life-log/types";

const t0 = new Date("2026-10-05T10:00:00Z");
const t1 = new Date("2026-10-05T11:00:00Z");
const row = (key: string, occurredOn: string | null, data: Record<string, unknown>): LifeLogRow => ({
  source: "letterboxd",
  key,
  occurredOn,
  precision: occurredOn ? "day" : "none",
  data,
});

export function lifeLogStoreContract(name: string, make: () => Promise<{ log: LifeLogStore; enrichments: EnrichmentStore }>) {
  describe(name, () => {
    let log: LifeLogStore;
    let enrichments: EnrichmentStore;
    beforeEach(async () => {
      ({ log, enrichments } = await make());
    });

    it("inserts, lists newest first with undated last, and counts", async () => {
      const counts = await log.upsert(
        [row("a", "2026-09-01", { title: "A" }), row("b", null, { title: "B" }), row("c", "2026-09-20", { title: "C" })],
        { redate: false, at: t0 },
      );
      expect(counts).toEqual({ inserted: 3, updated: 0 });
      expect((await log.list("letterboxd")).map((r) => r.key)).toEqual(["c", "a", "b"]);
      expect(await log.list("theatre")).toEqual([]);
      expect(await log.keys("letterboxd")).toEqual(new Set(["a", "b", "c"]));
    });

    it("merges data and keeps the date unless redate is set", async () => {
      await log.upsert([row("a", "2026-09-01", { title: "A", poster: "p1" })], { redate: false, at: t0 });
      const counts = await log.upsert([row("a", "2026-01-01", { title: "A2" })], { redate: false, at: t1 });
      expect(counts).toEqual({ inserted: 0, updated: 1 });
      const [kept] = await log.list("letterboxd");
      expect(kept).toEqual({ ...row("a", "2026-09-01", { title: "A2", poster: "p1" }) });
      await log.upsert([{ ...row("a", "2025-01-01", {}), precision: "year" }], { redate: true, at: t1 });
      const [redated] = await log.list("letterboxd");
      expect(redated.occurredOn).toBe("2025-01-01");
      expect(redated.precision).toBe("year");
      expect(redated.data).toEqual({ title: "A2", poster: "p1" });
    });

    it("collapses a duplicate key within one batch: merged data, last date, counted once", async () => {
      const counts = await log.upsert(
        [row("a", "2026-09-01", { title: "A", extra: 1 }), row("a", "2026-09-05", { title: "A2" }), row("b", "2026-09-02", { title: "B" })],
        { redate: false, at: t0 },
      );
      expect(counts).toEqual({ inserted: 2, updated: 0 });
      expect(await log.list("letterboxd")).toEqual([
        row("a", "2026-09-05", { title: "A2", extra: 1 }),
        row("b", "2026-09-02", { title: "B" }),
      ].sort((x, y) => (x.occurredOn! < y.occurredOn! ? 1 : -1)));
    });

    it("lets an incoming undefined leave the stored value alone (JSON semantics)", async () => {
      await log.upsert([row("a", "2026-09-01", { title: "A", poster: "p1" })], { redate: false, at: t0 });
      await log.upsert([row("a", "2026-09-01", { title: "A", poster: undefined })], { redate: false, at: t1 });
      const [stored] = await log.list("letterboxd");
      expect(stored.data).toEqual({ title: "A", poster: "p1" });
    });

    it("upserts nothing for an empty batch", async () => {
      expect(await log.upsert([], { redate: false, at: t0 })).toEqual({ inserted: 0, updated: 0 });
    });

    it("stores enrichments by URL, replacing on put", async () => {
      const base = { title: "T", description: "D", imageUrl: null, imageWidth: null, siteName: null, error: null };
      await enrichments.put({ url: "https://a.test/", fetchedAt: t0.toISOString(), ...base });
      await enrichments.put({ url: "https://a.test/", fetchedAt: t1.toISOString(), ...base, title: "T2" });
      expect(await enrichments.all()).toEqual([{ url: "https://a.test/", fetchedAt: t1.toISOString(), ...base, title: "T2" }]);
    });
  });
}
