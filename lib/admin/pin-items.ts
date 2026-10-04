import type { ImageEntry } from "@/lib/images/plan";
import type { PinView } from "@/lib/work/derive";

// One row of the Selected work order list.
export interface PinItem {
  slug: string;
  imageId: string;
  title: string;
  pageTitle: string;
  imageKey: string;
  entry: ImageEntry | null;
}

export function pinItems(views: PinView[]): PinItem[] {
  return views.map((view) => ({
    slug: view.slug,
    imageId: view.image.id,
    title: view.pin.title,
    pageTitle: view.pageTitle,
    imageKey: view.image.image?.key ?? `work/${view.slug}/${view.image.id}`,
    entry: view.image.image ? { width: view.image.image.width, height: view.image.image.height, widths: view.image.image.widths, ...(view.image.image.baseUrl ? { baseUrl: view.image.image.baseUrl } : {}) } : null,
  }));
}
