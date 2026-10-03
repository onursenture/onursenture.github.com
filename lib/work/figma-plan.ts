import type { ArchiveEntry, CaseStudy, Media } from "@/content/work/types";
import { imageKey } from "./derive";
import { normalizeNodeId } from "./figma";

// What `npm run figma` exports. The frames come from figma.local.json, a
// gitignored file at the repo root, so no Figma file key or node id is ever
// committed (PrimeTek may not want its files linked):
//
//   { "frames": { "work/primeone/cover": { "fileKey": "...", "nodeId": "12:345" } } }
//
// Each key is the image manifest key of the slot it fills. A key whose media
// has a hand-set `image` other than the key is skipped (hand-set images win).
// Output goes to images-src/, where `npm run images` picks it up.

export interface FigmaFrame {
  fileKey: string;
  // API form, "12:345" (parseFigmaConfig normalises "12-345").
  nodeId: string;
}

export interface FigmaConfig {
  frames: Record<string, FigmaFrame>;
}

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

const KEY = /^work\/[a-z0-9-]+\/[a-z0-9-]+$/;
const NODE_ID = /^\d+[:-]\d+$/;

// Validates the parsed figma.local.json. Throws a message naming the problem.
export function parseFigmaConfig(raw: unknown): FigmaConfig {
  const frames = (raw as { frames?: unknown } | null)?.frames;
  if (!frames || typeof frames !== "object" || Array.isArray(frames)) {
    throw new Error('figma.local.json needs a "frames" object: { "frames": { "work/<slug>/<media id>": { "fileKey", "nodeId" } } }');
  }
  const out: Record<string, FigmaFrame> = {};
  for (const [key, value] of Object.entries(frames)) {
    if (!KEY.test(key)) throw new Error(`figma.local.json: bad key "${key}" (expected work/<slug>/<media id>)`);
    const { fileKey, nodeId } = (value ?? {}) as Partial<FigmaFrame>;
    if (typeof fileKey !== "string" || !fileKey.trim()) throw new Error(`figma.local.json: ${key} needs a fileKey`);
    if (typeof nodeId !== "string" || !NODE_ID.test(nodeId.trim())) throw new Error(`figma.local.json: ${key} needs a nodeId like "12:345"`);
    out[key] = { fileKey: fileKey.trim(), nodeId: normalizeNodeId(nodeId) };
  }
  return { frames: out };
}

// Every media slot in the content, by manifest key, so a frame can be checked
// against a hand-set image.
function mediaByKey(studies: CaseStudy[], archive: ArchiveEntry[]): Map<string, Media> {
  const map = new Map<string, Media>();
  for (const study of studies) {
    for (const media of [study.hero, ...study.entries.flatMap((entry) => entry.media)]) map.set(imageKey(study.slug, media.id), media);
  }
  for (const entry of archive) if (entry.media) map.set(imageKey("archive", entry.media.id), entry.media);
  return map;
}

// Targets from the frames map. A key that matches no content media is still
// exported (it may be added to the content later).
export function collectTargets(config: FigmaConfig, studies: CaseStudy[] = [], archive: ArchiveEntry[] = []): FigmaTarget[] {
  const slots = mediaByKey(studies, archive);
  const targets: FigmaTarget[] = [];
  for (const [key, frame] of Object.entries(config.frames)) {
    const handSet = slots.get(key)?.image;
    if (handSet && handSet !== key) continue;
    targets.push({ key, fileKey: frame.fileKey, nodeId: normalizeNodeId(frame.nodeId), out: `images-src/${key}.png` });
  }
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
