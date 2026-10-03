"use client";

import { useMemo } from "react";
import { type StudyView, viewerItems } from "@/lib/work/derive";
import type { IconSet } from "@/lib/work/icons";
import { validValues } from "@/lib/work/url-state";
import { MediaViewer } from "./media-viewer";
import { StudyBody } from "./study-body";
import { useViewerHistory, useViewState } from "./use-view-state";

// The interactive case study body: URL-driven view, filter, density and the
// open figure. Changing the view closes any open figure.
export function StudyBrowser({ study, icons }: { study: StudyView; icons?: IconSet }) {
  const valid = useMemo(() => validValues(study.media, study.chips), [study]);
  const [state, update] = useViewState(valid);
  const viewer = useViewerHistory(state.fig, update);
  const items = viewerItems(study.media, state.view, state.tag, state.fig);
  return (
    <>
      <StudyBody study={study} state={state} onChange={(patch) => update({ ...patch, fig: null })} onOpen={viewer.open} icons={icons} />
      <MediaViewer title={study.title} items={items} current={state.fig} onSelect={viewer.select} onClose={viewer.close} />
    </>
  );
}
