"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { type ValidValues, type ViewState, parseViewState, viewStateQuery } from "@/lib/work/url-state";

export type UpdateViewState = (patch: Partial<ViewState>, mode?: "push" | "replace") => void;

// The view state lives in the query (lib/work/url-state.ts). The server
// always renders the defaults; this reads the real query after hydration.
// Next syncs useSearchParams with history.pushState/replaceState, so Back and
// Forward update it too. Must render inside <Suspense> (prerendered route).
export function useViewState(valid: ValidValues): readonly [ViewState, UpdateViewState] {
  const params = useSearchParams();
  const state = useMemo(() => parseViewState(params, valid), [params, valid]);
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
