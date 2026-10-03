import { SectionRow } from "@/components/ui/section-row";
import { TextLink } from "@/components/ui/text-link";
import type { AnySectionDefinition } from "./types";

const WIDE = new Set(["films", "books", "photos"]);

export async function SectionBlock({ section }: { section: AnySectionDefinition }) {
  const { data } = await section.load();
  const { Render } = section;
  return (
    <SectionRow
      id={section.id}
      data-section={section.id}
      wide={WIDE.has(section.id)}
      label={
        <>
          {section.title}
          {section.source ? <span className="text-fg-muted"> · {section.source}</span> : null}
        </>
      }
      action={section.href ? <TextLink href={section.href}>All</TextLink> : undefined}
    >
      <Render data={data} />
    </SectionRow>
  );
}
