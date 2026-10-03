"use client";

import { useMemo } from "react";
import type { StudyView } from "@/lib/work/derive";
import { validValues } from "@/lib/work/url-state";
import { StudyBody } from "./study-body";
import { useViewState } from "./use-view-state";

// The interactive case study body: URL-driven view, filter and density.
// Changing the view closes any open figure.
export function StudyBrowser({ study }: { study: StudyView }) {
  const valid = useMemo(() => validValues(study.media, study.chips), [study]);
  const [state, update] = useViewState(valid);
  return <StudyBody study={study} state={state} onChange={(patch) => update({ ...patch, fig: null })} />;
}
