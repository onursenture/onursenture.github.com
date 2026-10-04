import { Suspense } from "react";
import { AdminLoading } from "@/components/admin/admin-loading";
import { NotesConsole } from "@/components/admin/notes/notes-console";
import { loadNotesConsole } from "@/lib/admin/notes";
import { requireAdminPage } from "@/lib/auth/admin";

// Image uploads render their renditions inside this page's server actions.
export const maxDuration = 60;

export default function NotesAdminPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Gate />
    </Suspense>
  );
}

async function Gate() {
  await requireAdminPage("/admin/notes/");
  return <NotesConsole init={await loadNotesConsole()} />;
}
