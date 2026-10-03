import type { Metadata } from "next";
import { PhotoGrid } from "@/components/photos/photo-grid";
import { PageHeader } from "@/components/shell/page-header";
import { getPhotos } from "@/lib/content/photos";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata("Photos");

export default async function PhotosPage() {
  const photos = await getPhotos();
  return (
    <main className="flex flex-col gap-12 pb-24">
      <PageHeader title="Photos" />
      <PhotoGrid photos={photos} />
    </main>
  );
}
