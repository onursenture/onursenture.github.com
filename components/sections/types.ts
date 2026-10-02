import type { ReactNode } from "react";
import type { SourceView } from "@/lib/sources/snapshot-view";
import type { View } from "@/lib/view/views";

export type Visibility = "both" | "dashboard";

// A section is one data loader plus a renderer per view. Pages hand the view
// to SectionBlock instead of branching themselves. SectionBlock also enforces
// visibility, so a page that forgets visibleSections can't leak dashboard-only
// sections into the site view.
export interface SectionDefinition<T> {
  id: string;
  title: string;
  visibility: Visibility;
  load: () => Promise<SourceView<T>>;
  Site: (props: { data: T }) => ReactNode;
  Dashboard: (props: { data: T; lastSuccessAt: string | null }) => ReactNode;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnySectionDefinition = SectionDefinition<any>;

// Dashboard-only sections exist only in the dashboard view.
export function isVisible(
  section: Pick<AnySectionDefinition, "visibility">,
  view: View,
): boolean {
  return section.visibility === "both" || view === "dashboard";
}

export function visibleSections<S extends Pick<AnySectionDefinition, "visibility">>(
  sections: S[],
  view: View,
): S[] {
  return sections.filter((s) => isVisible(s, view));
}
