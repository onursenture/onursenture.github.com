import { Suspense } from "react";
import { AdminLoading } from "@/components/admin/admin-loading";
import { BioEditor } from "@/components/admin/bio-editor";
import type { ProfileCopy } from "@/content/profile";
import { loadDoc } from "@/lib/admin/load";
import { requireAdminPage } from "@/lib/auth/admin";

export default function BioEditorPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Gate />
    </Suspense>
  );
}

async function Gate() {
  await requireAdminPage("/admin/bio/");
  return <BioEditor init={await loadDoc<ProfileCopy>("profile")} />;
}
