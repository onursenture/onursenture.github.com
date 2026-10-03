import { describe, expect, it } from "vitest";
import { figmaDesignUrl, figmaEmbedUrl, normalizeNodeId } from "@/lib/work/figma";

describe("Figma URLs", () => {
  it("normalises a URL node-id to the API form", () => {
    expect(normalizeNodeId("12-345")).toBe("12:345");
    expect(normalizeNodeId(" 12:345 ")).toBe("12:345");
  });

  it("builds the design and embed URLs with the dashed node-id", () => {
    const ref = { fileKey: "AbC123", nodeId: "12:345" };
    expect(figmaDesignUrl(ref)).toBe("https://www.figma.com/design/AbC123?node-id=12-345");
    expect(figmaEmbedUrl(ref)).toBe("https://embed.figma.com/design/AbC123?node-id=12-345&embed-host=onursenture");
  });
});
