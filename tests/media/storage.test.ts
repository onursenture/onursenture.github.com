import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BlobMediaStorage, LocalMediaStorage } from "@/lib/media/storage";

describe("LocalMediaStorage", () => {
  const dir = mkdtempSync(join(tmpdir(), "media-"));
  const storage = new LocalMediaStorage(dir);

  it("keeps uploads and renditions inside its folder and serves them from /api/media-dev/", async () => {
    const source = await storage.saveSource(Buffer.from("png"), "image/png");
    expect(source).toMatch(/^local:uploads\/[0-9a-f-]+\.png$/);
    expect((await storage.readSource(source)).toString()).toBe("png");
    expect(await storage.putFile("media/work/nebuu/a-1-640.jpg", Buffer.from("jpg"), "image/jpeg")).toBe("/api/media-dev/media/work/nebuu/a-1-640.jpg");
    expect(readFileSync(join(dir, "media/work/nebuu/a-1-640.jpg"), "utf8")).toBe("jpg");
    await storage.deleteSource(source);
    await expect(storage.readSource(source)).rejects.toThrow();
  });

  it("refuses paths that leave its folder", async () => {
    expect(storage.resolveLocal("../etc/passwd")).toBeNull();
    await expect(storage.readSource("local:../secret")).rejects.toThrow();
    await expect(storage.readSource("https://evil.test/x.png")).rejects.toThrow();
  });
});

describe("BlobMediaStorage", () => {
  it("only reads public Blob URLs", async () => {
    await expect(new BlobMediaStorage().readSource("https://evil.test/x.png")).rejects.toThrow("not a Blob URL");
  });
});
