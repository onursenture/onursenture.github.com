import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeEach, describe, expect, it } from "vitest";
import { DrizzleSnapshotStore } from "@/lib/sync/drizzle-store";

const t0 = new Date("2026-10-02T12:00:00.000Z");
const t1 = new Date("2026-10-02T13:00:00.000Z");

describe("DrizzleSnapshotStore", () => {
  let store: DrizzleSnapshotStore;

  beforeEach(async () => {
    const db = drizzle(new PGlite());
    await migrate(db, { migrationsFolder: "./drizzle" });
    store = new DrizzleSnapshotStore(db);
  });

  it("returns null for an unknown source", async () => {
    expect(await store.get("github")).toBeNull();
  });

  it("round-trips a successful sync", async () => {
    await store.recordSuccess("letterboxd", [{ title: "A" }], 1, t0);
    expect(await store.get("letterboxd")).toEqual({
      source: "letterboxd",
      payload: [{ title: "A" }],
      lastSuccessAt: t0,
      lastAttemptAt: t0,
      lastError: null,
      itemCount: 1,
      archiveNote: null,
    });
  });

  it("keeps payload and success time when a failure is recorded", async () => {
    await store.recordSuccess("letterboxd", [{ title: "A" }], 1, t0);
    await store.recordFailure("letterboxd", "boom", t1);
    expect(await store.get("letterboxd")).toEqual({
      source: "letterboxd",
      payload: [{ title: "A" }],
      lastSuccessAt: t0,
      lastAttemptAt: t1,
      lastError: "boom",
      itemCount: 1,
      archiveNote: null,
    });
  });

  it("records a failure for a source that never succeeded", async () => {
    await store.recordFailure("github", "GH_PAT is not set", t0);
    expect(await store.get("github")).toMatchObject({
      payload: null,
      lastSuccessAt: null,
      lastError: "GH_PAT is not set",
      itemCount: 0,
    });
  });

  it("records an archive note without touching the snapshot", async () => {
    await store.recordSuccess("letterboxd", [{ title: "A" }], 1, t0);
    await store.recordArchive("letterboxd", "+2 films", t1);
    expect(await store.get("letterboxd")).toMatchObject({ payload: [{ title: "A" }], itemCount: 1, archiveNote: "+2 films" });
  });

  it("clears the error on the next success", async () => {
    await store.recordFailure("github", "boom", t0);
    await store.recordSuccess("github", { total: 1, weeks: [] }, 1, t1);
    expect(await store.get("github")).toMatchObject({ lastError: null, lastSuccessAt: t1 });
  });
});
