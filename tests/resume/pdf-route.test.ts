import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ publishedResumePdf: vi.fn() }));
vi.mock("@/lib/resume/pdf/published", () => ({ publishedResumePdf: mocks.publishedResumePdf }));

import { GET } from "@/app/resume.pdf/route";

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("/resume.pdf", () => {
  it("serves the published PDF inline", async () => {
    mocks.publishedResumePdf.mockResolvedValue(Buffer.from("%PDF-1.3").toString("base64"));
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(Buffer.from(await response.arrayBuffer()).toString("latin1")).toBe("%PDF-1.3");
  });

  // A prerendered route stores its status: a 500 would replace the last good
  // PDF. Throwing keeps it (and fails the build if the repo resume can't render).
  it("logs and rethrows a render error instead of answering 500", async () => {
    const error = new Error("font missing");
    mocks.publishedResumePdf.mockRejectedValue(error);
    await expect(GET()).rejects.toBe(error);
    expect(console.error).toHaveBeenCalledWith("[resume.pdf]", "font missing");
  });
});
