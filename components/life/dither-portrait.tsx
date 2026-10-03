import portrait from "@/lib/images/portrait.json";
import { LabAvatar } from "@/components/ui/lab-avatar";

// Onur's photo as a build-time 1-bit dither (scripts/images.ts). Until he
// supplies images-src/portrait.*, a dither avatar seeded "w00f" stands in.
export function DitherPortrait() {
  const data = portrait as { src: string; width: number; height: number } | null;
  if (!data) {
    return (
      <div className="flex h-[120px] w-24 items-end justify-center border p-2">
        <LabAvatar name="w00f" size={64} />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a fixed-size 1-bit PNG; no responsive set needed
    <img src={data.src} alt="" aria-hidden="true" width={96} height={120} className="h-[120px] w-24 [image-rendering:pixelated]" />
  );
}
