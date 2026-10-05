import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ cacheLife: vi.fn(), cacheTag: vi.fn(), getPhotoStore: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ cacheLife: mocks.cacheLife, cacheTag: mocks.cacheTag }));
vi.mock("@/lib/photos/get-store", () => ({ getPhotoStore: mocks.getPhotoStore }));

import { getPublishedPhotos } from "@/lib/photos/read";

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("getPublishedPhotos", () => {
  it("tags the read and returns the store's published photos for days", async () => {
    mocks.getPhotoStore.mockReturnValue({ listPublished: async () => ["p"] });
    expect(await getPublishedPhotos()).toEqual(["p"]);
    expect(mocks.cacheTag).toHaveBeenCalledWith("photos");
    expect(mocks.cacheLife).toHaveBeenCalledWith("days");
  });

  it("returns nothing without a store", async () => {
    mocks.getPhotoStore.mockReturnValue(null);
    expect(await getPublishedPhotos()).toEqual([]);
    expect(mocks.cacheLife).toHaveBeenCalledWith("hours");
  });

  it("fails soft for minutes on a store error", async () => {
    mocks.getPhotoStore.mockReturnValue({ listPublished: async () => Promise.reject(new Error("down")) });
    expect(await getPublishedPhotos()).toEqual([]);
    expect(mocks.cacheLife).toHaveBeenCalledWith("minutes");
  });

  it("serves the fixture photos in fixture mode", async () => {
    vi.stubEnv("SOURCE_FIXTURES", "1");
    expect((await getPublishedPhotos()).map((p) => p.slug)).toEqual(["night-boulevard", "kizilcikli", "stabilo"]);
    expect(mocks.getPhotoStore).not.toHaveBeenCalled();
  });
});
