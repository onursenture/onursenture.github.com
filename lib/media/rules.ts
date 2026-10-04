// Upload rules (spec §3.1), shared by the browser pre-check and the server.
export const MIN_WIDTH = 1280;
export const MAX_BYTES = 25 * 1024 * 1024;
export const UPLOAD_TYPES = ["image/png", "image/jpeg"] as const;
const RATIO = 16 / 10;
const TOLERANCE = 0.01;

export function checkType(type: string): string | null {
  return (UPLOAD_TYPES as readonly string[]).includes(type) ? null : "Use a PNG or JPEG.";
}

export function checkDimensions(width: number, height: number): string | null {
  if (Math.abs(width / height - RATIO) / RATIO > TOLERANCE) return `The image is ${width}×${height}; it must be 16:10, for example 2560×1600.`;
  if (width < MIN_WIDTH) return `The image is ${width}px wide; it needs at least ${MIN_WIDTH}px.`;
  return null;
}

// Notes (Sprint 9 spec §4.3): any ratio from 1:3 to 3:1 (screenshots, phone
// photos), at least 320px wide. The 16:10 rule above stays for product pages.
export const NOTE_MIN_WIDTH = 320;
const NOTE_MAX_RATIO = 3;

export function checkNoteDimensions(width: number, height: number): string | null {
  const ratio = width / height;
  if (ratio > NOTE_MAX_RATIO || ratio < 1 / NOTE_MAX_RATIO) return `The image is ${width}×${height}; notes take ratios from 1:3 to 3:1.`;
  if (width < NOTE_MIN_WIDTH) return `The image is ${width}px wide; it needs at least ${NOTE_MIN_WIDTH}px.`;
  return null;
}
