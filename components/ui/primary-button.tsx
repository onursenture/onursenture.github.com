import type { ReactNode } from "react";
import { DitherGradient } from "@/components/dither-kit/gradient";
import { isExternal } from "./text-link";

const WHITE: [number, number, number] = [255, 255, 255];

// The one call to action ("Book a call"): accent fill, a white dither
// highlight on the top third. The label is white on the light accent (~6:1)
// and the page's dark ink in dark mode and on the Life side (the dark accent
// is too light for white at 13px, ~3:1). A link, not a <button>. The theme
// clears Tailwind's palette, so `text-white` does not exist: hence the literal.
export function PrimaryButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      rel={isExternal(href) ? "noopener noreferrer" : undefined}
      className="relative inline-flex h-9 items-center overflow-hidden rounded-control bg-accent px-3.5 type-body font-medium text-[#fff] dark:text-bg hover:brightness-110"
    >
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1/3">
        <DitherGradient from={WHITE} direction="down" cell={2} opacity={0.3} />
      </span>
      <span className="relative">{children}</span>
    </a>
  );
}
