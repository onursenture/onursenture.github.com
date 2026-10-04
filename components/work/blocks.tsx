import { Fragment, type ReactNode } from "react";
import { DitherRule } from "@/components/ui/dither";
import { SectionRow } from "@/components/ui/section-row";
import type { Block } from "@/content/work/types";
import { cx } from "@/lib/cx";
import type { BlockView, ImageView, ProductPageView } from "@/lib/work/derive";
import type { IconSet } from "@/lib/work/icons";
import { CreditLine } from "./credit-line";
import { IconGrid } from "./icon-grid";
import { LinkLine } from "./link-line";
import { MediaButton } from "./media-button";

type Columns = 1 | 2 | 3;
type TextBlockView = Extract<Block, { kind: "text" }>;
type ImagesBlockView = Extract<BlockView, { kind: "images" }>;
type IconsBlockView = Extract<Block, { kind: "icons" }>;
type ThenBlockView = Extract<Block, { kind: "then" }>;

// An images grid's columns from md: 1 is one image per row, 2 is two, 3 is two
// from md and three from lg. Always one below md.
const COLUMNS: Record<Columns, string> = {
  1: "",
  2: "md:grid-cols-2",
  3: "md:grid-cols-2 lg:grid-cols-3",
};

// `sizes` for an image in a wide row's grid (16px gaps). From lg the wide
// content starts after the padding (40), the label column (200) and a gap (28)
// and runs to the right padding (40): 100vw - 308px. Below lg it spans the
// page: 100vw - 80px from md, 100vw - 32px on phones.
export function imageGridSizes(columns: Columns): string {
  const lg =
    columns === 1 ? "calc(100vw - 308px)" : columns === 2 ? "calc((100vw - 308px - 16px) / 2)" : "calc((100vw - 308px - 32px) / 3)";
  const md = columns === 1 ? "calc(100vw - 80px)" : "calc((100vw - 80px - 16px) / 2)";
  return `(min-width: 1024px) ${lg}, (min-width: 768px) ${md}, calc(100vw - 32px)`;
}

// A text block: the heading in the label column, the body in the 480px column,
// and its links (Orkestra pages only) in a muted line under the body.
export function TextBlock({ block }: { block: TextBlockView }) {
  return (
    <SectionRow id={block.id} label={block.heading}>
      <div className="flex flex-col gap-2.5">
        {block.body.map((paragraph, index) => (
          <p key={index} className="type-body text-fg-soft">
            {paragraph}
          </p>
        ))}
        {block.links?.length ? (
          <p className="type-meta text-fg-muted">
            <LinkLine links={block.links} />
          </p>
        ) : null}
      </div>
    </SectionRow>
  );
}

// The project in its moment: "Then" and the year (Doto, accent) as the label
// column's heading, the sourced sentences in the 480px column, then the
// sources. validateWork keeps it the first block.
export function ThenBlock({ block }: { block: ThenBlockView }) {
  return (
    <SectionRow
      id={block.id}
      label={
        <>
          <span className="block text-fg-muted">Then</span> <span className="mt-1.5 block type-name text-accent">{block.year}</span>
        </>
      }
    >
      <div className="flex flex-col gap-2.5">
        {block.body.map((paragraph, index) => (
          <p key={index} className="type-body text-fg-soft">
            {paragraph}
          </p>
        ))}
        {block.sources?.length ? (
          <p className="type-meta text-fg-muted">
            Sources: <LinkLine links={block.sources} />
          </p>
        ) : null}
      </div>
    </SectionRow>
  );
}

function Figure({ image, sizes }: { image: ImageView; sizes: string }) {
  return (
    <figure>
      <MediaButton media={image} sizes={sizes} />
      {image.caption || image.credits.length > 0 ? (
        <figcaption className="mt-1.5 flex flex-wrap gap-x-3 type-meta">
          {image.caption ? <span>{image.caption}</span> : null}
          <CreditLine credits={image.credits} />
        </figcaption>
      ) : null}
    </figure>
  );
}

// An images block: the heading (if any) in the label column, the grid across
// the wide content. Its id is the anchor Selected work links to. Each image is
// a 16:10 button that opens the viewer at it.
export function ImagesBlock({ block }: { block: ImagesBlockView }) {
  const columns = block.columns ?? 1;
  const sizes = imageGridSizes(columns);
  return (
    <SectionRow id={block.id} label={block.heading ?? null} labelAs={block.heading ? "h2" : "div"} wide>
      <ul data-columns={columns} className={cx("grid gap-4", COLUMNS[columns])}>
        {block.images.map((image) => (
          <li key={image.id} className="min-w-0">
            <Figure image={image} sizes={sizes} />
          </li>
        ))}
      </ul>
    </SectionRow>
  );
}

// The live PrimeIcons set (search, copy, licence line) in a wide row. Server
// rendered, so the icons and the licence line are in the static HTML.
export function IconsBlock({ block, icons }: { block: IconsBlockView; icons: IconSet }) {
  return (
    <SectionRow id={block.id} label={block.heading ?? null} labelAs={block.heading ? "h2" : "div"} wide>
      <IconGrid set={icons} />
    </SectionRow>
  );
}

function renderBlock(block: BlockView, icons: IconSet | undefined): ReactNode {
  switch (block.kind) {
    case "text":
      return <TextBlock block={block} />;
    case "images":
      return <ImagesBlock block={block} />;
    case "icons":
      // Only PrimeIcons has the set (validateWork keeps the block there).
      return icons ? <IconsBlock block={block} icons={icons} /> : null;
    case "then":
      return <ThenBlock block={block} />;
  }
}

// Every block of a page in order, each after a dither rule (the header row
// comes first).
export function ProductBlocks({ page, icons }: { page: ProductPageView; icons?: IconSet }) {
  return page.blocks.map((block) => {
    const row = renderBlock(block, icons);
    return row ? (
      <Fragment key={block.id}>
        <DitherRule className="mx-4 md:mx-10" />
        {row}
      </Fragment>
    ) : null;
  });
}
