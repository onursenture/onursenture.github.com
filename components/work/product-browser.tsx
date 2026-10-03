"use client";

import { type ReactNode, Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import type { ImageView } from "@/lib/work/derive";
import { OpenFigureContext } from "./media-button";
import { MediaViewer } from "./media-viewer";
import { useViewerHistory, useViewState } from "./use-view-state";

type OpenFigure = (id: string) => void;

// The interactive layer of a product page: it owns the MediaViewer and the
// ?fig= history. The blocks are server-rendered children, so the static HTML
// is the whole page with no figure open and every query shares one cached
// HTML. The viewer reads ?fig= after hydration, inside its own <Suspense>
// (fallback: no viewer), and registers its `open` for the figure buttons
// (MediaButton, via OpenFigureContext). Before that the buttons are inert.
export function ProductBrowser({ title, images, children }: { title: string; images: ImageView[]; children: ReactNode }) {
  const opener = useRef<OpenFigure | null>(null);
  const open = useCallback<OpenFigure>((id) => opener.current?.(id), []);
  const register = useCallback((fn: OpenFigure | null) => {
    opener.current = fn;
  }, []);
  return (
    <OpenFigureContext value={open}>
      {children}
      <Suspense fallback={null}>
        <ProductViewer title={title} images={images} register={register} />
      </Suspense>
    </OpenFigureContext>
  );
}

function ProductViewer({
  title,
  images,
  register,
}: {
  title: string;
  images: ImageView[];
  register: (fn: OpenFigure | null) => void;
}) {
  const figs = useMemo(() => new Set(images.map((image) => image.id)), [images]);
  const [state, update] = useViewState(figs);
  const viewer = useViewerHistory(state.fig, update);
  useEffect(() => {
    register(viewer.open);
    return () => register(null);
  }, [register, viewer.open]);
  return <MediaViewer title={title} items={images} current={state.fig} onSelect={viewer.select} onClose={viewer.close} />;
}
