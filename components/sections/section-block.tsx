import { Band } from "@/components/ui/band";
import { Panel } from "@/components/ui/panel";
import type { View } from "@/lib/view/views";
import { SyncedAt } from "./synced-at";
import { type AnySectionDefinition, isVisible } from "./types";

// Site: a full-width Band. Dashboard: a Panel on the 12-column grid.
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
  if (view === "dashboard") {
    return (
      <Panel
        id={section.id}
        data-section={section.id}
        title={section.title}
        span={section.span}
        count={section.count?.(data)}
        right={section.synced ? <SyncedAt at={lastSuccessAt} /> : undefined}
      >
        <Dashboard data={data} lastSuccessAt={lastSuccessAt} />
      </Panel>
    );
  }
  return (
    <Band
      id={section.id}
      data-section={section.id}
      label={section.title}
      source={section.source}
      href={section.href}
    >
      <Site data={data} />
    </Band>
  );
}
