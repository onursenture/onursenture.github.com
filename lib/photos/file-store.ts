import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { PhotoFields, PhotoStore, PhotoWrite } from "./store";
import { type Photo, type StoredPhoto, bySiteOrder, isPublishedPhoto } from "./types";

// A JSON-file PhotoStore for local development and the admin e2e, next to the
// content store file (CONTENT_STORE_FILE). Same semantics as DrizzlePhotoStore.

export function photosFileFor(contentFile: string): string {
  return `${contentFile.replace(/\.json$/, "")}.photos.json`;
}

interface FileData {
  photos: Record<string, StoredPhoto>;
}

function toStored(id: string, fields: PhotoFields, createdAt: string, updatedAt: string): StoredPhoto {
  return {
    id,
    title: fields.title,
    alt: fields.alt,
    takenAt: fields.takenAt,
    camera: fields.camera,
    slug: fields.slug,
    image: fields.image,
    exif: fields.exif,
    status: fields.status,
    publishedAt: fields.publishedAt?.toISOString() ?? null,
    createdAt,
    updatedAt,
  };
}

export class FilePhotoStore implements PhotoStore {
  constructor(private path: string) {}

  private read(): FileData {
    if (!existsSync(this.path)) return { photos: {} };
    return JSON.parse(readFileSync(this.path, "utf8")) as FileData;
  }

  private write(data: FileData) {
    mkdirSync(dirname(this.path), { recursive: true });
    const temp = `${this.path}.tmp`;
    writeFileSync(temp, `${JSON.stringify(data, null, 2)}\n`);
    renameSync(temp, this.path);
  }

  private slugTaken(data: FileData, slug: string | null, except: string | null): boolean {
    return slug !== null && Object.values(data.photos).some((photo) => photo.slug === slug && photo.id !== except);
  }

  async list(): Promise<StoredPhoto[]> {
    return Object.values(this.read().photos).sort(bySiteOrder);
  }

  async listPublished(): Promise<Photo[]> {
    return Object.values(this.read().photos).filter(isPublishedPhoto).sort(bySiteOrder);
  }

  async get(id: string): Promise<StoredPhoto | null> {
    return this.read().photos[id] ?? null;
  }

  async slugs(): Promise<string[]> {
    return Object.values(this.read().photos).flatMap((photo) => (photo.slug ? [photo.slug] : []));
  }

  async create(fields: PhotoFields, now: Date): Promise<PhotoWrite> {
    const data = this.read();
    if (this.slugTaken(data, fields.slug, null)) return { ok: false, reason: "duplicate-slug" };
    const id = randomUUID();
    const photo = toStored(id, fields, now.toISOString(), now.toISOString());
    data.photos[id] = photo;
    this.write(data);
    return { ok: true, photo };
  }

  async update(id: string, fields: PhotoFields, expected: string, now: Date): Promise<PhotoWrite> {
    const data = this.read();
    const current = data.photos[id];
    if (!current) return { ok: false, reason: "missing" };
    if (current.updatedAt !== expected) return { ok: false, reason: "conflict" };
    if (this.slugTaken(data, fields.slug, id)) return { ok: false, reason: "duplicate-slug" };
    const photo = toStored(id, fields, current.createdAt, now.toISOString());
    data.photos[id] = photo;
    this.write(data);
    return { ok: true, photo };
  }

  async remove(id: string, expected: string): Promise<PhotoWrite> {
    const data = this.read();
    const current = data.photos[id];
    if (!current) return { ok: false, reason: "missing" };
    if (current.updatedAt !== expected) return { ok: false, reason: "conflict" };
    delete data.photos[id];
    this.write(data);
    return { ok: true, photo: current };
  }
}
