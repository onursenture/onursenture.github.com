import type { PhotoActionResult, PhotoInput, PhotoRef } from "@/lib/photos/operations";
import { withDay } from "@/lib/photos/taken-at";
import { type PhotoContent, type PhotoIssue, type StoredPhoto, bySiteOrder } from "@/lib/photos/types";

// The /admin/photos/ editor (Sprint 11 spec §3.2) as plain TypeScript, so it
// is tested without a DOM. components/admin/photos/photos-console.tsx binds it
// to React (useSyncExternalStore) and adds the window listeners. No autosave:
// a write happens only when the author asks for one, one at a time. An upload
// creates the draft on the server, so the form always edits a stored photo.

export interface PhotoActions {
  save(input: PhotoInput): Promise<PhotoActionResult>;
  publish(input: PhotoInput): Promise<PhotoActionResult>;
  remove(ref: PhotoRef): Promise<PhotoActionResult>;
}

export type EditorStatus = "idle" | "uploaded" | "saved" | "published" | "deleted" | "invalid" | "refused" | "conflict" | "missing" | "unauthorized" | "unavailable";

export interface EditorSnapshot {
  photos: StoredPhoto[];
  editing: StoredPhoto | null;
  value: PhotoContent;
  dirty: boolean;
  busy: boolean;
  uploading: boolean;
  // Counts every photo loaded into the form, so the UI can key local state on it.
  generation: number;
  status: EditorStatus;
  issues: PhotoIssue[];
  // Writes are off until a reload: another tab won, the session ended, the
  // photo is gone, or there was never a database.
  blocked: boolean;
  // The date and camera still match what EXIF gave at upload.
  exifDate: boolean;
  exifCamera: boolean;
  primaryLabel: "Publish" | "Save";
  saveLabel: "Save draft" | null;
  canSave: boolean;
  canPrimary: boolean;
}

const EMPTY: PhotoContent = { title: "", alt: "", takenAt: "", camera: "" };
// Outcomes that end the tab's writes until a reload.
const BLOCKING: EditorStatus[] = ["conflict", "missing", "unauthorized"];

function contentOf(photo: StoredPhoto): PhotoContent {
  return { title: photo.title, alt: photo.alt, takenAt: photo.takenAt, camera: photo.camera };
}

// Field by field, so the comparison never depends on key order.
function comparable(value: PhotoContent): string {
  return JSON.stringify([value.title, value.alt, value.takenAt, value.camera]);
}

// Drafts first (most recently edited on top), then published photos in site order.
function adminOrder(a: StoredPhoto, b: StoredPhoto): number {
  if (a.status !== b.status) return a.status === "draft" ? -1 : 1;
  if (a.status === "draft") return b.updatedAt.localeCompare(a.updatedAt) || b.id.localeCompare(a.id);
  return bySiteOrder(a, b);
}

export class PhotoEditorState {
  private photos: StoredPhoto[];
  private editing: StoredPhoto | null = null;
  private value: PhotoContent = EMPTY;
  private baseline = comparable(EMPTY);
  private busy = false;
  private uploading = false;
  private generation = 0;
  private status: EditorStatus = "idle";
  private issues: PhotoIssue[] = [];
  private blocked: boolean;
  private listeners = new Set<() => void>();
  private snapshot: EditorSnapshot;

  constructor(
    init: { photos: StoredPhoto[]; available: boolean },
    private actions: PhotoActions,
  ) {
    this.photos = [...init.photos].sort(adminOrder);
    this.blocked = !init.available;
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
    return this.busy || this.uploading || this.snapshot.dirty;
  }

  private build(): EditorSnapshot {
    const editing = this.editing;
    const dirty = editing !== null && comparable(this.value) !== this.baseline;
    const live = editing?.status === "published";
    const free = editing !== null && !this.blocked && !this.busy && !this.uploading;
    return {
      photos: this.photos,
      editing,
      value: this.value,
      dirty,
      busy: this.busy,
      uploading: this.uploading,
      generation: this.generation,
      status: this.status,
      issues: this.issues,
      blocked: this.blocked,
      exifDate: editing !== null && editing.exif.takenAt !== null && editing.exif.takenAt === this.value.takenAt,
      exifCamera: editing !== null && editing.exif.camera !== null && editing.exif.camera === this.value.camera,
      primaryLabel: live ? "Save" : "Publish",
      saveLabel: live ? null : "Save draft",
      canSave: free && dirty && !live,
      canPrimary: free && this.value.title.trim() !== "" && (!live || dirty),
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

  private load(photo: StoredPhoto | null) {
    this.generation++;
    this.editing = photo;
    this.value = photo ? contentOf(photo) : EMPTY;
    this.baseline = comparable(this.value);
  }

  private remember(photo: StoredPhoto) {
    this.photos = [photo, ...this.photos.filter((item) => item.id !== photo.id)].sort(adminOrder);
  }

  private get switching(): boolean {
    return this.busy || this.uploading;
  }

  edit(patch: Partial<PhotoContent>) {
    if (!this.editing || this.switching) return;
    this.value = { ...this.value, ...patch };
    this.changed();
  }

  // The date input gives a day; the time of day stays.
  setDay(day: string) {
    const takenAt = withDay(this.value.takenAt, day);
    if (takenAt) this.edit({ takenAt });
  }

  // The caller asks before dropping unsaved edits (LEAVE_QUESTION).
  open(id: string) {
    if (this.switching) return;
    const photo = this.photos.find((item) => item.id === id);
    if (!photo) return;
    this.load(photo);
    this.changed();
  }

  close() {
    if (this.switching) return;
    this.load(null);
    this.changed();
  }

  // False when an upload can't start now; the caller then doesn't upload.
  uploadStarted(): boolean {
    if (this.switching || this.blocked) return false;
    this.uploading = true;
    this.status = "idle";
    this.issues = [];
    this.emit();
    return true;
  }

  // The result of uploadPhoto: the new draft opens in the form.
  uploadFinished(result: PhotoActionResult) {
    if (!this.uploading) return;
    this.uploading = false;
    if (result.status === "ok") {
      this.remember(result.photo);
      this.load(result.photo);
      this.status = "uploaded";
      this.issues = [];
    } else if (result.status === "invalid") {
      this.status = "refused";
      this.issues = result.issues;
    } else {
      this.fail(result);
    }
    this.emit();
  }

  private fail(result: Exclude<PhotoActionResult, { status: "ok" }>) {
    if (result.status === "invalid") {
      this.status = "invalid";
      this.issues = result.issues;
      return;
    }
    this.status = result.status;
    this.issues = [];
    if (BLOCKING.includes(result.status)) this.blocked = true;
  }

  private input(): PhotoInput | null {
    return this.editing ? { id: this.editing.id, expected: this.editing.updatedAt, content: this.value } : null;
  }

  // One action at a time; an outcome other than ok keeps the edit.
  private async run(call: () => Promise<PhotoActionResult>, onOk: (photo: StoredPhoto) => void) {
    if (this.switching || this.blocked) return;
    this.busy = true;
    this.emit();
    let result: PhotoActionResult;
    try {
      result = await call();
    } catch {
      result = { status: "unavailable" };
    }
    this.busy = false;
    if (result.status === "ok") {
      this.issues = [];
      onOk(result.photo);
    } else {
      this.fail(result);
    }
    this.emit();
  }

  private keep(photo: StoredPhoto) {
    this.remember(photo);
    this.editing = photo;
    this.baseline = comparable(contentOf(photo));
    this.status = "saved";
  }

  async save() {
    const input = this.input();
    if (!input || !this.snapshot.canSave) return;
    await this.run(() => this.actions.save(input), (photo) => this.keep(photo));
  }

  async primaryAction() {
    const input = this.input();
    if (!input || !this.snapshot.canPrimary) return;
    if (this.editing?.status === "published") {
      await this.run(() => this.actions.save(input), (photo) => this.keep(photo));
      return;
    }
    await this.run(
      () => this.actions.publish(input),
      (photo) => {
        this.remember(photo);
        this.load(null);
        this.status = "published";
      },
    );
  }

  // The caller confirms first.
  async remove() {
    const editing = this.editing;
    if (!editing) return;
    await this.run(
      () => this.actions.remove({ id: editing.id, expected: editing.updatedAt }),
      (photo) => {
        this.photos = this.photos.filter((item) => item.id !== photo.id);
        this.load(null);
        this.status = "deleted";
      },
    );
  }
}

export function statusText(snap: EditorSnapshot): string {
  if (snap.uploading) return "Uploading…";
  if (snap.busy) return "Saving…";
  switch (snap.status) {
    case "conflict":
      return "This photo changed in another tab. Reload to continue.";
    case "missing":
      return "This photo was deleted elsewhere. Reload to continue.";
    case "unauthorized":
      return "Signed out — sign in again.";
    case "unavailable":
      return "Database unavailable — try again.";
  }
  if (snap.status === "refused") return "Can't upload:";
  if (snap.status === "invalid") return "Can't publish yet:";
  if (snap.dirty) return "Unsaved changes";
  if (snap.blocked) return "Database unavailable: photos can't be saved.";
  switch (snap.status) {
    case "uploaded":
      return "Draft saved";
    case "saved":
      return snap.editing?.status === "draft" ? "Draft saved" : "Saved";
    case "published":
      return "Published";
    case "deleted":
      return "Deleted";
    default:
      return "";
  }
}
