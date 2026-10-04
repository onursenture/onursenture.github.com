import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminLoading } from "@/components/admin/admin-loading";
import { PageEditor } from "@/components/admin/page-editor/page-editor";
import type { ProductPage } from "@/content/work/types";
import { loadDoc, loadPageContext } from "@/lib/admin/load";
import type { DocEditorInit } from "@/lib/admin/results";
import { requireAdminPage } from "@/lib/auth/admin";
import { lockedIds } from "@/lib/content/ids";
import { workKey } from "@/lib/content/keys";
import { repoValue } from "@/lib/content/site";

// Uploads render renditions in a server action of this page.
export const maxDuration = 60;

export default function WorkEditorPage(props: PageProps<"/admin/work/[slug]">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Gate params={props.params} />
    </Suspense>
  );
}

async function Gate({ params }: Pick<PageProps<"/admin/work/[slug]">, "params">) {
  const { slug } = await params;
  await requireAdminPage(`/admin/work/${slug}/`);
  const loaded = await loadDoc<ProductPage | null>(workKey(slug));
  if (!loaded.value) notFound();
  const { entries, live } = await loadPageContext(loaded.value);
  return (
    <PageEditor
      key={loaded.docKey}
      init={loaded as DocEditorInit<ProductPage>}
      locked={lockedIds(loaded.baseline)}
      entries={entries}
      live={live}
      hasRepo={repoValue(workKey(slug)) !== null}
    />
  );
}
