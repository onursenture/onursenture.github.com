import { Suspense } from "react";
import { HomeSite } from "@/components/home/home-site";
import { requireAdminPage } from "@/lib/auth/admin";
import { getContentStore } from "@/lib/content/get-store";
import { draftHomeContent } from "@/lib/content/preview";

export default function PreviewHomePage() {
  return (
    <Suspense fallback={null}>
      <PreviewHome />
    </Suspense>
  );
}

async function PreviewHome() {
  await requireAdminPage("/admin/");
  return <HomeSite content={await draftHomeContent(getContentStore())} />;
}
