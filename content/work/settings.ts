// Site-wide switches for the work pages.
export const workSettings = {
  // Show "Open in Figma ↗" and the click-to-load embed in the viewer. Off:
  // Figma refs never reach the page. Onur, 2026-10-03: PrimeTek may not want
  // its files linked, so no content carries a ref at all; `npm run figma` reads
  // its frames from the gitignored figma.local.json.
  figmaLinks: false,
};
