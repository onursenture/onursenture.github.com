import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

const { revalidateTag } = await import("next/cache");
const { revalidateResults, syncResponse, syncStatusCode } = await import("@/lib/sync/respond");

beforeEach(() => vi.mocked(revalidateTag).mockClear());

describe("syncStatusCode", () => {
  it("is 200 when nothing failed, 502 otherwise", () => {
    expect(syncStatusCode([{ source: "github", status: "skipped" }])).toBe(200);
    expect(
      syncStatusCode([
        { source: "github", status: "ok", itemCount: 1 },
        { source: "writing", status: "error", error: "x" },
      ]),
    ).toBe(502);
  });
});

describe("revalidateResults", () => {
  it("revalidates only sources that synced", () => {
    revalidateResults([
      { source: "github", status: "ok", itemCount: 1 },
      { source: "writing", status: "error", error: "x" },
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
      { source: "writing", status: "error", error: "x" },
      { source: "letterboxd", status: "skipped", reason: "deadline" },
    ]);
    expect(revalidateTag).not.toHaveBeenCalled();
    expect(response.status).toBe(502);
    expect((await response.json()).results).toHaveLength(3);
  });
});
