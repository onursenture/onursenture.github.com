import type { Metadata } from "next";
import { lifeSections } from "@/components/sections/life";
import { SectionBlock } from "@/components/sections/section-block";
import { visibleSections } from "@/components/sections/types";
import { assertView } from "@/lib/view/params";

export const metadata: Metadata = { title: "Life" };

export default async function LifePage({ params }: PageProps<"/[view]/life">) {
  const view = assertView((await params).view);
  return (
    <main className="py-8">
      <h1 className="text-2xl font-bold">Life</h1>
      {visibleSections(lifeSections, view).map((section) => (
        <SectionBlock key={section.id} section={section} view={view} />
      ))}
    </main>
  );
}
