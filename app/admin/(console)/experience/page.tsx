import { Suspense } from "react";
import { AdminLoading } from "@/components/admin/admin-loading";
import { ExperienceEditor } from "@/components/admin/experience-editor";
import type { ExperienceEntry } from "@/content/experience";
import { loadDoc, loadPageOptions } from "@/lib/admin/load";
import { requireAdminPage } from "@/lib/auth/admin";

export default function ExperienceEditorPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Gate />
    </Suspense>
  );
}

async function Gate() {
  await requireAdminPage("/admin/experience/");
  const [init, pages] = await Promise.all([loadDoc<ExperienceEntry[]>("experience"), loadPageOptions()]);
  return <ExperienceEditor init={init} pages={pages} />;
}
