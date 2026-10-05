import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FilePhotoStore, photosFileFor } from "@/lib/photos/file-store";
import { describePhotoStore } from "../helpers/photo-store-contract";

describePhotoStore("FilePhotoStore", async () => new FilePhotoStore(join(mkdtempSync(join(tmpdir(), "photos-")), "content.photos.json")));

describe("photosFileFor", () => {
  it("puts the photos next to the content store file", () => {
    expect(photosFileFor(".e2e-admin/content.json")).toBe(".e2e-admin/content.photos.json");
    expect(photosFileFor("store")).toBe("store.photos.json");
  });
});
