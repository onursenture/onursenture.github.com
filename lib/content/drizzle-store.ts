import { and, eq, isNull } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { contentDocs, media } from "../db/schema";
import { type DocKey, isDocKey } from "./keys";
import type { ContentDoc, ContentStore, MediaRecord, SaveResult } from "./store";

// Accepts any Postgres Drizzle database: neon-http in production, PGlite in tests.
type AnyPgDatabase = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

function toDoc(row: typeof contentDocs.$inferSelect): ContentDoc {
  return {
    key: row.key as DocKey,
    draft: row.draft ?? null,
    published: row.published ?? null,
    draftUpdatedAt: row.draftUpdatedAt,
    publishedAt: row.publishedAt,
  };
}

export class DrizzleContentStore implements ContentStore {
  constructor(private db: AnyPgDatabase) {}

  async getDoc(key: DocKey): Promise<ContentDoc | null> {
    const rows = await this.db.select().from(contentDocs).where(eq(contentDocs.key, key)).limit(1);
    return rows[0] ? toDoc(rows[0]) : null;
  }

  async listDocs(): Promise<ContentDoc[]> {
    const rows = await this.db.select().from(contentDocs).orderBy(contentDocs.key);
    return rows.filter((row) => isDocKey(row.key)).map(toDoc);
  }

  async saveDraft(key: DocKey, draft: unknown, expected: Date | null, now: Date): Promise<SaveResult> {
    const set = { draft, draftUpdatedAt: now };
    const rows =
      expected === null
        ? await this.db
            .insert(contentDocs)
            .values({ key, ...set })
            .onConflictDoUpdate({ target: contentDocs.key, set, setWhere: isNull(contentDocs.draftUpdatedAt) })
            .returning({ key: contentDocs.key })
        : await this.db
            .update(contentDocs)
            .set(set)
            .where(and(eq(contentDocs.key, key), eq(contentDocs.draftUpdatedAt, expected)))
            .returning({ key: contentDocs.key });
    return rows.length > 0 ? { ok: true, draftUpdatedAt: now } : { ok: false };
  }

  async publish(key: DocKey, value: unknown, now: Date): Promise<void> {
    const set = { published: value, draft: null, draftUpdatedAt: null, publishedAt: now };
    await this.db.insert(contentDocs).values({ key, ...set }).onConflictDoUpdate({ target: contentDocs.key, set });
  }

  async discardDraft(key: DocKey): Promise<void> {
    await this.db.update(contentDocs).set({ draft: null, draftUpdatedAt: null }).where(eq(contentDocs.key, key));
    // A page created in the admin and never published has nothing left.
    await this.db.delete(contentDocs).where(and(eq(contentDocs.key, key), isNull(contentDocs.published)));
  }

  async deleteDoc(key: DocKey): Promise<void> {
    await this.db.delete(contentDocs).where(eq(contentDocs.key, key));
  }

  async listMedia(): Promise<MediaRecord[]> {
    const rows = await this.db.select().from(media).orderBy(media.key);
    return rows.map((row) => ({ ...row }));
  }

  async putMedia(record: MediaRecord): Promise<void> {
    const set = { ...record, key: undefined };
    await this.db.insert(media).values(record).onConflictDoUpdate({ target: media.key, set });
  }
}
