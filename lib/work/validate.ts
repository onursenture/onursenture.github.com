import type { Credit, Link, ProductPage } from "@/content/work/types";

// Registry checks. lib/work/index.ts throws on any of them at build time, and
// tests/content/work.test.ts runs them in CI. Returns every problem as a
// readable line instead of throwing at the first one.
// Links: none on PrimeTek pages; https everywhere; a then block only first.

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const COLUMNS: readonly number[] = [1, 2, 3];

export function validateWork(pages: ProductPage[], hasImage: (key: string) => boolean = () => true): string[] {
  const errors: string[] = [];
  const slugs = new Set<string>();

  const credits = (where: string, list: Credit[] = []) => {
    for (const credit of list) {
      if (credit.href && !credit.href.startsWith("https://")) errors.push(`${where}: credit "${credit.href}" must be https`);
    }
  };

  const links = (where: string, list: Link[]) => {
    for (const link of list) {
      if (!link.href.startsWith("https://")) errors.push(`${where}: link "${link.href}" must be https`);
    }
  };

  for (const page of pages) {
    const at = page.slug;
    if (slugs.has(page.slug)) errors.push(`duplicate slug "${page.slug}"`);
    slugs.add(page.slug);
    if (!page.intro.trim()) errors.push(`${at}: intro must not be empty`);
    if (page.blocks.length === 0) errors.push(`${at}: a page needs at least one block`);

    // Every external link on the page: Live links, then sources and text links.
    const pageLinks = [
      ...(page.links ?? []),
      ...page.blocks.flatMap((block) => (block.kind === "then" ? (block.sources ?? []) : block.kind === "text" ? (block.links ?? []) : [])),
    ];
    if (page.org === "primetek" && pageLinks.length > 0) errors.push(`${at}: PrimeTek pages carry no external links`);
    links(at, pageLinks);

    const blockIds = new Set<string>();
    const imageIds = new Set<string>();
    for (const [index, block] of page.blocks.entries()) {
      const where = `${at}/${block.id}`;
      if (!KEBAB.test(block.id)) errors.push(`${where}: block id "${block.id}" is not kebab-case`);
      if (blockIds.has(block.id)) errors.push(`${where}: duplicate block id "${block.id}"`);
      blockIds.add(block.id);

      if (block.kind === "icons" && page.slug !== "primeicons") {
        errors.push(`${where}: an icons block is only allowed on primeicons`);
      }
      if (block.kind === "then") {
        if (index !== 0) errors.push(`${where}: a then block must be the first block`);
        if (!block.year.trim() || block.body.length === 0) errors.push(`${where}: a then block needs a year and a body`);
      }
      if (block.kind !== "images") continue;
      if (block.columns !== undefined && !COLUMNS.includes(block.columns)) {
        errors.push(`${where}: columns ${String(block.columns)} must be 1, 2 or 3`);
      }
      for (const image of block.images) {
        if (!KEBAB.test(image.id)) errors.push(`${where}: image id "${image.id}" is not kebab-case`);
        if (imageIds.has(image.id)) errors.push(`${where}: duplicate image id "${image.id}"`);
        imageIds.add(image.id);
        if (image.image && !hasImage(image.image)) errors.push(`${where}: image "${image.image}" is not in the manifest`);
        credits(`${where}/${image.id}`, image.credits);
      }
    }
  }
  return errors;
}
