"use client";

import { useCallback, useState } from "react";
import { cx } from "@/lib/cx";
import { TileFallback } from "./tile-fallback";

const SHAPES = {
  poster: { aspect: "aspect-[2/3]", ratio: 3 / 2 },
  wide: { aspect: "aspect-[16/10]", ratio: 10 / 16 },
} as const;

// A hot-linked upstream image (poster, cover, og:image) that turns into the
// Dither fallback when it doesn't load: a rotted og:image, a guessed theatre
// poster that doesn't exist, a host that blocks hot-linking. Sent without a
// referrer, which some of those hosts check. Decorative (alt="").
export function RemoteImage({
  src,
  initial,
  shape = "poster",
  width,
  priority = false,
  className,
}: {
  src: string;
  initial: string;
  shape?: keyof typeof SHAPES;
  width: number;
  priority?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  // An error that fired before hydration attached onError: the image is
  // complete but has no pixels. (A lazy image not yet requested is not
  // complete, so it isn't mistaken for a failure.)
  const catchEarlyError = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth === 0) setFailed(true);
  }, []);
  if (!src || failed) return <TileFallback initial={initial} shape={shape} className={className} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote image; no optimization by design
    <img
      ref={catchEarlyError}
      src={src}
      alt=""
      width={width}
      height={Math.round(width * SHAPES[shape].ratio)}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={cx("block w-full bg-line object-cover", SHAPES[shape].aspect, className)}
    />
  );
}
