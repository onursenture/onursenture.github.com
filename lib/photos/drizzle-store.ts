import { randomUUID } from "node:crypto";
import { and, eq, isNotNull } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { photos } from "../db/schema";
import { photoExifSchema, photoImageSchema } from "./schema";
import type { PhotoFields, PhotoStore, PhotoWrite } from "./store";
import { NO_EXIF, type Photo, type PhotoStatus, type StoredPhoto, bySiteOrder, isPublishedPhoto } from "./types";

// Accepts any Postgres Drizzle database: neon-http in production, PGlite in tests.
type AnyPgDatabase = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;
type Row = typeof photos.$inferSelect;

// A row whose image no longer parses can't render: it is left out, with a
// warning, rather than breaking every photo page. An unreadable exif is dropped.
function toPhoto(row: Row): StoredPhoto | null {
  const image = photoImageSchema.safeParse(row.image);
  if (!image.success) {
    console.warn(`[photos] photo ${row.id} has an unreadable image; leaving it out`);
    return null;
  }
  const exif = photoExifSchema.safeParse(row.exif);
  return {
    id: row.id,
    title: row.title,
    alt: row.alt,
    takenAt: row.takenAt,
    camera: row.camera,
    slug: row.slug,
    image: image.data,
    exif: exif.success ? exif.data : NO_EXIF,
    status: row.status as PhotoStatus,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function readable(rows: Row[]): StoredPhoto[] {
  return rows.map(toPhoto).filter((photo): photo is StoredPhoto => photo !== null);
}

// Postgres unique_violation, raised by the slug constraint. Drizzle may wrap
// the driver error, so look at the cause too.
function isUniqueViolation(error: unknown): boolean {
  const code = (e: unknown) => (typeof e === "object" && e !== null && "code" in e ? (e as { code: unknown }).code : undefined);
  return code(error) === "23505" || code((error as { cause?: unknown })?.cause) === "23505";
}

export class DrizzlePhotoStore implements PhotoStore {
  constructor(private db: AnyPgDatabase) {}

  async list(): Promise<StoredPhoto[]> {
    return readable(await this.db.select().from(photos)).sort(bySiteOrder);
  }

  async listPublished(): Promise<Photo[]> {
    const rows = await this.db.select().from(photos).where(eq(photos.status, "published"));
    return readable(rows).filter(isPublishedPhoto).sort(bySiteOrder);
  }

  async get(id: string): Promise<StoredPhoto | null> {
    const rows = await this.db.select().from(photos).where(eq(photos.id, id)).limit(1);
    return rows[0] ? toPhoto(rows[0]) : null;
  }

  async slugs(): Promise<string[]> {
    const rows = await this.db.select({ slug: photos.slug }).from(photos).where(isNotNull(photos.slug));
    return rows.flatMap((row) => (row.slug ? [row.slug] : []));
  }

  async create(fields: PhotoFields, now: Date): Promise<PhotoWrite> {
    try {
      const rows = await this.db
        .insert(photos)
        .values({ id: randomUUID(), ...fields, createdAt: now, updatedAt: now })
        .returning();
      const photo = toPhoto(rows[0]);
      if (photo) return { ok: true, photo };
      throw new Error("the created photo is unreadable");
    } catch (e) {
      if (isUniqueViolation(e)) return { ok: false, reason: "duplicate-slug" };
      throw e;
    }
  }

  async update(id: string, fields: PhotoFields, expected: string, now: Date): Promise<PhotoWrite> {
    try {
      const rows = await this.db
        .update(photos)
        .set({ ...fields, updatedAt: now })
        .where(and(eq(photos.id, id), eq(photos.updatedAt, new Date(expected))))
        .returning();
      const photo = rows[0] ? toPhoto(rows[0]) : null;
      if (photo) return { ok: true, photo };
    } catch (e) {
      if (isUniqueViolation(e)) return { ok: false, reason: "duplicate-slug" };
      throw e;
    }
    return { ok: false, reason: (await this.exists(id)) ? "conflict" : "missing" };
  }

  async remove(id: string, expected: string): Promise<PhotoWrite> {
    const rows = await this.db
      .delete(photos)
      .where(and(eq(photos.id, id), eq(photos.updatedAt, new Date(expected))))
      .returning();
    const photo = rows[0] ? toPhoto(rows[0]) : null;
    if (photo) return { ok: true, photo };
    return { ok: false, reason: (await this.exists(id)) ? "conflict" : "missing" };
  }

  private async exists(id: string): Promise<boolean> {
    const rows = await this.db.select({ id: photos.id }).from(photos).where(eq(photos.id, id)).limit(1);
    return rows.length > 0;
  }
}
