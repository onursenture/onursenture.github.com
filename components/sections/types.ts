import type { ReactNode } from "react";
import type { SourceView } from "@/lib/sources/snapshot-view";

// A section is one data loader plus one renderer. Pages hand sections to
// SectionBlock, which loads the data and wraps the renderer in a band.
export interface SectionDefinition<T> {
  id: string;
  title: string;
  load: () => Promise<SourceView<T>>;
  Render: (props: { data: T }) => ReactNode;
  // Upstream name for the band header ("Films · Letterboxd").
  source?: string;
  // The band's "All" link.
  href?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnySectionDefinition = SectionDefinition<any>;
