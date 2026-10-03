import { describe, expect, it, vi } from "vitest";
import { type ExportIO, exportFrames } from "@/lib/work/figma-export";
import type { FigmaTarget } from "@/lib/work/figma-plan";

const targets: FigmaTarget[] = [
  { key: "work/primeone/a", fileKey: "F1", nodeId: "1:1", out: "images-src/work/primeone/a.png" },
  { key: "work/primeone/b", fileKey: "F1", nodeId: "1:2", out: "images-src/work/primeone/b.png" },
  { key: "work/primeone/c", fileKey: "F1", nodeId: "1:3", out: "images-src/work/primeone/c.png" },
];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function io(fetchImpl: (url: string) => Promise<Response>, existing: string[] = []): ExportIO & { written: Map<string, Uint8Array> } {
  const written = new Map<string, Uint8Array>();
  return {
    written,
    fetch: vi.fn((input: RequestInfo | URL) => fetchImpl(String(input))) as unknown as typeof fetch,
    exists: (path) => existing.includes(path),
    write: (path, data) => void written.set(path, data),
    log: () => {},
    warn: vi.fn(),
    now: () => "2026-10-03T00:00:00Z",
  };
}

describe("exportFrames", () => {
  it("skips fresh frames, exports stale ones, and survives a node that fails", async () => {
    const lock = { "work/primeone/a": { fileKey: "F1", nodeId: "1:1", lastModified: "L1", exportedAt: "old" } };
    const env = io(async (url) => {
      if (url.includes("/files/F1/nodes")) return json({ lastModified: "L1", nodes: { "1:1": {}, "1:2": {}, "1:3": null } });
      if (url.includes("/images/F1")) {
        expect(url).toContain("ids=1%3A2");
        expect(url).not.toContain("1%3A1");
        return json({ err: null, images: { "1:2": "https://cdn.figma/b.png" } });
      }
      if (url === "https://cdn.figma/b.png") return new Response(new Uint8Array([1, 2, 3]));
      throw new Error(`unexpected ${url}`);
    }, ["images-src/work/primeone/a.png"]);

    const result = await exportFrames(targets, lock, "TOKEN", env);

    expect([...env.written.keys()]).toEqual(["images-src/work/primeone/b.png"]);
    expect(result.written).toEqual(["work/primeone/b"]);
    expect(result.lock["work/primeone/b"]).toEqual({ fileKey: "F1", nodeId: "1:2", lastModified: "L1", exportedAt: "2026-10-03T00:00:00Z" });
    expect(result.lock["work/primeone/a"].exportedAt).toBe("old");
    expect(result.lock["work/primeone/c"]).toBeUndefined();
    expect(env.warn).toHaveBeenCalledWith(expect.stringContaining("work/primeone/c: node 1:3 not found"));
    expect(result.failed).toBe(false);
  });

  it("re-exports a fresh frame whose output file is missing", async () => {
    const lock = { "work/primeone/a": { fileKey: "F1", nodeId: "1:1", lastModified: "L1", exportedAt: "old" } };
    const env = io(async (url) => {
      if (url.includes("/files/")) return json({ lastModified: "L1", nodes: { "1:1": {} } });
      if (url.includes("/images/")) return json({ err: null, images: { "1:1": "https://cdn.figma/a.png" } });
      return new Response(new Uint8Array([9]));
    });
    const result = await exportFrames([targets[0]], lock, "TOKEN", env);
    expect(result.written).toEqual(["work/primeone/a"]);
  });

  it("sends the token and reports failure when every request fails", async () => {
    const env = io(async () => json({ status: 403, err: "Invalid token" }, 403));
    const result = await exportFrames(targets, {}, "TOKEN", env);
    expect(result.failed).toBe(true);
    expect(result.written).toEqual([]);
    const [, init] = (env.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(init).toEqual({ headers: { "X-Figma-Token": "TOKEN" }, signal: expect.any(AbortSignal) });
  });

  it("warns and keeps going when a 200 response has no nodes, and still returns the lock", async () => {
    const lock = { "work/primeone/a": { fileKey: "F1", nodeId: "1:1", lastModified: "L1", exportedAt: "old" } };
    const env = io(async () => json({ err: "File not found" }));
    const result = await exportFrames(targets, lock, "TOKEN", env);
    expect(result.lock).toEqual(lock);
    expect(result.written).toEqual([]);
    expect(env.warn).toHaveBeenCalledWith(expect.stringContaining("F1"));
    expect(env.warn).toHaveBeenCalledWith(expect.stringContaining("File not found"));
  });

  it("warns and keeps going when the export response has no images", async () => {
    const env = io(async (url) => {
      if (url.includes("/files/")) return json({ lastModified: "L1", nodes: { "1:1": {}, "1:2": {} } });
      if (url.includes("/images/")) return json({ err: "Render timeout" });
      throw new Error(`unexpected ${url}`);
    });
    const result = await exportFrames(targets.slice(0, 2), {}, "TOKEN", env);
    expect(result.lock).toEqual({});
    expect(result.written).toEqual([]);
    expect(env.warn).toHaveBeenCalledWith(expect.stringContaining("Render timeout"));
  });

  it("logs a 200 response's err even when images came back", async () => {
    const env = io(async (url) => {
      if (url.includes("/files/")) return json({ lastModified: "L1", nodes: { "1:1": {} } });
      if (url.includes("/images/")) return json({ err: "partial", images: { "1:1": "https://cdn.figma/a.png" } });
      return new Response(new Uint8Array([1]));
    });
    const result = await exportFrames([targets[0]], {}, "TOKEN", env);
    expect(result.written).toEqual(["work/primeone/a"]);
    expect(env.warn).toHaveBeenCalledWith(expect.stringContaining("partial"));
  });

  it("carries on with the next file when one file group throws", async () => {
    const two: FigmaTarget[] = [
      { key: "work/primeone/a", fileKey: "F1", nodeId: "1:1", out: "images-src/work/primeone/a.png" },
      { key: "work/primeone/b", fileKey: "F2", nodeId: "2:2", out: "images-src/work/primeone/b.png" },
    ];
    const env = io(async (url) => {
      if (url.includes("/files/F1/")) throw new Error("socket hang up");
      if (url.includes("/files/F2/")) return json({ lastModified: "L2", nodes: { "2:2": {} } });
      if (url.includes("/images/F2")) return json({ err: null, images: { "2:2": "https://cdn.figma/b.png" } });
      return new Response(new Uint8Array([2]));
    });
    const result = await exportFrames(two, {}, "TOKEN", env);
    expect(result.written).toEqual(["work/primeone/b"]);
    expect(env.warn).toHaveBeenCalledWith(expect.stringContaining("socket hang up"));
    expect(result.failed).toBe(false);
  });

  it("puts a timeout signal on every request, including downloads", async () => {
    const env = io(async (url) => {
      if (url.includes("/files/")) return json({ lastModified: "L1", nodes: { "1:1": {} } });
      if (url.includes("/images/")) return json({ err: null, images: { "1:1": "https://cdn.figma/a.png" } });
      return new Response(new Uint8Array([1]));
    });
    await exportFrames([targets[0]], {}, "TOKEN", env);
    const calls = (env.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls).toHaveLength(3);
    for (const [, init] of calls) expect(init.signal).toBeInstanceOf(AbortSignal);
  });
});
