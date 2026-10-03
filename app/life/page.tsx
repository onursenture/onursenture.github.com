import type { Metadata } from "next";
import { lifeSections } from "@/components/sections/life";
import { SectionBlock } from "@/components/sections/section-block";
import { PageHeader } from "@/components/shell/page-header";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata("Life");

export default function LifePage() {
  return (
    <main className="flex flex-col gap-16 pb-24 md:gap-24">
      <PageHeader title="Life" />
      {lifeSections.map((section) => (
        <SectionBlock key={section.id} section={section} />
      ))}
    </main>
  );
}
