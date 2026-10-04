import { publishIssues } from "./rules";
import { scheduleIssue } from "./schedule";
import { noteContentSchema } from "./schema";
import type { NoteFields, NoteStore, NoteWrite } from "./store";
import { randomClockId, tidFromTime } from "./tid";
import { type Note, type NoteContent, type NoteIssue, isPublished } from "./types";

// The admin's note writes (Sprint 9 spec §4.2), independent of Next so they
// can be tested against FileNoteStore. app/admin/notes-actions.ts wraps them
// with the session check, the store and updateTag(NOTES_TAG).

export type NoteOpResult = { status: "ok"; note: Note } | { status: "conflict" } | { status: "missing" } | { status: "invalid"; issues: NoteIssue[] };

// What a server action returns: the operation's result, or the two outcomes
// that only exist at the request level.
export type NoteActionResult = NoteOpResult | { status: "unauthorized" } | { status: "unavailable" };

// `id` null creates a note; otherwise `expected` is the updatedAt last seen.
export interface NoteInput {
  id: string | null;
  expected: string | null;
  content: unknown;
}

export interface NoteRef {
  id: string;
  expected: string;
}

// A TID can collide only with another note made in the same microsecond;
// a new clock id settles it.
const TID_ATTEMPTS = 3;

function invalid(issues: NoteIssue[]): NoteOpResult {
  return { status: "invalid", issues };
}

function parse(content: unknown): { ok: true; value: NoteContent } | { ok: false; issues: NoteIssue[] } {
  const parsed = noteContentSchema.safeParse(content);
  if (parsed.success) return { ok: true, value: parsed.data };
  return { ok: false, issues: parsed.error.issues.map((issue) => ({ at: issue.path.join("/"), message: issue.message })) };
}

function fieldsOf(note: Note): NoteFields {
  return {
    text: note.text,
    side: note.side,
    lang: note.lang,
    embed: note.embed,
    status: note.status,
    tid: note.tid,
    publishAt: note.publishAt ? new Date(note.publishAt) : null,
    publishedAt: note.publishedAt ? new Date(note.publishedAt) : null,
  };
}

function fromWrite(write: NoteWrite): NoteOpResult {
  if (write.ok) return { status: "ok", note: write.note };
  return write.reason === "missing" ? { status: "missing" } : { status: "conflict" };
}

// Creates or updates; `expected` must match for an update.
function write(store: NoteStore, current: Note | null, input: { expected: string | null }, fields: NoteFields, now: Date): Promise<NoteWrite> {
  return current ? store.update(current.id, fields, input.expected ?? "", now) : store.create(fields, now);
}

async function loadCurrent(store: NoteStore, id: string | null): Promise<Note | null | "missing"> {
  if (id === null) return null;
  return (await store.get(id)) ?? "missing";
}

export async function saveNote(store: NoteStore, input: NoteInput, now: Date): Promise<NoteOpResult> {
  const parsed = parse(input.content);
  if (!parsed.ok) return invalid(parsed.issues);
  const current = await loadCurrent(store, input.id);
  if (current === "missing") return { status: "missing" };
  if (!current) return fromWrite(await store.create({ ...parsed.value, status: "draft", tid: null, publishAt: null, publishedAt: null }, now));
  // A scheduled or published note is live, or about to be: it must stay publishable.
  if (current.status !== "draft") {
    const issues = publishIssues(parsed.value);
    if (issues.length > 0) return invalid(issues);
  }
  return fromWrite(await write(store, current, input, { ...fieldsOf(current), ...parsed.value }, now));
}

export async function publishNote(store: NoteStore, input: NoteInput, now: Date): Promise<NoteOpResult> {
  const parsed = parse(input.content);
  if (!parsed.ok) return invalid(parsed.issues);
  const issues = publishIssues(parsed.value);
  if (issues.length > 0) return invalid(issues);
  const current = await loadCurrent(store, input.id);
  if (current === "missing") return { status: "missing" };
  for (let attempt = 0; attempt < TID_ATTEMPTS; attempt++) {
    // Published once: the TID and the date never change.
    const fields: NoteFields =
      current && isPublished(current)
        ? { ...fieldsOf(current), ...parsed.value }
        : { ...parsed.value, status: "published", tid: tidFromTime(now.getTime(), 0, randomClockId()), publishAt: null, publishedAt: now };
    const result = await write(store, current, input, fields, now);
    if (!result.ok && result.reason === "duplicate-tid") continue;
    return fromWrite(result);
  }
  return { status: "conflict" };
}

export async function scheduleNote(store: NoteStore, input: NoteInput & { publishAt: string }, now: Date): Promise<NoteOpResult> {
  const parsed = parse(input.content);
  if (!parsed.ok) return invalid(parsed.issues);
  const issues = publishIssues(parsed.value);
  if (issues.length > 0) return invalid(issues);
  const publishAt = new Date(input.publishAt);
  const problem = scheduleIssue(publishAt, now);
  if (problem) return invalid([{ at: "publishAt", message: problem }]);
  const current = await loadCurrent(store, input.id);
  if (current === "missing") return { status: "missing" };
  if (current?.status === "published") return invalid([{ at: "publishAt", message: "A published note can't be scheduled." }]);
  return fromWrite(await write(store, current, input, { ...parsed.value, status: "scheduled", tid: null, publishAt, publishedAt: null }, now));
}

export async function unscheduleNote(store: NoteStore, ref: NoteRef, now: Date): Promise<NoteOpResult> {
  const current = await store.get(ref.id);
  if (!current) return { status: "missing" };
  if (current.status !== "scheduled") return invalid([{ at: "status", message: "Only a scheduled note can be unscheduled." }]);
  return fromWrite(await store.update(ref.id, { ...fieldsOf(current), status: "draft", publishAt: null }, ref.expected, now));
}

export async function deleteNote(store: NoteStore, ref: NoteRef): Promise<NoteOpResult> {
  return fromWrite(await store.remove(ref.id, ref.expected));
}

// The cron's step (spec §5): every scheduled note whose time has come goes
// live with a TID from its scheduled time (notes sharing a time get 1µs
// apart). A note edited or deleted meanwhile is skipped; the next run picks it
// up if it is still due. Running twice publishes nothing new.
export async function publishDue(store: NoteStore, now: Date): Promise<Note[]> {
  const published: Note[] = [];
  const sameTime = new Map<string, number>();
  for (const note of await store.due(now)) {
    if (!note.publishAt) continue;
    const at = new Date(note.publishAt);
    const offset = sameTime.get(note.publishAt) ?? 0;
    sameTime.set(note.publishAt, offset + 1);
    for (let attempt = 0; attempt < TID_ATTEMPTS; attempt++) {
      const fields: NoteFields = { ...fieldsOf(note), status: "published", tid: tidFromTime(at.getTime(), offset, randomClockId()), publishAt: null, publishedAt: at };
      const result = await store.update(note.id, fields, note.updatedAt, now);
      if (result.ok) published.push(result.note);
      if (result.ok || result.reason !== "duplicate-tid") break;
    }
  }
  return published;
}
