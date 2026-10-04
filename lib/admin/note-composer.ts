import { graphemeCount } from "@/lib/notes/graphemes";
import type { NoteActionResult, NoteInput, NoteRef } from "@/lib/notes/operations";
import { nextQuarter, utcToZoned, zonedToUtc } from "@/lib/notes/schedule";
import { MAX_GRAPHEMES, MAX_IMAGES, type Note, type NoteContent, type NoteImage, type NoteIssue, type NoteLinkCard, type NoteSide } from "@/lib/notes/types";

// The /admin/notes/ composer (Sprint 9 spec §4.1) as plain TypeScript, so it
// is tested without a DOM. components/admin/notes/notes-console.tsx binds it
// to React (useSyncExternalStore) and adds the window listeners. No autosave:
// a write happens only when the author asks for one, one at a time.

export interface NoteActions {
  save(input: NoteInput): Promise<NoteActionResult>;
  publish(input: NoteInput): Promise<NoteActionResult>;
  schedule(input: NoteInput & { publishAt: string }): Promise<NoteActionResult>;
  unschedule(ref: NoteRef): Promise<NoteActionResult>;
  remove(ref: NoteRef): Promise<NoteActionResult>;
}

export interface ScheduleValue {
  on: boolean;
  date: string;
  time: string;
}

export type ComposerStatus =
  | "idle"
  | "saved"
  | "published"
  | "scheduled"
  | "unscheduled"
  | "deleted"
  | "invalid"
  | "conflict"
  | "missing"
  | "unauthorized"
  | "unavailable";

export interface ComposerSnapshot {
  notes: Note[];
  editing: Note | null;
  value: NoteContent;
  schedule: ScheduleValue;
  count: number;
  over: boolean;
  dirty: boolean;
  busy: boolean;
  uploads: number;
  status: ComposerStatus;
  issues: NoteIssue[];
  // Writes are off until a reload: another tab won, the session ended, the
  // note is gone, or there was never a database.
  blocked: boolean;
  lastSide: NoteSide;
  primary: "publish" | "schedule" | "update";
  primaryLabel: string;
  saveLabel: string | null;
  canSave: boolean;
  canPrimary: boolean;
}

const OFF: ScheduleValue = { on: false, date: "", time: "" };
// Outcomes that end the tab's writes until a reload.
const BLOCKING: ComposerStatus[] = ["conflict", "missing", "unauthorized"];

function emptyValue(side: NoteSide): NoteContent {
  return { text: "", side, lang: "en", embed: null };
}

function contentOf(note: Note): NoteContent {
  return { text: note.text, side: note.side, lang: note.lang, embed: note.embed };
}

function scheduleOf(note: Note | null): ScheduleValue {
  if (!note || note.status !== "scheduled" || !note.publishAt) return OFF;
  return { on: true, ...utcToZoned(note.publishAt) };
}

// Key order must not matter: the server hands back images and cards with
// their keys in another order than the client built them.
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

// The schedule only counts while editing a scheduled note, and only while it
// is on: Save draft persists neither, so for a new note or a draft it is not
// an unsaved edit.
function comparable(value: NoteContent, schedule: ScheduleValue, scheduled: boolean): string {
  return canonical({ value, schedule: scheduled && schedule.on ? schedule : OFF });
}

function comparableOf(note: Note): string {
  return comparable(contentOf(note), scheduleOf(note), note.status === "scheduled");
}

function byUpdated(a: Note, b: Note): number {
  return b.updatedAt.localeCompare(a.updatedAt) || b.id.localeCompare(a.id);
}

export class NoteComposerState {
  private notes: Note[];
  private editing: Note | null = null;
  private value: NoteContent;
  private schedule: ScheduleValue = OFF;
  private baseline: string;
  private busy = false;
  private uploads = 0;
  private status: ComposerStatus = "idle";
  private issues: NoteIssue[] = [];
  private blocked: boolean;
  private lastSide: NoteSide;
  private listeners = new Set<() => void>();
  private snapshot: ComposerSnapshot;

  constructor(
    init: { notes: Note[]; available: boolean; side: NoteSide },
    private actions: NoteActions,
    private now: () => Date = () => new Date(),
  ) {
    this.notes = [...init.notes].sort(byUpdated);
    this.blocked = !init.available;
    this.lastSide = init.side;
    this.value = emptyValue(init.side);
    this.baseline = comparable(this.value, OFF, false);
    this.snapshot = this.build();
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.snapshot;

  get hasUnsaved(): boolean {
    return this.busy || this.uploads > 0 || this.snapshot.dirty;
  }

  private build(): ComposerSnapshot {
    const count = graphemeCount(this.value.text);
    const over = count > MAX_GRAPHEMES;
    const status = this.editing?.status;
    const dirty = comparable(this.value, this.schedule, status === "scheduled") !== this.baseline;
    // Save never writes a schedule change; on a scheduled note that is what
    // Reschedule, Publish now and Unschedule are for.
    const scheduleMoved =
      this.editing !== null &&
      status === "scheduled" &&
      canonical(scheduleOf(this.editing)) !== canonical(this.schedule.on ? this.schedule : OFF);
    const primary = status === "published" ? "update" : this.schedule.on ? "schedule" : "publish";
    const primaryLabel =
      primary === "update" ? "Save" : primary === "schedule" ? (status === "scheduled" ? "Reschedule" : "Schedule") : status === "scheduled" ? "Publish now" : "Publish";
    const saveLabel = status === "published" ? null : status === "scheduled" ? "Save" : "Save draft";
    const embed = this.value.embed;
    const hasContent = this.value.text.trim() !== "" || (embed?.kind === "images" && embed.images.length > 0);
    const free = !this.blocked && !this.busy && this.uploads === 0;
    return {
      notes: this.notes,
      editing: this.editing,
      value: this.value,
      schedule: this.schedule,
      count,
      over,
      dirty,
      busy: this.busy,
      uploads: this.uploads,
      status: this.status,
      issues: this.issues,
      blocked: this.blocked,
      lastSide: this.lastSide,
      primary,
      primaryLabel,
      saveLabel,
      canSave: free && dirty && saveLabel !== null && !scheduleMoved,
      canPrimary: free && !over && hasContent && (primary !== "update" || dirty),
    };
  }

  private emit() {
    this.snapshot = this.build();
    for (const listener of this.listeners) listener();
  }

  // An edit clears the last outcome and its issues (Sprint 7 rule).
  private changed() {
    if (!BLOCKING.includes(this.status)) {
      this.status = "idle";
      this.issues = [];
    }
    this.emit();
  }

  private load(note: Note | null, side: NoteSide) {
    this.editing = note;
    this.value = note ? contentOf(note) : emptyValue(side);
    this.schedule = scheduleOf(note);
    this.baseline = note ? comparableOf(note) : comparable(this.value, OFF, false);
  }

  // The side remembered in this browser, applied to an untouched new note.
  setDefaultSide(side: NoteSide) {
    this.lastSide = side;
    if (!this.editing && !this.snapshot.dirty) this.load(null, side);
    this.emit();
  }

  edit(patch: Partial<NoteContent>) {
    this.value = { ...this.value, ...patch };
    this.changed();
  }

  setSchedule(patch: Partial<ScheduleValue>) {
    const next = { ...this.schedule, ...patch };
    // Turning it on picks the next quarter hour, unless a time is kept.
    if (next.on && (!next.date || !next.time)) Object.assign(next, utcToZoned(nextQuarter(this.now()).toISOString()));
    this.schedule = next;
    this.changed();
  }

  addImage(image: NoteImage) {
    const current = this.value.embed?.kind === "images" ? this.value.embed.images : [];
    if (current.length >= MAX_IMAGES) return;
    this.edit({ embed: { kind: "images", images: [...current, image] } });
  }

  removeImage(index: number) {
    if (this.value.embed?.kind !== "images") return;
    const images = this.value.embed.images.filter((_, i) => i !== index);
    this.edit({ embed: images.length > 0 ? { kind: "images", images } : null });
  }

  setAlt(index: number, alt: string) {
    if (this.value.embed?.kind !== "images") return;
    this.edit({ embed: { kind: "images", images: this.value.embed.images.map((image, i) => (i === index ? { ...image, alt } : image)) } });
  }

  setLink(card: NoteLinkCard | null) {
    this.edit({ embed: card });
  }

  uploadStarted() {
    this.uploads++;
    this.emit();
  }

  uploadFinished() {
    this.uploads = Math.max(0, this.uploads - 1);
    this.emit();
  }

  // The caller asks before dropping unsaved edits (LEAVE_QUESTION).
  open(id: string) {
    if (this.busy) return;
    const note = this.notes.find((item) => item.id === id);
    if (!note) return;
    this.load(note, note.side);
    this.changed();
  }

  startNew() {
    if (this.busy) return;
    this.load(null, this.lastSide);
    this.changed();
  }

  private input(): NoteInput {
    return { id: this.editing?.id ?? null, expected: this.editing?.updatedAt ?? null, content: this.value };
  }

  private ref(): NoteRef | null {
    return this.editing ? { id: this.editing.id, expected: this.editing.updatedAt } : null;
  }

  // One action at a time; an outcome other than ok keeps the edit.
  private async run(call: () => Promise<NoteActionResult>, onOk: (note: Note) => void) {
    if (this.busy || this.blocked) return;
    this.busy = true;
    this.emit();
    let result: NoteActionResult;
    try {
      result = await call();
    } catch {
      result = { status: "unavailable" };
    }
    this.busy = false;
    if (result.status === "ok") {
      this.notes = [result.note, ...this.notes.filter((note) => note.id !== result.note.id)].sort(byUpdated);
      this.issues = [];
      onOk(result.note);
    } else if (result.status === "invalid") {
      this.status = "invalid";
      this.issues = result.issues;
    } else {
      this.status = result.status;
      this.issues = [];
      if (BLOCKING.includes(result.status)) this.blocked = true;
    }
    this.emit();
  }

  async save() {
    if (!this.snapshot.canSave) return;
    await this.run(
      () => this.actions.save(this.input()),
      (note) => {
        this.lastSide = note.side;
        this.editing = note;
        this.baseline = comparableOf(note);
        this.status = "saved";
      },
    );
  }

  async primaryAction() {
    if (!this.snapshot.canPrimary) return;
    const { primary } = this.snapshot;
    if (primary === "update") {
      await this.run(
        () => this.actions.save(this.input()),
        (note) => {
          this.editing = note;
          this.baseline = comparableOf(note);
          this.status = "saved";
        },
      );
      return;
    }
    if (primary === "schedule") {
      const at = zonedToUtc(this.schedule.date, this.schedule.time);
      await this.run(
        () => this.actions.schedule({ ...this.input(), publishAt: at ? at.toISOString() : "invalid" }),
        (note) => {
          this.lastSide = note.side;
          this.load(null, note.side);
          this.status = "scheduled";
        },
      );
      return;
    }
    await this.run(
      () => this.actions.publish(this.input()),
      (note) => {
        this.lastSide = note.side;
        this.load(null, note.side);
        this.status = "published";
      },
    );
  }

  async unschedule() {
    const ref = this.ref();
    if (!ref || this.editing?.status !== "scheduled") return;
    await this.run(
      () => this.actions.unschedule(ref),
      (note) => {
        this.load(note, note.side);
        this.status = "unscheduled";
      },
    );
  }

  async remove() {
    const ref = this.ref();
    if (!ref) return;
    await this.run(
      () => this.actions.remove(ref),
      (note) => {
        this.notes = this.notes.filter((item) => item.id !== note.id);
        this.load(null, this.lastSide);
        this.status = "deleted";
      },
    );
  }
}
