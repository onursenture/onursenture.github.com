import { Suspense } from "react";
import { AdminHome } from "@/components/admin/admin-home";
import { AdminLoading } from "@/components/admin/admin-loading";
import { SignIn } from "@/components/admin/sign-in";
import { isAdmin } from "@/lib/auth/admin";
import { safeNext } from "@/lib/auth/github";

// "Sync now" runs every source in one server action.
export const maxDuration = 60;

export default function AdminPage(props: PageProps<"/admin">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Gate searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Gate({ searchParams }: Pick<PageProps<"/admin">, "searchParams">) {
  if (!(await isAdmin())) {
    const { next } = await searchParams;
    return <SignIn next={safeNext(typeof next === "string" ? next : null)} />;
  }
  return <AdminHome />;
}
