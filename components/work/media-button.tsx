"use client";

import { createContext, useContext } from "react";
import { MediaFigure, type MediaFigureProps, figureLabel } from "./media-figure";

// Opens the viewer at an image. ProductBrowser provides it; outside one (and
// before hydration) the button is inert.
export const OpenFigureContext = createContext<((id: string) => void) | null>(null);

// A figure that opens the viewer (?fig=<id>).
export function MediaButton(figure: MediaFigureProps) {
  const open = useContext(OpenFigureContext);
  const { media } = figure;
  return (
    <button
      type="button"
      data-media={media.id}
      onClick={() => open?.(media.id)}
      aria-label={`Open ${figureLabel(media).replace(" · ", ": ")}`}
      className="block w-full cursor-zoom-in text-left"
    >
      <MediaFigure {...figure} />
    </button>
  );
}
