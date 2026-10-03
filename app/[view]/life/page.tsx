import type { Metadata } from "next";
import { lifeSections } from "@/components/sections/life";
import { SectionBlock } from "@/components/sections/section-block";
import { visibleSections } from "@/components/sections/types";
import { PageHeader } from "@/components/shell/page-header";
import { PanelGrid } from "@/components/ui/panel";
import { assertView } from "@/lib/view/params";

export const metadata: Metadata = { title: "Life" };

export default async function LifePage({ params }: PageProps<"/[view]/life">) {
  const view = assertView((await params).view);
  const sections = visibleSections(lifeSections, view);
  const blocks = sections.map((section) => <SectionBlock key={section.id} section={section} view={view} />);

  if (view === "dashboard") {
    return (
      <main>
        <PageHeader view="dashboard" title="Life" meta={`${sections.length} sections`} />
        <PanelGrid>{blocks}</PanelGrid>
      </main>
    );
  }
  return (
    <main className="flex flex-col gap-16 pb-24 md:gap-24">
      <PageHeader view="site" title="Life" />
      {blocks}
    </main>
  );
}
