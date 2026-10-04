"use client";

import type { Block, ProductPage } from "@/content/work/types";
import { AddButton } from "../fields";

// "+ Add block": text, images, then (only while the page has none; it goes
// first) and icons (PrimeIcons only, at most one).
export function AddBlock({ page, onAdd }: { page: ProductPage; onAdd: (kind: Block["kind"]) => void }) {
  const hasThen = page.blocks.some((block) => block.kind === "then");
  const hasIcons = page.blocks.some((block) => block.kind === "icons");
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      <AddButton onClick={() => onAdd("text")}>Text</AddButton>
      <AddButton onClick={() => onAdd("images")}>Images</AddButton>
      {hasThen ? null : <AddButton onClick={() => onAdd("then")}>Then</AddButton>}
      {page.slug === "primeicons" && !hasIcons ? <AddButton onClick={() => onAdd("icons")}>Icon set</AddButton> : null}
    </div>
  );
}
