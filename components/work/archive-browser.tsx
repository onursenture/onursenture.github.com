"use client";

import { useMemo } from "react";
import type { ArchiveView } from "@/lib/work/derive";
import type { WorkView } from "@/lib/work/url-state";
import { ArchiveLog } from "./archive-log";
import { MediaViewer } from "./media-viewer";
import { useViewerHistory, useViewState } from "./use-view-state";

const TAGS: ReadonlySet<string> = new Set(["all"]);
// The Archive has no Posts view.
const VIEWS: ReadonlySet<WorkView> = new Set(["log", "grid", "index"]);

// The Archive with its figures in the shared viewer (?fig=).
export function ArchiveBrowser({ view }: { view: ArchiveView }) {
  const valid = useMemo(() => ({ tags: TAGS, views: VIEWS, figs: new Set(view.media.map((item) => item.id)) }), [view]);
  const [state, update] = useViewState(valid);
  const viewer = useViewerHistory(state.fig, update);
  return (
    <>
      <ArchiveLog view={view} onOpen={viewer.open} />
      <MediaViewer title="Archive" items={view.media} current={state.fig} onSelect={viewer.select} onClose={viewer.close} />
    </>
  );
}
