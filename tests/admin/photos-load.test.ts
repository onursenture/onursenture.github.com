import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getPhotoStore: vi.fn(), uploadMode: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/photos/get-store", () => ({ getPhotoStore: mocks.getPhotoStore }));
vi.mock("@/lib/media/storage", () => ({ uploadMode: mocks.uploadMode }));

import { loadPhotosConsole, photoCounts } from "@/lib/admin/photos";

const photo = (status: "draft" | "published") => ({ id: status, status });

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  mocks.uploadMode.mockReturnValue("local");
});

describe("loadPhotosConsole", () => {
  it("loads every photo and where uploads go", async () => {
    mocks.getPhotoStore.mockReturnValue({ list: async () => [photo("draft")] });
    expect(await loadPhotosConsole()).toEqual({ photos: [photo("draft")], available: true, uploadMode: "local" });
  });

  it("is unavailable without a store or when the store fails", async () => {
    mocks.getPhotoStore.mockReturnValue(null);
    expect(await loadPhotosConsole()).toEqual({ photos: [], available: false, uploadMode: "local" });
    mocks.getPhotoStore.mockReturnValue({ list: async () => Promise.reject(new Error("down")) });
    expect((await loadPhotosConsole()).available).toBe(false);
  });
});

describe("photoCounts", () => {
  it("counts published photos and drafts, or null when the store can't be read", async () => {
    mocks.getPhotoStore.mockReturnValue({ list: async () => [photo("draft"), photo("published"), photo("published")] });
    expect(await photoCounts()).toEqual({ published: 2, drafts: 1 });
    mocks.getPhotoStore.mockReturnValue(null);
    expect(await photoCounts()).toBeNull();
  });
});
