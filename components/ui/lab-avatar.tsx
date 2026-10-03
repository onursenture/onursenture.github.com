"use client";

import { useState } from "react";
import { DitherAvatar } from "@/components/dither-kit/avatar";
import { fnv1a } from "@/components/dither-kit/pixel";
import { useTokenColor } from "./use-token-color";

// A generative dither avatar for entries without an image, seeded by name.
// The hash picks accent or ink, so neighbours vary.
export function LabAvatar({ name, size = 40 }: { name: string; size?: number }) {
  const [el, setEl] = useState<HTMLSpanElement | null>(null);
  const color = useTokenColor(el, fnv1a(name) % 2 ? "--color-accent" : "--color-fg");
  return (
    <span ref={setEl} aria-hidden="true" className="relative block shrink-0" style={{ width: size, height: size }}>
      {color ? <DitherAvatar name={name} color={color} size={size} /> : null}
    </span>
  );
}
