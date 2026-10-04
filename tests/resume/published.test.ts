import { beforeEach, describe, expect, it, vi } from "vitest";
import { repoSite } from "@/lib/content/site";

const mocks = vi.hoisted(() => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
  getPublishedContent: vi.fn(),
  renderResumePdf: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ cacheLife: mocks.cacheLife, cacheTag: mocks.cacheTag }));
vi.mock("@/lib/content/read", () => ({ CONTENT_TAG: "content", getPublishedContent: mocks.getPublishedContent }));
vi.mock("@/lib/resume/pdf/document", () => ({ renderResumePdf: mocks.renderResumePdf }));

import { publishedResumePdf } from "@/lib/resume/pdf/published";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.renderResumePdf.mockResolvedValue(Buffer.from("%PDF-"));
});

// The outer "use cache" sets its own cacheLife, which wins over the content
// read's: it has to follow the content's fallback itself.
describe("publishedResumePdf cache lifetime", () => {
  it("caches for days when the content was read from the store", async () => {
    mocks.getPublishedContent.mockResolvedValue({ site: repoSite(), media: [], fallback: false });
    expect(await publishedResumePdf()).toBe(Buffer.from("%PDF-").toString("base64"));
    expect(mocks.cacheTag).toHaveBeenCalledWith("content");
    expect(mocks.cacheLife).toHaveBeenCalledTimes(1);
    expect(mocks.cacheLife).toHaveBeenCalledWith("days");
  });

  it("caches for minutes while the content is the repo fallback", async () => {
    mocks.getPublishedContent.mockResolvedValue({ site: repoSite(), media: [], fallback: true });
    await publishedResumePdf();
    expect(mocks.cacheLife).toHaveBeenCalledTimes(1);
    expect(mocks.cacheLife).toHaveBeenCalledWith("minutes");
  });
});
