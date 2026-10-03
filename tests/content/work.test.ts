import { describe, expect, it } from "vitest";
import { productPages } from "@/content/work";
import { hasImage } from "@/lib/images/manifest";
import { getPins, getProductPage, getProductSlugs } from "@/lib/work";
import { pageImages } from "@/lib/work/derive";
import { validateWork } from "@/lib/work/validate";

describe("content/work", () => {
  it("passes every registry check", () => {
    expect(validateWork(productPages, hasImage)).toEqual([]);
  });

  it("lists the four PrimeTek product pages in order", () => {
    expect(getProductSlugs()).toEqual(["primeone", "primeblocks", "primeicons", "templates"]);
    for (const page of productPages) expect(page.org).toBe("primetek");
  });

  it("states Role, Years and At on every page, with Onur's role", () => {
    for (const page of productPages) {
      expect(page.facts.map((fact) => fact.label), page.slug).toEqual(["Role", "Years", "At"]);
      expect(page.facts[0].value).toBe("Design lead");
      expect(page.facts[2].value).toBe("PrimeTek");
    }
  });

  it("gives every page a What I did text block, then a three-column highlights block", () => {
    for (const page of productPages) {
      const [text, images] = page.blocks;
      expect(text, page.slug).toMatchObject({ kind: "text", id: "what-i-did", heading: "What I did" });
      expect(images, page.slug).toMatchObject({ kind: "images", id: "highlights", columns: 3 });
    }
  });

  it("adds the icon set after the images block on PrimeIcons only", () => {
    const icons = getProductPage("primeicons")!;
    expect(icons.blocks.map((block) => block.kind)).toEqual(["text", "images", "icons"]);
    for (const page of productPages.filter((p) => p.slug !== "primeicons")) {
      expect(page.blocks.some((block) => block.kind === "icons"), page.slug).toBe(false);
    }
  });

  it("shows the six named templates and credits Genesis to its designer only", () => {
    const templates = productPages.find((p) => p.slug === "templates")!;
    expect(pageImages(templates).map((image) => image.caption)).toEqual(["Apollo", "Diamond", "Ultima", "Verona", "Atlantis", "Genesis"]);
    const genesis = pageImages(templates).find((image) => image.id === "genesis")!;
    expect(genesis.credits).toEqual([{ name: "Ümit Çelik" }]);
  });

  it("pins the first highlight of each page, in registry order", () => {
    const pins = getPins();
    expect(pins.map((pin) => [pin.pin.order, pin.slug, pin.blockId])).toEqual([
      [1, "primeone", "highlights"],
      [2, "primeblocks", "highlights"],
      [3, "primeicons", "highlights"],
      [4, "templates", "highlights"],
    ]);
    for (const pin of pins) {
      const first = pageImages(productPages.find((p) => p.slug === pin.slug)!)[0];
      expect(pin.image.id).toBe(first.id);
      expect(pin.pin.title.split(" ").length).toBeLessThanOrEqual(4);
    }
  });

  it("never states an unconfirmed headline number", () => {
    const text = JSON.stringify(productPages);
    for (const claim of ["80+", "500 blocks", "25+", "80 components"]) expect(text).not.toContain(claim);
  });

  it("sets no external link anywhere in the content", () => {
    expect(JSON.stringify(productPages)).not.toMatch(/https?:\/\//);
  });
});
