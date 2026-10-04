import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { type DocKey, isDocKey } from "./keys";
import type { ContentDoc, ContentStore, MediaRecord, SaveResult } from "./store";

// A JSON-file ContentStore for local development and the admin e2e, so
// neither ever writes to the production database. getContentStore refuses it
// on Vercel. Same semantics as DrizzleContentStore (tests/helpers/content-store-contract.ts).

interface FileDoc {
  draft: unknown;
  published: unknown;
  draftUpdatedAt: string | null;
  publishedAt: string | null;
}

interface FileMedia extends Omit<MediaRecord, "createdAt"> {
  createdAt: string;
}

interface FileData {
  docs: Record<string, FileDoc>;
  media: Record<string, FileMedia>;
}

export class FileContentStore implements ContentStore {
  constructor(private path: string) {}

  private read(): FileData {
    if (!existsSync(this.path)) return { docs: {}, media: {} };
    return JSON.parse(readFileSync(this.path, "utf8")) as FileData;
  }

  private write(data: FileData) {
    mkdirSync(dirname(this.path), { recursive: true });
    const temp = `${this.path}.tmp`;
    writeFileSync(temp, `${JSON.stringify(data, null, 2)}\n`);
    renameSync(temp, this.path);
  }

  private toDoc(key: string, doc: FileDoc): ContentDoc {
    return {
      key: key as DocKey,
      draft: doc.draft ?? null,
      published: doc.published ?? null,
      draftUpdatedAt: doc.draftUpdatedAt ? new Date(doc.draftUpdatedAt) : null,
      publishedAt: doc.publishedAt ? new Date(doc.publishedAt) : null,
    };
  }

  async getDoc(key: DocKey): Promise<ContentDoc | null> {
    const doc = this.read().docs[key];
    return doc ? this.toDoc(key, doc) : null;
  }

  async listDocs(): Promise<ContentDoc[]> {
    return Object.entries(this.read().docs)
      .filter(([key]) => isDocKey(key))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, doc]) => this.toDoc(key, doc));
  }

  async saveDraft(key: DocKey, draft: unknown, expected: Date | null, now: Date): Promise<SaveResult> {
    const data = this.read();
    const doc = data.docs[key];
    if ((expected?.toISOString() ?? null) !== (doc?.draftUpdatedAt ?? null)) return { ok: false };
    data.docs[key] = { published: doc?.published ?? null, publishedAt: doc?.publishedAt ?? null, draft, draftUpdatedAt: now.toISOString() };
    this.write(data);
    return { ok: true, draftUpdatedAt: now };
  }

  async publish(key: DocKey, value: unknown, now: Date): Promise<void> {
    const data = this.read();
    data.docs[key] = { draft: null, draftUpdatedAt: null, published: value, publishedAt: now.toISOString() };
    this.write(data);
  }

  async discardDraft(key: DocKey): Promise<void> {
    const data = this.read();
    const doc = data.docs[key];
    if (!doc) return;
    if (doc.published == null) delete data.docs[key];
    else data.docs[key] = { ...doc, draft: null, draftUpdatedAt: null };
    this.write(data);
  }

  async deleteDoc(key: DocKey): Promise<void> {
    const data = this.read();
    delete data.docs[key];
    this.write(data);
  }

  async listMedia(): Promise<MediaRecord[]> {
    return Object.values(this.read().media)
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((record) => ({ ...record, createdAt: new Date(record.createdAt) }));
  }

  async putMedia(record: MediaRecord): Promise<void> {
    const data = this.read();
    data.media[record.key] = { ...record, createdAt: record.createdAt.toISOString() };
    this.write(data);
  }
}
