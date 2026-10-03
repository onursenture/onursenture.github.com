import { MediaFigure, type MediaFigureProps } from "./media-figure";

// A figure that opens the viewer. `onOpen` arrives from the client
// StudyBrowser. In the server-rendered fallback it is undefined and the
// button is inert until hydration.
export function MediaButton({ onOpen, ...figure }: MediaFigureProps & { onOpen?: (id: string) => void }) {
  const { media } = figure;
  return (
    <button
      type="button"
      data-media={media.id}
      onClick={() => onOpen?.(media.id)}
      aria-label={`Open ${media.label}: ${media.caption}`}
      className="block w-full cursor-zoom-in text-left"
    >
      <MediaFigure {...figure} />
    </button>
  );
}

