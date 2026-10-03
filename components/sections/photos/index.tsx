import { PHOTO_GRID_COMPACT_SIZES, PhotoGrid } from "@/components/photos/photo-grid";
import { type Photo, getPhotos } from "@/lib/content/photos";
import { Empty } from "../empty";
import type { SectionDefinition } from "../types";

function Render({ data }: { data: Photo[] }) {
  if (data.length === 0) return <Empty />;
  return <PhotoGrid photos={data} sizes={PHOTO_GRID_COMPACT_SIZES} density="compact" />;
}

// Photos are authored content, not a synced source.
export const photos: SectionDefinition<Photo[]> = {
  id: "photos",
  title: "Photos",
  load: async () => ({ data: await getPhotos(), lastSuccessAt: null }),
  Render,
  href: "/life/photos/",
};
