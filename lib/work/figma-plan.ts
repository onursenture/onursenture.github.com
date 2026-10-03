import type { ArchiveEntry, CaseStudy, Media } from "@/content/work/types";
import { imageKey } from "./derive";
import { normalizeNodeId } from "./figma";

// What `npm run figma` exports. A target is a media slot with a Figma frame
// and no hand-set image (an explicit `image` that isn't the derived key
// wins). Output goes to images-src/, where `npm run images` picks it up.

export interface FigmaTarget {
  // The manifest key: "work/<slug>/<media id>".
  key: string;
  fileKey: string;
  // API form, "12:345".
  nodeId: string;
  // Relative to the repo root.
  out: string;
}

export interface LockEntry {
  fileKey: string;
  nodeId: string;
  // The Figma file's lastModified when exported (Figma reports it per file).
  lastModified: string;
  exportedAt: string;
}

export type FigmaLock = Record<string, LockEntry>;

export function collectTargets(studies: CaseStudy[], archive: ArchiveEntry[]): FigmaTarget[] {
  const targets: FigmaTarget[] = [];
  const add = (scope: string, media: Media | undefined) => {
    if (!media?.figma) return;
    const key = imageKey(scope, media.id);
    if (media.image && media.image !== key) return;
    targets.push({ key, fileKey: media.figma.fileKey, nodeId: normalizeNodeId(media.figma.nodeId), out: `images-src/${key}.png` });
  };
  for (const study of studies) {
    add(study.slug, study.hero);
    for (const entry of study.entries) for (const media of entry.media) add(study.slug, media);
  }
  for (const entry of archive) add("archive", entry.media);
  return targets;
}

export function groupByFile(targets: FigmaTarget[]): Map<string, FigmaTarget[]> {
  const groups = new Map<string, FigmaTarget[]>();
  for (const target of targets) groups.set(target.fileKey, [...(groups.get(target.fileKey) ?? []), target]);
  return groups;
}

export function isFresh(target: FigmaTarget, lock: FigmaLock, fileLastModified: string): boolean {
  const entry = lock[target.key];
  return entry !== undefined && entry.fileKey === target.fileKey && entry.nodeId === target.nodeId && entry.lastModified === fileLastModified;
}
