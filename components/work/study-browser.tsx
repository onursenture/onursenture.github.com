"use client";

import { useMemo } from "react";
import { type StudyView, viewerItems } from "@/lib/work/derive";
import type { IconSet } from "@/lib/work/icons";
import { type ViewState, type WorkView, validValues } from "@/lib/work/url-state";
import { MediaViewer } from "./media-viewer";
import { StudyBody } from "./study-body";
import { useViewerHistory, useViewState } from "./use-view-state";

// The interactive case study body: URL-driven view, filter, density and the
// open figure. Changing the view closes any open figure.
export function StudyBrowser({ study, icons }: { study: StudyView; icons?: IconSet }) {
  const valid = useMemo(() => {
    const views: WorkView[] = study.postCount > 0 ? ["log", "grid", "index", "posts"] : ["log", "grid", "index"];
    return validValues(study.media, study.chips, study.postChips, new Set(views));
  }, [study]);
  const [state, update] = useViewState(valid);
  // Posts chips are entries (some without figures), Grid and Index chips also
  // hold tags: crossing between them keeps the filter only where it still exists.
  const mediaKeys = useMemo(() => new Set(study.chips.map((chip) => chip.key)), [study]);
  const postKeys = useMemo(() => new Set(study.postChips.map((chip) => chip.key)), [study]);
  const change = (patch: Partial<ViewState>) => {
    const next = patch.view;
    const keys = next === "posts" ? postKeys : mediaKeys;
    const tag = next && patch.tag === undefined && !keys.has(state.tag) ? "all" : patch.tag;
    update({ ...patch, ...(tag === undefined ? {} : { tag }), fig: null });
  };
  const viewer = useViewerHistory(state.fig, update);
  const items = viewerItems(study.media, state.view, state.tag, state.fig);
  return (
    <>
      <StudyBody study={study} state={state} onChange={change} onOpen={viewer.open} icons={icons} />
      <MediaViewer title={study.title} items={items} current={state.fig} onSelect={viewer.select} onClose={viewer.close} />
    </>
  );
}
