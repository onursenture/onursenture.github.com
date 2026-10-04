import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { del, put } from "@vercel/blob";

// Where uploads and renditions live (spec §3.3): Vercel Blob in production,
// a local folder served by /api/media-dev/ in development and the admin e2e.
export interface MediaStorage {
  mode: "blob" | "local";
  // Local only: keep an uploaded original and return its source reference.
  saveSource(bytes: Buffer, type: string): Promise<string>;
  readSource(source: string): Promise<Buffer>;
  deleteSource(source: string): Promise<void>;
  // Stores a rendition and returns its public URL.
  putFile(pathname: string, body: Buffer, contentType: string): Promise<string>;
  // Local only: the absolute file for a path inside the folder, else null.
  resolveLocal(pathname: string): string | null;
}

export class LocalMediaStorage implements MediaStorage {
  readonly mode = "local" as const;
  constructor(private dir: string) {}

  resolveLocal(pathname: string): string | null {
    const root = resolve(this.dir);
    const file = resolve(root, pathname);
    return file.startsWith(root + sep) ? file : null;
  }

  async saveSource(bytes: Buffer, type: string): Promise<string> {
    const name = `uploads/${randomUUID()}.${type === "image/png" ? "png" : "jpg"}`;
    const file = this.resolveLocal(name)!;
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, bytes);
    return `local:${name}`;
  }

  private sourceFile(source: string): string {
    const file = source.startsWith("local:uploads/") ? this.resolveLocal(source.slice("local:".length)) : null;
    if (!file) throw new Error("not a local upload");
    return file;
  }

  async readSource(source: string): Promise<Buffer> {
    return readFileSync(this.sourceFile(source));
  }

  async deleteSource(source: string): Promise<void> {
    const file = this.sourceFile(source);
    if (existsSync(file)) rmSync(file);
  }

  // The content type is only for Blob; the local server infers it from the extension.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async putFile(pathname: string, body: Buffer, _contentType?: string): Promise<string> {
    const file = this.resolveLocal(pathname);
    if (!file) throw new Error(`bad path ${pathname}`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, body);
    return `/api/media-dev/${pathname}`;
  }
}

export class BlobMediaStorage implements MediaStorage {
  readonly mode = "blob" as const;

  async saveSource(): Promise<string> {
    throw new Error("Blob uploads go straight from the browser");
  }

  private url(source: string): URL {
    const url = new URL(source);
    if (url.protocol !== "https:" || !url.hostname.endsWith(".public.blob.vercel-storage.com")) throw new Error("not a Blob URL");
    return url;
  }

  async readSource(source: string): Promise<Buffer> {
    const response = await fetch(this.url(source));
    if (!response.ok) throw new Error(`reading the upload failed: ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  }

  async deleteSource(source: string): Promise<void> {
    await del(this.url(source).toString());
  }

  async putFile(pathname: string, body: Buffer, contentType: string): Promise<string> {
    const blob = await put(pathname, body, { access: "public", addRandomSuffix: false, allowOverwrite: true, contentType, cacheControlMaxAge: 31_536_000 });
    return blob.url;
  }

  resolveLocal(): string | null {
    return null;
  }
}

// Blob when its token is set; the local folder off Vercel; on Vercel without
// a token there is no storage and uploads are off.
export function uploadMode(): "blob" | "local" | null {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "blob";
  return process.env.VERCEL ? null : "local";
}

export function getMediaStorage(): MediaStorage {
  const mode = uploadMode();
  if (mode === "blob") return new BlobMediaStorage();
  if (mode === "local") return new LocalMediaStorage(process.env.MEDIA_DEV_DIR ?? ".media-dev");
  throw new Error("BLOB_READ_WRITE_TOKEN is not set");
}
