import { describe, expect, it } from "vitest";
import type { Block, ProductPage } from "@/content/work/types";
import { validateWork } from "@/lib/work/validate";

function page(overrides: Partial<ProductPage> = {}): ProductPage {
  return {
    slug: "primeone",
    org: "primetek",
    title: "PrimeOne",
    kind: "design system",
    lead: { strong: "PrimeOne.", rest: "A kit." },
    intro: "A kit.",
    facts: [{ label: "Role", value: "Design lead" }],
    blocks: [
      { kind: "text", id: "what-i-did", heading: "What I did", body: ["Designed it."] },
      {
        kind: "images",
        id: "highlights",
        columns: 3,
        images: [{ id: "components", caption: "Components", pin: { order: 1, title: "Components", note: "A kit." } }, { id: "tokens" }],
      },
    ],
    ...overrides,
  };
}

const images = (id: string, ids: string[], extra: Partial<Extract<Block, { kind: "images" }>> = {}): Block => ({
  kind: "images",
  id,
  images: ids.map((imageId) => ({ id: imageId })),
  ...extra,
});

describe("validateWork", () => {
  it("accepts valid content", () => {
    expect(validateWork([page(), page({ slug: "primeicons", blocks: [{ kind: "icons", id: "icon-set" }] })])).toEqual([]);
  });

  it("rejects a duplicate block id within a page", () => {
    const errors = validateWork([page({ blocks: [images("highlights", ["a"]), images("highlights", ["b"])] })]);
    expect(errors).toEqual([expect.stringContaining('duplicate block id "highlights"')]);
  });

  it("rejects a duplicate image id within a page, across blocks", () => {
    const errors = validateWork([page({ blocks: [images("one", ["a"]), images("two", ["a"])] })]);
    expect(errors).toEqual([expect.stringContaining('duplicate image id "a"')]);
  });

  it("allows the same image id on two pages", () => {
    expect(validateWork([page({ blocks: [images("one", ["a"])] }), page({ slug: "primeblocks", blocks: [images("one", ["a"])] })])).toEqual([]);
  });

  it("rejects a duplicate pin order across pages", () => {
    const pinned = (order: number): Block => ({ kind: "images", id: "highlights", images: [{ id: "a", pin: { order, title: "T", note: "N" } }] });
    const errors = validateWork([page({ blocks: [pinned(1)] }), page({ slug: "primeblocks", blocks: [pinned(1)] })]);
    expect(errors).toEqual([expect.stringContaining("duplicate pin order 1")]);
  });

  it("rejects columns other than 1, 2 or 3", () => {
    const errors = validateWork([page({ blocks: [images("highlights", ["a"], { columns: 4 as 3 })] })]);
    expect(errors).toEqual([expect.stringContaining("columns 4 must be 1, 2 or 3")]);
  });

  it("rejects an icons block on any page but PrimeIcons", () => {
    const errors = validateWork([page({ blocks: [{ kind: "icons", id: "icon-set" }] })]);
    expect(errors).toEqual([expect.stringContaining("an icons block is only allowed on primeicons")]);
  });

  it("rejects an empty intro", () => {
    expect(validateWork([page({ intro: "  " })])).toEqual([expect.stringContaining("intro must not be empty")]);
  });

  it("rejects a page without blocks", () => {
    expect(validateWork([page({ blocks: [] })])).toEqual([expect.stringContaining("needs at least one block")]);
  });

  it("rejects ids that are not kebab-case", () => {
    const errors = validateWork([page({ blocks: [images("Highlights", ["Tokens"])] })]);
    expect(errors).toEqual([expect.stringContaining('block id "Highlights"'), expect.stringContaining('image id "Tokens"')]);
  });

  it("rejects an explicit image key the manifest doesn't have", () => {
    const errors = validateWork([page({ blocks: [{ kind: "images", id: "highlights", images: [{ id: "a", image: "work/x/y" }] }] })], () => false);
    expect(errors).toEqual([expect.stringContaining('image "work/x/y" is not in the manifest')]);
  });
});
