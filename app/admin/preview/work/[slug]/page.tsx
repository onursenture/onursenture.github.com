import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductPageBody } from "@/components/work/product-page-body";
import { requireAdminPage } from "@/lib/auth/admin";
import { getContentStore } from "@/lib/content/get-store";
import { draftPageView } from "@/lib/content/preview";
import { getPrimeIcons } from "@/lib/work/primeicons";

export default function PreviewWorkPage(props: PageProps<"/admin/preview/work/[slug]">) {
  return (
    <Suspense fallback={null}>
      <PreviewWork params={props.params} />
    </Suspense>
  );
}

async function PreviewWork({ params }: Pick<PageProps<"/admin/preview/work/[slug]">, "params">) {
  const { slug } = await params;
  await requireAdminPage(`/admin/work/${slug}/`);
  const page = await draftPageView(getContentStore(), slug);
  if (!page) notFound();
  const icons = page.blocks.some((block) => block.kind === "icons") ? await getPrimeIcons() : undefined;
  return <ProductPageBody page={page} icons={icons} />;
}
