import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, lte } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { notes } from "../db/schema";
import { noteEmbedSchema } from "./schema";
import { type NoteFields, type NoteStore, type NoteWrite, byPublished } from "./store";
import { type Note, type NoteLang, type NoteSide, type NoteStatus, type PublishedNote, isPublished } from "./types";

// Accepts any Postgres Drizzle database: neon-http in production, PGlite in tests.
type AnyPgDatabase = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;
type Row = typeof notes.$inferSelect;

// A stored embed that no longer parses renders without the attachment.
function toNote(row: Row): Note {
  const embed = noteEmbedSchema.safeParse(row.embed ?? null);
  if (!embed.success) console.warn(`[notes] note ${row.id} has an unreadable embed; showing none`);
  return {
    id: row.id,
    text: row.text,
    side: row.side as NoteSide,
    lang: row.lang as NoteLang,
    embed: embed.success ? embed.data : null,
    status: row.status as NoteStatus,
    tid: row.tid,
    publishAt: row.publishAt?.toISOString() ?? null,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// Postgres unique_violation, raised by the tid constraint. Drizzle may wrap
// the driver error, so look at the cause too.
function isUniqueViolation(error: unknown): boolean {
  const code = (e: unknown) => (typeof e === "object" && e !== null && "code" in e ? (e as { code: unknown }).code : undefined);
  return code(error) === "23505" || code((error as { cause?: unknown })?.cause) === "23505";
}

export class DrizzleNoteStore implements NoteStore {
  constructor(private db: AnyPgDatabase) {}

  async list(): Promise<Note[]> {
    const rows = await this.db.select().from(notes).orderBy(desc(notes.updatedAt), desc(notes.id));
    return rows.map(toNote);
  }

  async listPublished(): Promise<PublishedNote[]> {
    const rows = await this.db.select().from(notes).where(eq(notes.status, "published"));
    return rows.map(toNote).filter(isPublished).sort(byPublished);
  }

  async get(id: string): Promise<Note | null> {
    const rows = await this.db.select().from(notes).where(eq(notes.id, id)).limit(1);
    return rows[0] ? toNote(rows[0]) : null;
  }

  async create(fields: NoteFields, now: Date): Promise<NoteWrite> {
    try {
      const rows = await this.db
        .insert(notes)
        .values({ id: randomUUID(), ...fields, createdAt: now, updatedAt: now })
        .returning();
      return { ok: true, note: toNote(rows[0]) };
    } catch (e) {
      if (isUniqueViolation(e)) return { ok: false, reason: "duplicate-tid" };
      throw e;
    }
  }

  async update(id: string, fields: NoteFields, expected: string, now: Date): Promise<NoteWrite> {
    try {
      const rows = await this.db
        .update(notes)
        .set({ ...fields, updatedAt: now })
        .where(and(eq(notes.id, id), eq(notes.updatedAt, new Date(expected))))
        .returning();
      if (rows[0]) return { ok: true, note: toNote(rows[0]) };
    } catch (e) {
      if (isUniqueViolation(e)) return { ok: false, reason: "duplicate-tid" };
      throw e;
    }
    return { ok: false, reason: (await this.get(id)) ? "conflict" : "missing" };
  }

  async remove(id: string, expected: string): Promise<NoteWrite> {
    const rows = await this.db
      .delete(notes)
      .where(and(eq(notes.id, id), eq(notes.updatedAt, new Date(expected))))
      .returning();
    if (rows[0]) return { ok: true, note: toNote(rows[0]) };
    return { ok: false, reason: (await this.get(id)) ? "conflict" : "missing" };
  }

  async due(now: Date): Promise<Note[]> {
    const rows = await this.db
      .select()
      .from(notes)
      .where(and(eq(notes.status, "scheduled"), lte(notes.publishAt, now)))
      .orderBy(asc(notes.publishAt), asc(notes.id));
    return rows.map(toNote);
  }
}
