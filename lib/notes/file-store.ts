import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { type NoteFields, type NoteStore, type NoteWrite, byPublished } from "./store";
import { type Note, type PublishedNote, isPublished } from "./types";

// A JSON-file NoteStore for local development and the admin e2e, next to the
// content store file (CONTENT_STORE_FILE). Same semantics as DrizzleNoteStore.

export function notesFileFor(contentFile: string): string {
  return `${contentFile.replace(/\.json$/, "")}.notes.json`;
}

interface FileData {
  notes: Record<string, Note>;
}

function toStored(id: string, fields: NoteFields, createdAt: string, updatedAt: string): Note {
  return {
    id,
    text: fields.text,
    side: fields.side,
    lang: fields.lang,
    embed: fields.embed,
    status: fields.status,
    tid: fields.tid,
    publishAt: fields.publishAt?.toISOString() ?? null,
    publishedAt: fields.publishedAt?.toISOString() ?? null,
    createdAt,
    updatedAt,
  };
}

export class FileNoteStore implements NoteStore {
  constructor(private path: string) {}

  private read(): FileData {
    if (!existsSync(this.path)) return { notes: {} };
    return JSON.parse(readFileSync(this.path, "utf8")) as FileData;
  }

  private write(data: FileData) {
    mkdirSync(dirname(this.path), { recursive: true });
    const temp = `${this.path}.tmp`;
    writeFileSync(temp, `${JSON.stringify(data, null, 2)}\n`);
    renameSync(temp, this.path);
  }

  private tidTaken(data: FileData, tid: string | null, except: string | null): boolean {
    return tid !== null && Object.values(data.notes).some((note) => note.tid === tid && note.id !== except);
  }

  async list(): Promise<Note[]> {
    return Object.values(this.read().notes).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.id.localeCompare(a.id));
  }

  async listPublished(): Promise<PublishedNote[]> {
    return Object.values(this.read().notes).filter(isPublished).sort(byPublished);
  }

  async get(id: string): Promise<Note | null> {
    return this.read().notes[id] ?? null;
  }

  async create(fields: NoteFields, now: Date): Promise<NoteWrite> {
    const data = this.read();
    if (this.tidTaken(data, fields.tid, null)) return { ok: false, reason: "duplicate-tid" };
    const id = randomUUID();
    const note = toStored(id, fields, now.toISOString(), now.toISOString());
    data.notes[id] = note;
    this.write(data);
    return { ok: true, note };
  }

  async update(id: string, fields: NoteFields, expected: string, now: Date): Promise<NoteWrite> {
    const data = this.read();
    const current = data.notes[id];
    if (!current) return { ok: false, reason: "missing" };
    if (current.updatedAt !== expected) return { ok: false, reason: "conflict" };
    if (this.tidTaken(data, fields.tid, id)) return { ok: false, reason: "duplicate-tid" };
    const note = toStored(id, fields, current.createdAt, now.toISOString());
    data.notes[id] = note;
    this.write(data);
    return { ok: true, note };
  }

  async remove(id: string, expected: string): Promise<NoteWrite> {
    const data = this.read();
    const current = data.notes[id];
    if (!current) return { ok: false, reason: "missing" };
    if (current.updatedAt !== expected) return { ok: false, reason: "conflict" };
    delete data.notes[id];
    this.write(data);
    return { ok: true, note: current };
  }

  async due(now: Date): Promise<Note[]> {
    return Object.values(this.read().notes)
      .filter((note) => note.status === "scheduled" && note.publishAt !== null && note.publishAt <= now.toISOString())
      .sort((a, b) => (a.publishAt ?? "").localeCompare(b.publishAt ?? "") || a.id.localeCompare(b.id));
  }
}
