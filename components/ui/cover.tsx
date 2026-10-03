import { cx } from "@/lib/cx";

// A remote film poster or book cover, always 2:3 and square-cornered. Remote
// images skip the image pipeline, so the explicit size only reserves space.
// Without a src it renders a --color-line block of the same shape.
export function Cover({
  src,
  alt,
  width = 240,
  className,
}: {
  src: string;
  alt: string;
  width?: number;
  className?: string;
}) {
  const classes = cx("block aspect-[2/3] w-full bg-line object-cover", className);
  if (!src) return <span aria-hidden="true" className={classes} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote cover; no optimization by design
    <img
      src={src}
      alt={alt}
      width={width}
      height={Math.round(width * 1.5)}
      loading="lazy"
      decoding="async"
      className={classes}
    />
  );
}
