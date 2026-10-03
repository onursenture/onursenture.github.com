"use client";

import { useMemo } from "react";
import type { StudyView } from "@/lib/work/derive";
import type { IconSet } from "@/lib/work/icons";
import { MediaViewer } from "./media-viewer";
import { StudyBody } from "./study-body";
import { useViewerHistory, useViewState } from "./use-view-state";

// The interactive case study body: the Log plus the viewer, which the query
// (?fig=) opens after hydration. The viewer steps through all of the study's
// media.
export function StudyBrowser({ study, icons }: { study: StudyView; icons?: IconSet }) {
  const figs = useMemo(() => new Set(study.media.map((item) => item.id)), [study]);
  const [state, update] = useViewState(figs);
  const viewer = useViewerHistory(state.fig, update);
  return (
    <>
      <StudyBody study={study} onOpen={viewer.open} icons={icons} />
      <MediaViewer title={study.title} items={study.media} current={state.fig} onSelect={viewer.select} onClose={viewer.close} />
    </>
  );
}
