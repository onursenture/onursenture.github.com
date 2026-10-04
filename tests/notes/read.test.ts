import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ cacheLife: vi.fn(), cacheTag: vi.fn(), getNoteStore: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ cacheLife: mocks.cacheLife, cacheTag: mocks.cacheTag }));
vi.mock("@/lib/notes/get-store", () => ({ getNoteStore: mocks.getNoteStore }));

import { getPublishedNotes } from "@/lib/notes/read";

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("getPublishedNotes", () => {
  it("tags the read and returns the store's published notes for days", async () => {
    mocks.getNoteStore.mockReturnValue({ listPublished: async () => ["n"] });
    expect(await getPublishedNotes()).toEqual(["n"]);
    expect(mocks.cacheTag).toHaveBeenCalledWith("notes");
    expect(mocks.cacheLife).toHaveBeenCalledWith("days");
  });

  it("returns nothing without a store", async () => {
    mocks.getNoteStore.mockReturnValue(null);
    expect(await getPublishedNotes()).toEqual([]);
    expect(mocks.cacheLife).toHaveBeenCalledWith("hours");
  });

  it("fails soft for minutes on a store error", async () => {
    mocks.getNoteStore.mockReturnValue({ listPublished: async () => Promise.reject(new Error("down")) });
    expect(await getPublishedNotes()).toEqual([]);
    expect(mocks.cacheLife).toHaveBeenCalledWith("minutes");
  });

  it("serves the fixture notes in fixture mode", async () => {
    vi.stubEnv("SOURCE_FIXTURES", "1");
    const notes = await getPublishedNotes();
    expect(notes.length).toBeGreaterThan(30);
    expect(mocks.getNoteStore).not.toHaveBeenCalled();
  });
});
