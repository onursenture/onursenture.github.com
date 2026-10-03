import { PhotoGrid } from "@/components/photos/photo-grid";
import { DataTable } from "@/components/ui/data-table";
import { type Photo, getPhotos } from "@/lib/content/photos";
import { formatDate } from "@/lib/format";
import { Empty } from "../empty";
import { ItemLink } from "../item-link";
import type { SectionDefinition } from "../types";

function Site({ data }: { data: Photo[] }) {
  if (data.length === 0) return <Empty />;
  return <PhotoGrid photos={data} view="site" />;
}

function Dashboard({ data }: { data: Photo[] }) {
  return (
    <DataTable
      caption="Photos"
      rows={data}
      rowKey={(photo) => photo.slug}
      columns={[
        { header: "Title", cell: (photo) => <ItemLink href={`/photos/${photo.slug}/`}>{photo.title}</ItemLink> },
        { header: "Camera", cell: (photo) => photo.camera ?? "", mono: true },
        { header: "Date", cell: (photo) => formatDate(photo.date), mono: true, align: "right" },
      ]}
    />
  );
}

// Photos are authored content, not a synced source: no sync time.
export const photos: SectionDefinition<Photo[]> = {
  id: "photos",
  title: "Photos",
  visibility: "both",
  load: async () => ({ data: await getPhotos(), lastSuccessAt: null }),
  Site,
  Dashboard,
  href: "/photos/",
  count: (data) => data.length,
  span: 8,
};
