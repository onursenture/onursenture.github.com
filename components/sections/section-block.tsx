import { Band } from "@/components/ui/band";
import type { AnySectionDefinition } from "./types";

export async function SectionBlock({ section }: { section: AnySectionDefinition }) {
  const { data } = await section.load();
  const { Render } = section;
  return (
    <Band id={section.id} data-section={section.id} label={section.title} source={section.source} href={section.href}>
      <Render data={data} />
    </Band>
  );
}
