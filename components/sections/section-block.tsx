import type { View } from "@/lib/view/views";
import { type AnySectionDefinition, isVisible } from "./types";

export async function SectionBlock({
  section,
  view,
}: {
  section: AnySectionDefinition;
  view: View;
}) {
  // Checked before loading so a hidden section costs nothing.
  if (!isVisible(section, view)) return null;
  const { data, lastSuccessAt } = await section.load();
  const { Site, Dashboard } = section;
  return (
    <section data-section={section.id} className="my-8">
      <h2 className="font-bold">{section.title}</h2>
      {view === "dashboard" ? (
        <Dashboard data={data} lastSuccessAt={lastSuccessAt} />
      ) : (
        <Site data={data} />
      )}
    </section>
  );
}
