import type { Metadata } from "next";
import { Suspense } from "react";
import { ItemLink } from "@/components/sections/item-link";
import { SectionRow } from "@/components/ui/section-row";
import { ArchiveBrowser } from "@/components/work/archive-browser";
import { ArchiveLog } from "@/components/work/archive-log";
import { pageMetadata } from "@/lib/metadata";
import { getArchiveView } from "@/lib/work";

const DESCRIPTION = "Other PrimeTek work, from the posts that announced it.";

export const metadata: Metadata = pageMetadata("Archive", { description: DESCRIPTION, openGraph: { description: DESCRIPTION } });

// "Everything else" (spec §4.3). A static segment, so it wins over
// /work/[slug]/.
export default function ArchivePage() {
  const view = getArchiveView();
  return (
    <main className="pb-16">
      <SectionRow
        labelAs="div"
        label={
          <>
            <ItemLink href="/work/" className="text-fg-muted">
              ← Work
            </ItemLink>
            <span className="mt-4 block text-fg">Archive</span>
          </>
        }
      >
        <h1 className="type-lead">
          Archive. <span className="text-fg-muted">{DESCRIPTION}</span>
        </h1>
      </SectionRow>
      <Suspense fallback={<ArchiveLog view={view} />}>
        <ArchiveBrowser view={view} />
      </Suspense>
    </main>
  );
}
