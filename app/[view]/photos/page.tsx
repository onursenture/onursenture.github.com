import type { Metadata } from "next";
import { PhotoGrid } from "@/components/photos/photo-grid";
import { PageHeader } from "@/components/shell/page-header";
import { getPhotos } from "@/lib/content/photos";
import { pageMetadata } from "@/lib/metadata";
import { assertView } from "@/lib/view/params";

export const metadata: Metadata = pageMetadata("Photos");

export default async function PhotosPage({ params }: PageProps<"/[view]/photos">) {
  const view = assertView((await params).view);
  const photos = await getPhotos();
  if (view === "dashboard") {
    return (
      <main>
        <PageHeader view="dashboard" title="Photos" meta={`${photos.length} photos`} />
        <div className="p-4 md:p-6">
          <PhotoGrid photos={photos} view="dashboard" />
        </div>
      </main>
    );
  }
  return (
    <main className="flex flex-col gap-12 pb-24">
      <PageHeader view="site" title="Photos" />
      <PhotoGrid photos={photos} view="site" />
    </main>
  );
}
