import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MediaViewer } from "@/components/work/media-viewer";
import type { MediaView } from "@/lib/work/derive";

const base: MediaView = {
  id: "a",
  label: "FIG. 02.1",
  caption: "Tokens",
  aspect: "16/10",
  tags: [],
  credits: [],
  image: null,
  figma: null,
  entryId: "3-0",
  group: "3.0",
  context: "3.0 · Nov 2024",
};
const items: MediaView[] = [
  base,
  { ...base, id: "b", label: "FIG. 02.2", caption: "Button", credits: [{ name: "Ada" }], figma: { fileKey: "K", nodeId: "1:2", embed: true } },
];
const noop = () => {};
const html = (current: string | null) =>
  renderToStaticMarkup(<MediaViewer title="PrimeOne" items={items} current={current} onSelect={noop} onClose={noop} />);

describe("MediaViewer", () => {
  it("renders an empty dialog while closed", () => {
    const markup = html(null);
    expect(markup).toContain("<dialog");
    expect(markup).not.toContain("FIG. 02.1");
  });

  it("shows the context, caption, position and the thumbnail strip", () => {
    const markup = html("a");
    expect(markup).toContain('aria-label="PrimeOne, FIG. 02.1"');
    expect(markup).toContain("3.0 · Nov 2024");
    expect(markup).toContain("FIG. 02.1</span> · Tokens");
    expect(markup).toContain("01 / 02");
    expect(markup).toContain('aria-label="Show FIG. 02.2"');
    expect(markup).not.toContain("Open in Figma");
  });

  it("links to Figma and offers the embed only from md (it's hidden on phones)", () => {
    const markup = html("b");
    expect(markup).toContain('href="https://www.figma.com/design/K?node-id=1-2"');
    expect(markup).toContain("Open in Figma");
    expect(markup).toMatch(/class="hidden[^"]*md:inline[^"]*"[^>]*>Load Figma file/);
    expect(markup).toContain("Design: ");
    expect(markup).not.toContain("<iframe");
  });
});
