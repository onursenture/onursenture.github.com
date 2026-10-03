"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { type ViewState, parseViewState, viewStateQuery } from "@/lib/work/url-state";

export type UpdateViewState = (patch: Partial<ViewState>, mode?: "push" | "replace") => void;

// The only state is the open figure (?fig=, lib/work/url-state.ts). The server
// always renders the page without it; this reads the real query after
// hydration. Next syncs useSearchParams with history.pushState/replaceState,
// so Back and Forward update it too. Must render inside <Suspense>
// (prerendered route).
export function useViewState(figs: ReadonlySet<string>): readonly [ViewState, UpdateViewState] {
  const params = useSearchParams();
  const state = useMemo(() => parseViewState(params, figs), [params, figs]);
  const update = useCallback<UpdateViewState>(
    (patch, mode = "replace") => {
      const url = `${window.location.pathname}${viewStateQuery({ ...state, ...patch })}`;
      if (mode === "push") window.history.pushState(null, "", url);
      else window.history.replaceState(null, "", url);
    },
    [state],
  );
  return [state, update] as const;
}

// Opening a figure pushes a history entry (?fig=id), so Back closes it.
// Stepping replaces it. Closing goes back when this page pushed the entry,
// or drops the param when the page was loaded with it.
export function useViewerHistory(fig: string | null, update: UpdateViewState) {
  const pushed = useRef(false);
  useEffect(() => {
    if (!fig) pushed.current = false;
  }, [fig]);
  const open = useCallback(
    (id: string) => {
      pushed.current = true;
      update({ fig: id }, "push");
    },
    [update],
  );
  const close = useCallback(() => {
    if (pushed.current) {
      pushed.current = false;
      window.history.back();
    } else {
      update({ fig: null });
    }
  }, [update]);
  const select = useCallback((id: string) => update({ fig: id }), [update]);
  return { open, close, select };
}
