import { Suspense } from "react";
import { AdminLoading } from "@/components/admin/admin-loading";
import { NewPageForm } from "@/components/admin/new-page-form";
import { ORGS, type OrgId } from "@/content/orgs";
import { requireAdminPage } from "@/lib/auth/admin";

export default function NewPagePage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Gate />
    </Suspense>
  );
}

async function Gate() {
  await requireAdminPage("/admin/work/new/");
  return <NewPageForm orgs={Object.entries(ORGS).map(([id, org]) => ({ id: id as OrgId, name: org.name }))} />;
}
