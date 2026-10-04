// The order of the home's Selected work (Sprint 6, Onur): one entry per pinned
// image, by page slug and image id. A pinned image missing here is appended at
// the end; an entry whose image is gone or no longer pinned is skipped
// (buildPins in lib/work/derive.ts). The admin's `pins` document overrides it.
export interface PinRef {
  slug: string;
  imageId: string;
}

export const pinOrder: PinRef[] = [
  { slug: "primeone", imageId: "components" },
  { slug: "primeblocks", imageId: "application-blocks" },
  { slug: "templates", imageId: "apollo" },
  { slug: "primestore", imageId: "store" },
  { slug: "nebuu", imageId: "game" },
  { slug: "beatografi", imageId: "marketplace" },
];
