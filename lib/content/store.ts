import type { DocKey } from "./keys";
import type { DocSnapshot } from "./site";

// Persistence for admin documents and uploaded images. DrizzleContentStore
// backs production (Neon); FileContentStore backs local dev and the admin e2e.
// saveDraft is an optimistic write: `expected` is the draftUpdatedAt the caller
// last saw (null when it saw no draft); a mismatch returns { ok: false }.

export interface ContentDoc extends DocSnapshot {
  key: DocKey;
  draftUpdatedAt: Date | null;
  publishedAt: Date | null;
}

export interface MediaRecord {
  key: string;
  baseUrl: string;
  width: number;
  height: number;
  widths: number[];
  sourceHash: string;
  settings: string;
  createdAt: Date;
}

export type SaveResult = { ok: true; draftUpdatedAt: Date } | { ok: false };

export interface ContentStore {
  getDoc(key: DocKey): Promise<ContentDoc | null>;
  listDocs(): Promise<ContentDoc[]>;
  saveDraft(key: DocKey, draft: unknown, expected: Date | null, now: Date): Promise<SaveResult>;
  publish(key: DocKey, value: unknown, now: Date): Promise<void>;
  discardDraft(key: DocKey): Promise<void>;
  deleteDoc(key: DocKey): Promise<void>;
  listMedia(): Promise<MediaRecord[]>;
  putMedia(record: MediaRecord): Promise<void>;
}
