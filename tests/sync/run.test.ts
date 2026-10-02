import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { SourceDefinition, SourceId } from "@/lib/sources/types";
import { MemorySnapshotStore } from "@/lib/sync/memory-store";
import { isDue, syncAll, syncSource } from "@/lib/sync/run";

const ctx = { fetch: globalThis.fetch, env: {} };
const t0 = new Date("2026-10-02T12:00:00Z");
const minutes = (n: number) => new Date(t0.getTime() + n * 60_000);

function source(
  fetchImpl: () => Promise<string[]>,
  intervalMinutes = 60,
  id: SourceId = "writing",
): SourceDefinition<string[]> {
  return {
    id,
    intervalMinutes,
    empty: [],
    schema: z.array(z.string()),
    fetch: fetchImpl,
    count: (items) => items.length,
  };
}

describe("syncSource", () => {
  it("stores the payload on success", async () => {
    const store = new MemorySnapshotStore();
    const result = await syncSource(source(async () => ["a", "b"]), store, ctx, t0, null);
    expect(result).toEqual({ source: "writing", status: "ok", itemCount: 2 });
    expect(await store.get("writing")).toMatchObject({
      payload: ["a", "b"],
      itemCount: 2,
      lastSuccessAt: t0,
      lastError: null,
    });
  });

  it("keeps the last good payload when a later sync fails", async () => {
    const store = new MemorySnapshotStore();
    await syncSource(source(async () => ["a"]), store, ctx, t0, null);
    const result = await syncSource(
      source(async () => {
        throw new Error("upstream down");
      }),
      store,
      ctx,
      minutes(60),
      await store.get("writing"),
    );
    expect(result).toEqual({ source: "writing", status: "error", error: "upstream down" });
    expect(await store.get("writing")).toMatchObject({
      payload: ["a"],
      itemCount: 1,
      lastSuccessAt: t0,
      lastAttemptAt: minutes(60),
      lastError: "upstream down",
    });
  });

  it("treats a schema mismatch as a failure", async () => {
    const store = new MemorySnapshotStore();
    const bad = source(async () => [42] as unknown as string[]);
    const result = await syncSource(bad, store, ctx, t0, null);
    expect(result.status).toBe("error");
    expect((await store.get("writing"))?.payload).toBeNull();
  });

  it("ok then empty keeps the previous snapshot and records an error", async () => {
    const store = new MemorySnapshotStore();
    await syncSource(source(async () => ["a", "b"]), store, ctx, t0, null);
    const result = await syncSource(
      source(async () => []),
      store,
      ctx,
      minutes(60),
      await store.get("writing"),
    );
    expect(result).toEqual({
      source: "writing",
      status: "error",
      error: "upstream returned 0 items; kept previous 2",
    });
    expect(await store.get("writing")).toMatchObject({
      payload: ["a", "b"],
      itemCount: 2,
      lastSuccessAt: t0,
      lastAttemptAt: minutes(60),
      lastError: "upstream returned 0 items; kept previous 2",
    });
  });

  it("empty with no previous data is ok", async () => {
    // The writing source is legitimately empty until the first post.
    const store = new MemorySnapshotStore();
    const result = await syncSource(
      source(async () => []),
      store,
      ctx,
      t0,
      await store.get("writing"),
    );
    expect(result).toEqual({ source: "writing", status: "ok", itemCount: 0 });
    expect(await store.get("writing")).toMatchObject({
      payload: [],
      itemCount: 0,
      lastSuccessAt: t0,
      lastError: null,
    });
  });

  it("empty after an empty snapshot is still ok", async () => {
    const store = new MemorySnapshotStore();
    await syncSource(source(async () => []), store, ctx, t0, null);
    const result = await syncSource(
      source(async () => []),
      store,
      ctx,
      minutes(60),
      await store.get("writing"),
    );
    expect(result).toEqual({ source: "writing", status: "ok", itemCount: 0 });
  });
});

describe("isDue", () => {
  const def = source(async () => [], 60);

  it("is due when never attempted", () => {
    expect(isDue(def, null, t0)).toBe(true);
  });

  it("allows five minutes of cron slack", () => {
    const snapshot = {
      source: "writing" as const,
      payload: [],
      itemCount: 0,
      lastSuccessAt: t0,
      lastAttemptAt: t0,
      lastError: null,
    };
    expect(isDue(def, snapshot, minutes(54))).toBe(false);
    expect(isDue(def, snapshot, minutes(55))).toBe(true);
  });
});

describe("syncAll", () => {
  it("skips sources that are not due unless forced", async () => {
    const store = new MemorySnapshotStore();
    const def = source(async () => ["a"]);
    await syncAll([def], store, ctx, t0);
    expect(await syncAll([def], store, ctx, minutes(10))).toEqual([
      { source: "writing", status: "skipped" },
    ]);
    expect(await syncAll([def], store, ctx, minutes(10), { force: true })).toEqual([
      { source: "writing", status: "ok", itemCount: 1 },
    ]);
  });

  it("keeps syncing the other sources when one fails", async () => {
    const store = new MemorySnapshotStore();
    const defs = [
      source(async () => ["film"], 60, "letterboxd"),
      source(async () => {
        throw new Error("goodreads down");
      }, 60, "goodreads"),
      source(async () => ["post"], 60, "writing"),
    ];
    expect(await syncAll(defs, store, ctx, t0)).toEqual([
      { source: "letterboxd", status: "ok", itemCount: 1 },
      { source: "goodreads", status: "error", error: "goodreads down" },
      { source: "writing", status: "ok", itemCount: 1 },
    ]);
    expect(await store.get("letterboxd")).toMatchObject({ payload: ["film"], lastError: null });
    expect(await store.get("goodreads")).toMatchObject({
      payload: null,
      lastError: "goodreads down",
    });
    expect(await store.get("writing")).toMatchObject({ payload: ["post"], lastError: null });
  });

  it("passes the stored snapshot through, so an empty fetch cannot overwrite it", async () => {
    const store = new MemorySnapshotStore();
    await syncAll([source(async () => ["a"])], store, ctx, t0);
    const results = await syncAll([source(async () => [])], store, ctx, minutes(60));
    expect(results).toEqual([
      {
        source: "writing",
        status: "error",
        error: "upstream returned 0 items; kept previous 1",
      },
    ]);
    expect((await store.get("writing"))?.payload).toEqual(["a"]);
  });
});
