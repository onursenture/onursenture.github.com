import { Suspense } from "react";
import { AdminLoading } from "@/components/admin/admin-loading";
import { ResumeEditor } from "@/components/admin/resume-editor";
import { loadResumeEditor } from "@/lib/admin/load";
import { requireAdminPage } from "@/lib/auth/admin";

export default function ResumeEditorPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Gate />
    </Suspense>
  );
}

async function Gate() {
  await requireAdminPage("/admin/resume/");
  return <ResumeEditor data={await loadResumeEditor()} />;
}
