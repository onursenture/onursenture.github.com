import { describe, expect, it } from "vitest";
import type { ProductPage } from "@/content/work/types";
import { buildPins, buildProductPage, pageImages } from "@/lib/work/derive";

const one: ProductPage = {
  slug: "primeone",
  org: "primetek",
  title: "PrimeOne",
  kind: "design system",
  lead: { strong: "PrimeOne.", rest: "A kit." },
  intro: "A kit.",
  facts: [],
  blocks: [
    { kind: "images", id: "first", images: [{ id: "a" }, { id: "b", pin: { title: "B", note: "Second pin of one" } }] },
    { kind: "text", id: "what-i-did", heading: "What I did", body: ["Text."] },
    { kind: "images", id: "second", heading: "More", columns: 2, images: [{ id: "c" }, { id: "d", pin: { title: "D", note: "First pin" } }] },
  ],
};
const icons: ProductPage = {
  ...one,
  slug: "primeicons",
  title: "PrimeIcons",
  blocks: [
    { kind: "images", id: "highlights", images: [{ id: "sheet", caption: "Sheet", pin: { title: "Sheet", note: "Icons" } }] },
    { kind: "icons", id: "icon-set" },
  ],
};
const lookup = (key: string) => (key === "work/primeone/d" ? { width: 2560, height: 1600, widths: [640, 1280, 2560] } : undefined);

describe("pageImages", () => {
  it("lists every image in block order", () => {
    expect(pageImages(one).map((image) => image.id)).toEqual(["a", "b", "c", "d"]);
    expect(pageImages(icons).map((image) => image.id)).toEqual(["sheet"]);
  });
});

describe("buildProductPage", () => {
  it("numbers figures from 1 in block order and resolves each image", () => {
    const view = buildProductPage(one, lookup);
    expect(view.images.map((image) => [image.id, image.fig, image.label])).toEqual([
      ["a", 1, "FIG. 01"],
      ["b", 2, "FIG. 02"],
      ["c", 3, "FIG. 03"],
      ["d", 4, "FIG. 04"],
    ]);
    expect(view.images[0].image).toBeNull();
    expect(view.images[3].image).toEqual({ key: "work/primeone/d", width: 2560, height: 1600, widths: [640, 1280, 2560] });
    const second = view.blocks[2];
    expect(second.kind === "images" && second.images.map((image) => image.fig)).toEqual([3, 4]);
  });
});

describe("buildPins", () => {
  const order = [
    { slug: "primeone", imageId: "d" },
    { slug: "primeicons", imageId: "sheet" },
    { slug: "primeone", imageId: "b" },
  ];
  const pins = buildPins([one, icons], order, lookup);

  it("follows the order list across pages and numbers from 1", () => {
    expect(pins.map((pin) => pin.order)).toEqual([1, 2, 3]);
    expect(pins.map((pin) => pin.image.id)).toEqual(["d", "sheet", "b"]);
  });

  it("carries the page slug, title and the block id each pin links to", () => {
    expect(pins.map((pin) => [pin.slug, pin.pageTitle, pin.blockId])).toEqual([
      ["primeone", "PrimeOne", "second"],
      ["primeicons", "PrimeIcons", "highlights"],
      ["primeone", "PrimeOne", "first"],
    ]);
  });

  it("resolves the pinned image and keeps its FIG number on its page", () => {
    expect(pins[0].image.image?.key).toBe("work/primeone/d");
    expect(pins[0].image.fig).toBe(4);
    expect(pins[1].image.image).toBeNull();
  });

  it("appends pinned images the list misses, in page order", () => {
    expect(buildPins([one, icons], [{ slug: "primeicons", imageId: "sheet" }], lookup).map((pin) => pin.image.id)).toEqual(["sheet", "b", "d"]);
  });

  it("skips refs to missing or unpinned images and counts a duplicate once", () => {
    const stale = [
      { slug: "primeone", imageId: "a" },
      { slug: "gone", imageId: "x" },
      { slug: "primeone", imageId: "d" },
      { slug: "primeone", imageId: "d" },
    ];
    expect(buildPins([one, icons], stale, lookup).map((pin) => [pin.order, pin.image.id])).toEqual([
      [1, "d"],
      [2, "b"],
      [3, "sheet"],
    ]);
  });
});
