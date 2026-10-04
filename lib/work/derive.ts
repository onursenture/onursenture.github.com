import type { PinRef } from "@/content/pins";
import type { Block, Credit, Pin, ProductPage, WorkImage, WorkSlug } from "@/content/work/types";
import type { ImageEntry } from "@/lib/images/plan";

// Pure builders from content (content/work/) to the serialisable views the
// work pages and the home's Selected work render. No manifest import: the
// caller passes `lookup`, so client code can import these types and helpers.

export type ImageLookup = (key: string) => ImageEntry | undefined;

export interface ResolvedImage extends ImageEntry {
  key: string;
}

// A WorkImage with its image resolved (a manifest entry, or null for the
// placeholder) and its 1-based FIG number on its page, in block order.
export interface ImageView extends Omit<WorkImage, "image" | "credits"> {
  credits: Credit[];
  image: ResolvedImage | null;
  fig: number;
  // "FIG. 01"
  label: string;
  // The heading of the block it sits in, for the viewer's top line ("" without one).
  context: string;
}

export type BlockView =
  | Extract<Block, { kind: "text" }>
  | (Omit<Extract<Block, { kind: "images" }>, "images"> & { images: ImageView[] })
  | Extract<Block, { kind: "icons" }>
  | Extract<Block, { kind: "then" }>;

export interface ProductPageView extends Omit<ProductPage, "blocks"> {
  blocks: BlockView[];
  // Every image on the page in block order: the viewer's items for ?fig=.
  images: ImageView[];
}

export interface PinView {
  slug: WorkSlug;
  pageTitle: string;
  // The images block the pin sits in: Selected work links to /work/<slug>/#<blockId>.
  blockId: string;
  image: ImageView;
  pin: Pin;
  // 1-based position on the home.
  order: number;
}

export interface CreditGroup {
  role: string;
  people: Credit[];
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// The manifest key an image uses when it has no explicit `image`:
// images-src/work/<slug>/<id>.(png|jpg).
export function imageKey(slug: string, imageId: string): string {
  return `work/${slug}/${imageId}`;
}

export function resolveImage(slug: string, image: WorkImage, lookup: ImageLookup): ResolvedImage | null {
  const key = image.image ?? imageKey(slug, image.id);
  const entry = lookup(key);
  return entry ? { key, width: entry.width, height: entry.height, widths: entry.widths, ...(entry.baseUrl ? { baseUrl: entry.baseUrl } : {}) } : null;
}

// Every image on a page, in block order.
export function pageImages(page: ProductPage): WorkImage[] {
  return page.blocks.flatMap((block) => (block.kind === "images" ? block.images : []));
}

export function buildProductPage(page: ProductPage, lookup: ImageLookup): ProductPageView {
  // FIG numbers and the viewer's order both come from pageImages (block
  // order); image ids are unique within a page (validateWork).
  const ordered = pageImages(page);
  const fig = new Map(ordered.map((image, index) => [image.id, index + 1]));
  const views = new Map<string, ImageView>();
  const blocks = page.blocks.map((block): BlockView => {
    if (block.kind !== "images") return block;
    const images = block.images.map((image): ImageView => {
      const n = fig.get(image.id)!;
      const view: ImageView = {
        id: image.id,
        caption: image.caption,
        pin: image.pin,
        credits: image.credits ?? [],
        image: resolveImage(page.slug, image, lookup),
        fig: n,
        label: `FIG. ${pad2(n)}`,
        context: block.heading ?? "",
      };
      views.set(image.id, view);
      return view;
    });
    return { ...block, images };
  });
  return { ...page, blocks, images: ordered.map((image) => views.get(image.id)!) };
}

// Every pinned image across pages, in `order` (the pins document). Pinned
// images it doesn't list follow in page order; refs to images that are gone or
// no longer pinned are skipped, and a ref listed twice counts once.
export function buildPins(pages: ProductPage[], order: PinRef[], lookup: ImageLookup): PinView[] {
  const found = new Map<string, Omit<PinView, "order">>();
  for (const page of pages) {
    const view = buildProductPage(page, lookup);
    for (const block of view.blocks) {
      if (block.kind !== "images") continue;
      for (const image of block.images) {
        if (image.pin) found.set(`${page.slug}/${image.id}`, { slug: page.slug, pageTitle: page.title, blockId: block.id, image, pin: image.pin });
      }
    }
  }
  const keys = [...new Set(order.map((ref) => `${ref.slug}/${ref.imageId}`))].filter((key) => found.has(key));
  for (const key of found.keys()) if (!keys.includes(key)) keys.push(key);
  return keys.map((key, index) => ({ ...found.get(key)!, order: index + 1 }));
}

// Credits by role, in first-seen order; a missing role means design.
export function groupCredits(credits: Credit[]): CreditGroup[] {
  const groups: CreditGroup[] = [];
  for (const credit of credits) {
    const role = credit.role ? capitalise(credit.role) : "Design";
    const group = groups.find((g) => g.role === role);
    if (group) group.people.push(credit);
    else groups.push({ role, people: [credit] });
  }
  return groups;
}
