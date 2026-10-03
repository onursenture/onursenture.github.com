import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MediaViewer } from "@/components/work/media-viewer";
import type { ImageView } from "@/lib/work/derive";

const base: ImageView = {
  id: "a",
  caption: "Tokens",
  credits: [],
  image: null,
  fig: 1,
  label: "FIG. 01",
  context: "Highlights",
};
const items: ImageView[] = [base, { ...base, id: "b", fig: 2, label: "FIG. 02", caption: "Button", credits: [{ name: "Ada" }] }];
const noop = () => {};
const html = (current: string | null) =>
  renderToStaticMarkup(<MediaViewer title="PrimeOne" items={items} current={current} onSelect={noop} onClose={noop} />);

describe("MediaViewer", () => {
  it("renders an empty dialog in the Life palette while closed", () => {
    const markup = html(null);
    expect(markup).toContain("<dialog");
    expect(markup).toContain('data-side="life"');
    expect(markup).not.toContain("FIG. 01");
  });

  it("shows the block, caption, position and the thumbnail strip", () => {
    const markup = html("a");
    expect(markup).toContain('aria-label="PrimeOne, FIG. 01"');
    expect(markup).toContain("PrimeOne</span> · Highlights");
    expect(markup).toContain("FIG. 01</span> · Tokens");
    expect(markup).toContain("01 / 02");
    expect(markup).toContain('aria-label="Show FIG. 02"');
    expect(markup).toContain('aria-label="All figures"');
    expect(markup).toContain('aria-label="Close viewer"');
  });

  it("credits the designer, and has no Figma link or embed", () => {
    const markup = html("b");
    expect(markup).toContain("Design: ");
    expect(markup).not.toMatch(/figma/i);
    expect(markup).not.toContain("<iframe");
    expect(markup).not.toContain("href=");
  });
});
