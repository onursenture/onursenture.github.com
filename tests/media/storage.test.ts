import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MAX_BYTES } from "@/lib/media/rules";
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

  it("reads only from uploads/, not from renditions or through ..", async () => {
    writeFileSync(join(dir, "secret"), "x");
    await storage.putFile("media/work/nebuu/a-1-640.jpg", Buffer.from("jpg"), "image/jpeg");
    await expect(storage.readSource("local:uploads/../secret")).rejects.toThrow("not a local upload");
    await expect(storage.readSource("local:uploads/../media/work/nebuu/a-1-640.jpg")).rejects.toThrow("not a local upload");
    await expect(storage.deleteSource("local:uploads/../secret")).rejects.toThrow("not a local upload");
    expect(readFileSync(join(dir, "secret"), "utf8")).toBe("x");
  });
});

describe("BlobMediaStorage", () => {
  const url = "https://abc.public.blob.vercel-storage.com/uploads/nebuu/cards-1.png";
  afterEach(() => vi.unstubAllGlobals());

  it("only reads public Blob URLs", async () => {
    await expect(new BlobMediaStorage().readSource("https://evil.test/x.png")).rejects.toThrow("not a Blob URL");
  });

  it("only reads and deletes under uploads/, never renditions", async () => {
    const rendition = "https://abc.public.blob.vercel-storage.com/media/work/nebuu/cards-1-640.jpg";
    await expect(new BlobMediaStorage().readSource(rendition)).rejects.toThrow("not an upload");
    await expect(new BlobMediaStorage().deleteSource(rendition)).rejects.toThrow("not an upload");
  });

  it("refuses an upload past the size cap, declared or streamed", async () => {
    vi.stubGlobal("fetch", async () => new Response("x", { headers: { "content-length": String(MAX_BYTES + 1) } }));
    await expect(new BlobMediaStorage().readSource(url)).rejects.toThrow("too large");
    const chunk = new Uint8Array(MAX_BYTES / 2 + 1);
    vi.stubGlobal(
      "fetch",
      async () =>
        new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(chunk);
              controller.enqueue(chunk);
              controller.close();
            },
          }),
        ),
    );
    await expect(new BlobMediaStorage().readSource(url)).rejects.toThrow("too large");
  });

  it("reads an upload within the cap", async () => {
    vi.stubGlobal("fetch", async () => new Response("png"));
    expect((await new BlobMediaStorage().readSource(url)).toString()).toBe("png");
  });
});
