"use client";

import { type KeyboardEvent, type PointerEvent, useEffect, useRef, useState } from "react";
import { PlaceholderWash } from "@/components/ui/dither";
import { cx } from "@/lib/cx";
import { type MediaView, pad2 } from "@/lib/work/derive";
import { figmaDesignUrl, figmaEmbedUrl } from "@/lib/work/figma";
import { CreditLine } from "./credit-line";
import { MediaFigure } from "./media-figure";

// Horizontal travel (px) that counts as a swipe on touch screens.
const SWIPE = 50;

// The button that opens a figure: the visible one (after a client navigation
// Next keeps the previous route's tree mounted but hidden, and ids can repeat).
function findOpener(id: string): HTMLElement | null {
  const matches = document.querySelectorAll<HTMLElement>(`[data-media="${CSS.escape(id)}"]`);
  return Array.from(matches).find((el) => el.checkVisibility()) ?? null;
}

// The shared full-screen viewer (spec §3.6): a native modal <dialog> in the
// Life palette. `current` (the ?fig= id) drives it: a known id opens it, null
// closes it. The owner keeps the URL in step (useViewerHistory). Keys: ← →
// step through `items` (wrapping), Esc closes. On close, focus returns to
// whatever opened it (or, with no opener, to the figure's own button).
export function MediaViewer({
  title,
  items,
  current,
  onSelect,
  onClose,
}: {
  title: string;
  items: MediaView[];
  current: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  // Set instead of `returnTo` when nothing was focused at open time (a ?fig=
  // deep link, a reload): close then focuses that figure's button.
  const returnId = useRef<string | null>(null);
  const index = current ? items.findIndex((item) => item.id === current) : -1;
  const item = index >= 0 ? items[index] : null;
  const open = item !== null;
  const openId = item?.id ?? null;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      const active = document.activeElement;
      if (active instanceof HTMLElement && active !== document.body) {
        returnTo.current = active;
        returnId.current = null;
      } else {
        returnTo.current = null;
        returnId.current = openId;
      }
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, openId]);

  // After a client navigation Next keeps this tree mounted but hidden; an
  // open modal would leave the new page inert.
  useEffect(() => {
    const dialog = ref.current;
    return () => {
      returnTo.current = null;
      returnId.current = null;
      dialog?.close();
    };
  }, []);

  function step(delta: number) {
    if (index < 0) return;
    onSelect(items[(index + delta + items.length) % items.length].id);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    }
  }

  return (
    <dialog
      ref={ref}
      aria-label={item ? `${title}, ${item.label}` : title}
      data-side="life"
      onCancel={(event) => {
        // Esc: let the owner update the URL; the effect then closes the dialog.
        event.preventDefault();
        onClose();
      }}
      onClose={() => {
        (returnTo.current ?? (returnId.current ? findOpener(returnId.current) : null))?.focus();
        returnTo.current = null;
        returnId.current = null;
      }}
      onKeyDown={onKeyDown}
      className="media-viewer m-0 h-dvh max-h-none w-full max-w-none bg-bg p-0 text-fg"
    >
      {item ? (
        <div className="flex h-full flex-col px-4 pt-3 pb-4 md:px-6">
          <div className="flex items-center justify-between gap-4 type-meta text-fg-muted">
            <p className="truncate">
              <span className="text-fg">{title}</span> · {item.context}
            </p>
            <button type="button" onClick={onClose} aria-label="Close viewer" className="shrink-0 hover:text-fg">
              Esc ×
            </button>
          </div>
          <ViewerStage
            key={item.id}
            item={item}
            position={`${pad2(index + 1)} / ${pad2(items.length)}`}
            onPrev={() => step(-1)}
            onNext={() => step(1)}
          />
          <ol aria-label="All figures" className="flex shrink-0 gap-1.5 overflow-x-auto pt-3">
            {items.map((other) => (
              <li key={other.id} className="w-16 shrink-0">
                <button
                  type="button"
                  aria-label={`Show ${other.label}`}
                  aria-current={other.id === item.id ? "true" : undefined}
                  onClick={() => onSelect(other.id)}
                  className={cx("block w-full border", other.id === item.id ? "border-accent" : "border-transparent")}
                >
                  <MediaFigure media={other} sizes="64px" ratio="aspect-[4/3]" bare className="border-0" />
                </button>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </dialog>
  );
}

// One figure with previous/next, the caption line and, for Figma-backed
// items, the link and (from md) the click-to-load embed. Keyed by item, so
// the embed state resets when the figure changes (and unmounts the iframe).
function ViewerStage({
  item,
  position,
  onPrev,
  onNext,
}: {
  item: MediaView;
  position: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  const [embed, setEmbed] = useState<"off" | "poster" | "live">("off");
  const startX = useRef<number | null>(null);
  const figma = item.figma;

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    startX.current = event.clientX;
  }
  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (startX.current === null) return;
    const dx = event.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) >= SWIPE) (dx < 0 ? onNext : onPrev)();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        data-stage
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onDragStart={(e) => e.preventDefault()}
        className="grid min-h-0 flex-1 touch-pan-y grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 py-4 md:gap-4 [&_img]:[-webkit-user-drag:none]"
      >
        <button type="button" aria-label="Previous figure" onClick={onPrev} className="px-2 py-4 type-body text-fg-muted hover:text-fg">
          ←
        </button>
        <div className="flex h-full min-h-0 items-center justify-center">
          {figma && embed === "live" ? (
            <iframe title={`${item.caption} in Figma`} src={figmaEmbedUrl(figma)} allowFullScreen className="h-full w-full border" />
          ) : figma && embed === "poster" ? (
            <button
              type="button"
              onClick={() => setEmbed("live")}
              className="relative grid aspect-[16/10] w-full max-w-5xl place-items-center overflow-hidden border"
            >
              <PlaceholderWash tone="accent" />
              <span className="relative bg-fg px-3 py-2 text-left type-meta text-bg">
                Load Figma file
                <span className="block type-label opacity-70">embed.figma.com · interactive</span>
              </span>
            </button>
          ) : (
            <MediaFigure media={item} sizes="100vw" fit />
          )}
        </div>
        <button type="button" aria-label="Next figure" onClick={onNext} className="px-2 py-4 type-body text-fg-muted hover:text-fg">
          →
        </button>
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 type-meta">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1">
          <p>
            <span className="text-fg">{item.label}</span> · {item.caption}
          </p>
          <CreditLine credits={item.credits} />
          {figma ? (
            <a href={figmaDesignUrl(figma)} rel="noopener noreferrer" className="text-accent hover:underline">
              Open in Figma{" ↗"}
            </a>
          ) : null}
          {figma?.embed ? (
            <button
              type="button"
              aria-pressed={embed !== "off"}
              onClick={() => setEmbed(embed === "off" ? "poster" : "off")}
              className="hidden text-accent hover:underline md:inline"
            >
              {embed === "off" ? "Load Figma file" : "Back to image"}
            </button>
          ) : null}
        </div>
        <p className="shrink-0 text-fg-muted">{position}</p>
      </div>
    </div>
  );
}
