import avatar from "@/lib/images/avatar.json";

// Onur's illustrated avatar (images-src/avatar.webp), 96px square, full colour.
export function Avatar() {
  const data = avatar as { webp: string; avif: string; size: number } | null;
  if (!data) return null;
  return (
    <picture>
      <source srcSet={data.avif} type="image/avif" />
      <img src={data.webp} alt="" aria-hidden="true" width={96} height={96} className="block size-24" />
    </picture>
  );
}
