import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

const { revalidateTag } = await import("next/cache");
const { syncResponse, syncStatusCode } = await import("@/lib/sync/respond");

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

describe("syncResponse", () => {
  it("revalidates only sources that synced", async () => {
    const response = syncResponse([
      { source: "github", status: "ok", itemCount: 1 },
      { source: "writing", status: "error", error: "x" },
      { source: "letterboxd", status: "skipped" },
    ]);
    expect(revalidateTag).toHaveBeenCalledTimes(1);
    expect(revalidateTag).toHaveBeenCalledWith("source:github", "max");
    expect(response.status).toBe(502);
    expect((await response.json()).results).toHaveLength(3);
  });
});
