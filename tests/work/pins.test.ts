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
    { kind: "images", id: "first", images: [{ id: "a" }, { id: "b", pin: { order: 3, title: "B", note: "Second pin of one" } }] },
    { kind: "text", id: "what-i-did", heading: "What I did", body: ["Text."] },
    { kind: "images", id: "second", heading: "More", columns: 2, images: [{ id: "c" }, { id: "d", pin: { order: 1, title: "D", note: "First pin" } }] },
  ],
};
const icons: ProductPage = {
  ...one,
  slug: "primeicons",
  title: "PrimeIcons",
  blocks: [
    { kind: "images", id: "highlights", images: [{ id: "sheet", caption: "Sheet", pin: { order: 2, title: "Sheet", note: "Icons" } }] },
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
  const pins = buildPins([one, icons], lookup);

  it("orders pins by their order, across pages", () => {
    expect(pins.map((pin) => pin.pin.order)).toEqual([1, 2, 3]);
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
});
