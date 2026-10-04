import { describe, expect, it } from "vitest";
import { labIndex } from "@/content/lab-index";
import { pinOrder } from "@/content/pins";
import { productPages } from "@/content/work";
import { draftValues, indexSlugs, publishedValues, repoSite, repoValue, resolvePage, resolveSite } from "@/lib/content/site";

const nebuu = productPages.find((p) => p.slug === "nebuu")!;

describe("repoSite", () => {
  it("is the repo content", () => {
    const site = repoSite();
    expect(site.pages).toBe(productPages);
    expect(site.pins).toBe(pinOrder);
    expect(site.lab).toBe(labIndex);
  });
});

describe("document values", () => {
  const docs = [
    { key: "lab", draft: [{ title: "Draft", description: "D" }], published: [{ title: "Live", description: "L" }] },
    { key: "work/new-page", draft: { ...nebuu, slug: "new-page" }, published: null },
    { key: "pins", draft: null, published: { order: [] } },
  ];

  it("publishedValues keeps only published values", () => {
    const values = publishedValues(docs);
    expect([...values.keys()]).toEqual(["lab", "pins"]);
    expect(values.get("lab")).toEqual([{ title: "Live", description: "L" }]);
  });

  it("draftValues prefers the draft", () => {
    const values = draftValues(docs);
    expect(values.get("lab")).toEqual([{ title: "Draft", description: "D" }]);
    expect(values.get("pins")).toEqual({ order: [] });
    expect(values.has("work/new-page")).toBe(true);
  });
});

describe("resolveSite", () => {
  it("falls back to the repo for every missing document", () => {
    expect(resolveSite(new Map())).toEqual(repoSite());
  });

  it("uses a published page, the index order and singletons", () => {
    const edited = { ...nebuu, intro: "Edited intro." };
    const values = new Map<string, unknown>([
      ["work/nebuu", edited],
      ["work-index", { slugs: ["nebuu", "primeone"] }],
      ["lab", [{ title: "Only", description: "One" }]],
    ]);
    const site = resolveSite(values);
    expect(site.pages.map((p) => p.slug)).toEqual(["nebuu", "primeone"]);
    expect(site.pages[0].intro).toBe("Edited intro.");
    expect(site.lab).toEqual([{ title: "Only", description: "One" }]);
    expect(site.pins).toBe(pinOrder);
  });

  it("skips an indexed slug with no document and no repo page", () => {
    expect(resolveSite(new Map([["work-index", { slugs: ["nebuu", "ghost"] }]])).pages.map((p) => p.slug)).toEqual(["nebuu"]);
  });

  it("ignores a value that doesn't match its schema", () => {
    expect(resolveSite(new Map([["lab", [{ title: "" }]]])).lab).toBe(labIndex);
  });

  it("resolves a rough draft loosely (the preview) and falls back strictly", () => {
    const rough = {
      ...nebuu,
      slug: "rough",
      title: "",
      facts: [{ label: "Years", value: "" }],
      blocks: [{ kind: "images", id: "images", images: [{ id: "a", pin: { title: "A", note: "" } }] }],
    };
    const values = new Map<string, unknown>([["work/rough", rough]]);
    expect(resolvePage(values, "rough")).toBeNull();
    expect(resolvePage(values, "rough", { loose: true })?.slug).toBe("rough");
    const nebuuRough = new Map<string, unknown>([["work/nebuu", { ...nebuu, title: "" }]]);
    expect(resolvePage(nebuuRough, "nebuu")?.title).toBe(nebuu.title);
    expect(resolvePage(nebuuRough, "nebuu", { loose: true })?.title).toBe("");
    const lab = new Map<string, unknown>([["lab", [{ title: "", description: "" }]]]);
    expect(resolveSite(lab).lab).toBe(labIndex);
    expect(resolveSite(lab, { loose: true }).lab).toEqual([{ title: "", description: "" }]);
  });

  it("resolves one page and the index slugs", () => {
    const values = new Map<string, unknown>([["work/new-page", { ...nebuu, slug: "new-page" }]]);
    expect(resolvePage(values, "new-page")?.slug).toBe("new-page");
    expect(resolvePage(values, "primeone")?.slug).toBe("primeone");
    expect(resolvePage(values, "ghost")).toBeNull();
    expect(indexSlugs(values)).toEqual(productPages.map((p) => p.slug));
  });
});

describe("repoValue", () => {
  it("returns each document's repo value", () => {
    expect(repoValue("work/nebuu")).toBe(nebuu);
    expect(repoValue("work/ghost")).toBeNull();
    expect(repoValue("pins")).toEqual({ order: pinOrder });
    expect(repoValue("work-index")).toEqual({ slugs: productPages.map((p) => p.slug) });
    expect(repoValue("lab")).toBe(labIndex);
  });
});
