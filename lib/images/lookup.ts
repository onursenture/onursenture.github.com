import type { MediaRecord } from "@/lib/content/store";
import type { ImageLookup } from "@/lib/work/derive";
import { findImage } from "./manifest";
import type { ImageEntry } from "./plan";

// The image manifest plus uploaded media (Sprint 7 spec §1.3): an uploaded key
// wins, everything else comes from lib/images/manifest.json.
export interface MediaEntry extends ImageEntry {
  key: string;
  baseUrl: string;
}

export function toMediaEntry(record: Pick<MediaRecord, "key" | "baseUrl" | "width" | "height" | "widths">): MediaEntry {
  return { key: record.key, baseUrl: record.baseUrl, width: record.width, height: record.height, widths: record.widths };
}

export function lookupWith(media: MediaEntry[]): ImageLookup {
  const byKey = new Map(media.map((entry) => [entry.key, entry]));
  return (key) => {
    const entry = byKey.get(key);
    return entry ? { width: entry.width, height: entry.height, widths: entry.widths, baseUrl: entry.baseUrl } : findImage(key);
  };
}

export function hasImageWith(media: MediaEntry[]): (key: string) => boolean {
  const lookup = lookupWith(media);
  return (key) => lookup(key) !== undefined;
}
