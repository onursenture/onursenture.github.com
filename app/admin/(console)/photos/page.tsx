import { Suspense } from "react";
import { AdminLoading } from "@/components/admin/admin-loading";
import { PhotosConsole } from "@/components/admin/photos/photos-console";
import { loadPhotosConsole } from "@/lib/admin/photos";
import { requireAdminPage } from "@/lib/auth/admin";

// Uploads render their renditions inside this page's server actions.
export const maxDuration = 60;

export default function PhotosAdminPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Gate />
    </Suspense>
  );
}

async function Gate() {
  await requireAdminPage("/admin/photos/");
  return <PhotosConsole init={await loadPhotosConsole()} />;
}
