import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
  getContentStore: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ cacheLife: mocks.cacheLife, cacheTag: mocks.cacheTag }));
vi.mock("@/lib/content/get-store", () => ({ getContentStore: mocks.getContentStore }));

import { CONTENT_TAG, getPublishedContent } from "@/lib/content/read";
import { repoSite } from "@/lib/content/site";

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

const store = (listDocs: () => Promise<unknown[]>) => ({ listDocs, listMedia: async () => [] });

describe("getPublishedContent", () => {
  it("reads the store for days, not as a fallback", async () => {
    mocks.getContentStore.mockReturnValue(store(async () => []));
    const content = await getPublishedContent();
    expect(content.fallback).toBe(false);
    expect(content.site).toEqual(repoSite());
    expect(mocks.cacheTag).toHaveBeenCalledWith(CONTENT_TAG);
    expect(mocks.cacheLife).toHaveBeenCalledTimes(1);
    expect(mocks.cacheLife).toHaveBeenCalledWith("days");
  });

  it("falls back to the repo for minutes when the store fails", async () => {
    mocks.getContentStore.mockReturnValue(store(async () => Promise.reject(new Error("connection reset"))));
    const content = await getPublishedContent();
    expect(content).toEqual({ site: repoSite(), media: [], fallback: true });
    expect(mocks.cacheLife).toHaveBeenCalledTimes(1);
    expect(mocks.cacheLife).toHaveBeenCalledWith("minutes");
  });

  it("marks the repo content as a fallback without a store, or when the store can't be made", async () => {
    mocks.getContentStore.mockReturnValue(null);
    expect((await getPublishedContent()).fallback).toBe(true);
    mocks.getContentStore.mockImplementation(() => {
      throw new Error("CONTENT_STORE_FILE is for local development and e2e only");
    });
    expect((await getPublishedContent()).fallback).toBe(true);
  });
});
