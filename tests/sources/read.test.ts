import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
  getDb: vi.fn(),
  get: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ cacheLife: mocks.cacheLife, cacheTag: mocks.cacheTag }));
vi.mock("@/lib/db/client", () => ({ getDb: mocks.getDb }));
vi.mock("@/lib/sync/drizzle-store", () => ({
  DrizzleSnapshotStore: class {
    get(source: string) {
      return mocks.get(source);
    }
  },
}));

import { readSource } from "@/lib/sources/read";
import { sourceTag } from "@/lib/sources/tags";

const post = { title: "Second post", link: "https://w00f.org/second-post/", date: "2026-09-20T10:00:00.000Z" };

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("readSource cache lifetime", () => {
  it("caches for hours when there is no database (a stable condition)", async () => {
    mocks.getDb.mockReturnValue(null);
    const view = await readSource("writing");
    expect(view).toEqual({ data: [], lastSuccessAt: null });
    expect(mocks.cacheLife).toHaveBeenCalledTimes(1);
    expect(mocks.cacheLife).toHaveBeenCalledWith("hours");
    expect(mocks.cacheTag).toHaveBeenCalledWith(sourceTag("writing"));
  });

  it("caches for hours when the database returns a snapshot", async () => {
    mocks.getDb.mockReturnValue({});
    mocks.get.mockResolvedValue({
      source: "writing",
      payload: [post],
      lastSuccessAt: new Date("2026-10-02T11:00:00Z"),
      lastAttemptAt: new Date("2026-10-02T11:00:00Z"),
      lastError: null,
      itemCount: 1,
    });
    const view = await readSource("writing");
    expect(view).toEqual({ data: [post], lastSuccessAt: "2026-10-02T11:00:00.000Z" });
    expect(mocks.get).toHaveBeenCalledWith("writing");
    expect(mocks.cacheLife).toHaveBeenCalledTimes(1);
    expect(mocks.cacheLife).toHaveBeenCalledWith("hours");
    expect(mocks.cacheTag).toHaveBeenCalledWith(sourceTag("writing"));
  });

  it("caches for hours when the database has no row yet", async () => {
    mocks.getDb.mockReturnValue({});
    mocks.get.mockResolvedValue(null);
    expect(await readSource("writing")).toEqual({ data: [], lastSuccessAt: null });
    expect(mocks.cacheLife).toHaveBeenCalledTimes(1);
    expect(mocks.cacheLife).toHaveBeenCalledWith("hours");
  });

  it("caches for minutes and returns the empty shape when the database throws", async () => {
    mocks.getDb.mockReturnValue({});
    mocks.get.mockRejectedValue(new Error("connection reset"));
    const view = await readSource("goodreads");
    expect(view).toEqual({
      data: { currentlyReading: [], read: [] },
      lastSuccessAt: null,
    });
    expect(mocks.cacheLife).toHaveBeenCalledTimes(1);
    expect(mocks.cacheLife).toHaveBeenCalledWith("minutes");
    expect(mocks.cacheTag).toHaveBeenCalledWith(sourceTag("goodreads"));
    expect(console.warn).toHaveBeenCalled();
  });
});
