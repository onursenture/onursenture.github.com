import type { Metadata } from "next";
import { PhotoGrid } from "@/components/photos/photo-grid";
import { PageHeader } from "@/components/shell/page-header";
import { EAGER_TILES } from "@/components/ui/cover";
import { DESCRIPTIONS } from "@/content/descriptions";
import { getPhotos } from "@/lib/content/photos";
import { describedMetadata } from "@/lib/metadata";

export const metadata: Metadata = describedMetadata("Photos", DESCRIPTIONS.photos);

export default async function PhotosPage() {
  const photos = await getPhotos();
  return (
    <main className="flex flex-col gap-10 pb-16">
      <PageHeader title="Photos" />
      <div className="px-4 md:px-10">
        <PhotoGrid photos={photos} eager={EAGER_TILES} />
      </div>
    </main>
  );
}
