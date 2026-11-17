import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

const { revalidateTag } = await import("next/cache");
const { revalidateResults, syncResponse, syncStatusCode } = await import("@/lib/sync/respond");

beforeEach(() => vi.mocked(revalidateTag).mockClear());

describe("syncStatusCode", () => {
  const blip = { source: "goodreads", status: "error", error: "timeout", stale: false } as const;
  const stale = { source: "writing", status: "error", error: "x", stale: true } as const;

  it("is 200 when nothing failed", () => {
    expect(syncStatusCode([{ source: "github", status: "skipped" }])).toBe(200);
  });

  it("by default fails only on a stale error, so a one-off timeout doesn't email", () => {
    expect(syncStatusCode([{ source: "github", status: "ok", itemCount: 1 }, blip])).toBe(200);
    expect(syncStatusCode([{ source: "github", status: "ok", itemCount: 1 }, blip, stale])).toBe(502);
  });

  it('fails on any error with "any"', () => {
    expect(syncStatusCode([blip], "any")).toBe(502);
  });
});

describe("revalidateResults", () => {
  it("revalidates only sources that synced", () => {
    revalidateResults([
      { source: "github", status: "ok", itemCount: 1 },
      { source: "writing", status: "error", error: "x", stale: true },
      { source: "letterboxd", status: "skipped" },
    ]);
    expect(revalidateTag).toHaveBeenCalledTimes(1);
    expect(revalidateTag).toHaveBeenCalledWith("source:github", "max");
  });

  it("revalidates an ok result's archive tags too", () => {
    revalidateResults([{ source: "letterboxd", status: "ok", itemCount: 1, archive: { note: "+1", tags: ["life:letterboxd"] } }]);
    expect(revalidateTag).toHaveBeenCalledWith("source:letterboxd", "max");
    expect(revalidateTag).toHaveBeenCalledWith("life:letterboxd", "max");
  });
});

describe("syncResponse", () => {
  // The routes revalidate per result as it comes in; the response must not
  // revalidate the same tags a second time.
  it("lists every result with the status code and revalidates nothing", async () => {
    const response = syncResponse([
      { source: "github", status: "ok", itemCount: 1 },
      { source: "writing", status: "error", error: "x", stale: true },
      { source: "letterboxd", status: "skipped", reason: "deadline" },
    ]);
    expect(revalidateTag).not.toHaveBeenCalled();
    expect(response.status).toBe(502);
    expect((await response.json()).results).toHaveLength(3);
  });
});
