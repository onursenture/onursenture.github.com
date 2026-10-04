import { Suspense } from "react";
import { AdminLoading } from "@/components/admin/admin-loading";
import { LabEditor } from "@/components/admin/lab-editor";
import type { LabEntry } from "@/content/lab-index";
import { loadDoc } from "@/lib/admin/load";
import { requireAdminPage } from "@/lib/auth/admin";

export default function LabEditorPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Gate />
    </Suspense>
  );
}

async function Gate() {
  await requireAdminPage("/admin/lab/");
  return <LabEditor init={await loadDoc<LabEntry[]>("lab")} />;
}
