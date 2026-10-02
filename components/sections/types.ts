import type { ReactNode } from "react";
import type { SourceView } from "@/lib/sources/snapshot-view";
import type { View } from "@/lib/view/views";

export type Visibility = "both" | "dashboard";

// A section is one data loader plus a renderer per view. Pages never branch
// on view themselves; they hand the view to SectionBlock.
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

export function visibleSections<S extends Pick<AnySectionDefinition, "visibility">>(
  sections: S[],
  view: View,
): S[] {
  return sections.filter((s) => s.visibility === "both" || view === "dashboard");
}
