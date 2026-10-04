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

  it("lists the PrimeTek product pages first, in order", () => {
    expect(getProductSlugs().slice(0, 6)).toEqual(["primeone", "primeblocks", "primeicons", "templates", "primestore", "theme-designer"]);
    for (const page of productPages.slice(0, 6)) expect(page.org).toBe("primetek");
  });

  it("states Role, Years and At on every PrimeTek page, with Onur's role", () => {
    for (const page of productPages.filter((p) => p.org === "primetek")) {
      expect(page.facts.map((fact) => fact.label), page.slug).toEqual(["Role", "Years", "At"]);
      expect(page.facts[0].value).toBe("Design lead");
      expect(page.facts[2].value).toBe("PrimeTek");
    }
  });

  it("gives every page What I did as its first block after Then, and a three-column highlights block", () => {
    for (const page of productPages) {
      const [first] = page.blocks.filter((block) => block.kind !== "then");
      expect(first, page.slug).toMatchObject({ kind: "text", id: "what-i-did", heading: "What I did" });
      expect(page.blocks.find((block) => block.id === "highlights"), page.slug).toMatchObject({ kind: "images", columns: 3 });
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
    expect(genesis.credits).toEqual([{ name: "Ümit Çelik", href: "https://x.com/umitceliks" }]);
  });

  it("pins the curated Selected work, each the first highlight of its page", () => {
    const pins = getPins();
    expect(pins.map((pin) => [pin.pin.order, pin.slug, pin.blockId])).toEqual([
      [1, "primeone", "highlights"],
      [2, "primeblocks", "highlights"],
      [3, "templates", "highlights"],
      [4, "primestore", "highlights"],
    ]);
    for (const pin of pins) {
      const page = productPages.find((p) => p.slug === pin.slug)!;
      const highlights = page.blocks.find((block) => block.id === "highlights");
      expect(highlights?.kind === "images" && highlights.images[0].id).toBe(pin.image.id);
      expect(pin.pin.title.split(" ").length).toBeLessThanOrEqual(4);
    }
  });

  it("never states an unconfirmed headline number", () => {
    const text = JSON.stringify(productPages);
    for (const claim of ["80+", "500 blocks", "25+", "80 components", "500,000", "#7", "100k", "1 million"]) expect(text).not.toContain(claim);
  });

  it("keeps PrimeTek pages free of URLs except credit provenance", () => {
    for (const page of productPages.filter((p) => p.org === "primetek")) {
      const withoutCredits = JSON.stringify(page, (key, value) => (key === "credits" ? undefined : value));
      expect(withoutCredits, page.slug).not.toMatch(/https?:\/\//);
      for (const image of pageImages(page)) {
        for (const credit of image.credits ?? []) if (credit.href) expect(credit.href).toMatch(/^https:\/\//);
      }
    }
  });

  it("tells Theme Designer's pivot from PrimeDesigner", () => {
    const page = getProductPage("theme-designer")!;
    expect(page.blocks.map((block) => block.id)).toEqual(["what-i-did", "pivot", "highlights"]);
    expect(JSON.stringify(page)).toContain("PrimeDesigner");
    expect(page.facts.find((fact) => fact.label === "Years")?.value).toBe("2023–2025");
  });
});
