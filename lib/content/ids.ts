import type { ProductPage } from "@/content/work/types";
import { KEBAB } from "./keys";

// Block and image ids (spec §1.6): generated from the heading or caption,
// editable until published, permanent after.

const FOLD: Record<string, string> = { ı: "i", İ: "i", ş: "s", Ş: "s", ğ: "g", Ğ: "g", ü: "u", Ü: "u", ö: "o", Ö: "o", ç: "c", Ç: "c" };

export function kebab(text: string): string {
  return text
    .replace(/[ıİşŞğĞüÜöÖçÇ]/g, (letter) => FOLD[letter])
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
}

export function uniqueId(base: string, taken: Iterable<string>, fallback: string): string {
  const used = new Set(taken);
  const root = KEBAB.test(base) ? base : fallback;
  if (!used.has(root)) return root;
  for (let n = 2; ; n++) if (!used.has(`${root}-${n}`)) return `${root}-${n}`;
}

// Ids already live: the published page's, else the repo page's. null (a page
// that was never published) locks nothing.
export function lockedIds(page: ProductPage | null): { blocks: string[]; images: string[] } {
  if (!page) return { blocks: [], images: [] };
  return {
    blocks: page.blocks.map((block) => block.id),
    images: page.blocks.flatMap((block) => (block.kind === "images" ? block.images.map((image) => image.id) : [])),
  };
}

// After a heading or caption edit: an unlocked id that still follows the old
// text (or is the fallback, possibly numbered) follows the new text. An id the
// author typed by hand stays.
export function followId(current: string, oldText: string, newText: string, taken: Iterable<string>, fallback: string, locked: boolean): string {
  if (locked) return current;
  const old = kebab(oldText);
  const automatic = new RegExp(`^(${old ? `${old}|` : ""}${fallback})(-\\d+)?$`).test(current);
  if (!automatic) return current;
  return uniqueId(kebab(newText), [...taken].filter((id) => id !== current), fallback);
}
