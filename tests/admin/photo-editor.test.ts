import { describe, expect, it, vi } from "vitest";
import { type PhotoActions, PhotoEditorState, statusText } from "@/lib/admin/photo-editor";
import type { PhotoActionResult } from "@/lib/photos/operations";
import type { StoredPhoto } from "@/lib/photos/types";

const image = { key: "media/photos/a", width: 2560, height: 1920, widths: [640, 1280, 2560], baseUrl: "/api/media-dev/media/photos/a" };

function stored(patch: Partial<StoredPhoto> = {}): StoredPhoto {
  return {
    id: "p1",
    slug: null,
    title: "",
    alt: "",
    takenAt: "2026-08-17T18:42:10",
    camera: "Fujifilm X100VI",
    image,
    exif: { takenAt: "2026-08-17T18:42:10", camera: "Fujifilm X100VI" },
    status: "draft",
    publishedAt: null,
    createdAt: "2026-10-05T10:00:00.000Z",
    updatedAt: "2026-10-05T10:00:00.000Z",
    ...patch,
  };
}

const live = (patch: Partial<StoredPhoto> = {}) =>
  stored({ id: "p2", slug: "stabilo", title: "Stabilo", status: "published", publishedAt: "2026-04-11T12:00:00.000Z", takenAt: "2026-04-11T12:00:00", ...patch });

function deferred() {
  let resolve!: (value: PhotoActionResult) => void;
  const promise = new Promise<PhotoActionResult>((r) => (resolve = r));
  return { promise, resolve };
}

function actions(patch: Partial<PhotoActions> = {}): PhotoActions {
  return {
    save: vi.fn(async (input) => ({ status: "ok" as const, photo: stored({ ...(input.content as object), id: input.id, updatedAt: "2026-10-05T10:01:00.000Z" }) })),
    publish: vi.fn(async (input) => ({ status: "ok" as const, photo: stored({ ...(input.content as object), id: input.id, slug: "x", status: "published", publishedAt: "2026-10-05T10:01:00.000Z" }) })),
    remove: vi.fn(async (ref) => ({ status: "ok" as const, photo: stored({ id: ref.id }) })),
    ...patch,
  };
}

const make = (photos: StoredPhoto[] = [], a = actions(), available = true) => new PhotoEditorState({ photos, available }, a);

describe("PhotoEditorState: list and opening", () => {
  it("lists drafts first, newest edited on top, then published photos in site order", () => {
    const older = stored({ id: "d1", updatedAt: "2026-10-01T00:00:00.000Z" });
    const newer = stored({ id: "d2", updatedAt: "2026-10-04T00:00:00.000Z" });
    const april = live({ id: "l1", takenAt: "2026-04-11T12:00:00" });
    const sept = live({ id: "l2", slug: "night", takenAt: "2026-09-12T21:40:00" });
    expect(make([april, older, sept, newer]).getSnapshot().photos.map((p) => p.id)).toEqual(["d2", "d1", "l2", "l1"]);
  });

  it("opens a photo into the form, clean, with the EXIF hints on", () => {
    const editor = make([stored()]);
    editor.open("p1");
    const snap = editor.getSnapshot();
    expect(snap.editing?.id).toBe("p1");
    expect(snap.value).toEqual({ title: "", alt: "", takenAt: "2026-08-17T18:42:10", camera: "Fujifilm X100VI" });
    expect(snap.dirty).toBe(false);
    expect([snap.exifDate, snap.exifCamera]).toEqual([true, true]);
  });

  it("drops a hint once its field no longer matches EXIF", () => {
    const editor = make([stored()]);
    editor.open("p1");
    editor.edit({ camera: "X100VI" });
    editor.setDay("2026-08-20");
    expect(editor.getSnapshot().value.takenAt).toBe("2026-08-20T18:42:10");
    expect([editor.getSnapshot().exifDate, editor.getSnapshot().exifCamera]).toEqual([false, false]);
  });

  it("ignores an invalid day", () => {
    const editor = make([stored()]);
    editor.open("p1");
    editor.setDay("");
    expect(editor.getSnapshot().value.takenAt).toBe("2026-08-17T18:42:10");
    expect(editor.getSnapshot().dirty).toBe(false);
  });

  it("does nothing with no photo open", () => {
    const editor = make([stored()]);
    editor.edit({ title: "x" });
    expect(editor.getSnapshot().dirty).toBe(false);
    expect(editor.getSnapshot().canPrimary).toBe(false);
  });
});

describe("PhotoEditorState: buttons", () => {
  it("a draft offers Save draft and Publish; Publish needs a title", () => {
    const editor = make([stored()]);
    editor.open("p1");
    let snap = editor.getSnapshot();
    expect([snap.saveLabel, snap.primaryLabel, snap.canSave, snap.canPrimary]).toEqual(["Save draft", "Publish", false, false]);
    editor.edit({ title: "Kızılcıklı" });
    snap = editor.getSnapshot();
    expect([snap.dirty, snap.canSave, snap.canPrimary]).toEqual([true, true, true]);
  });

  it("a live photo offers only Save, once something changed", () => {
    const editor = make([live()]);
    editor.open("p2");
    expect([editor.getSnapshot().saveLabel, editor.getSnapshot().primaryLabel, editor.getSnapshot().canPrimary]).toEqual([null, "Save", false]);
    editor.edit({ alt: "A pen" });
    expect(editor.getSnapshot().canPrimary).toBe(true);
    editor.edit({ title: "" });
    expect(editor.getSnapshot().canPrimary).toBe(false);
  });

  it("is off everywhere when the store is unavailable", () => {
    const editor = make([stored()], actions(), false);
    editor.open("p1");
    editor.edit({ title: "x" });
    expect([editor.getSnapshot().canSave, editor.getSnapshot().canPrimary, editor.uploadStarted()]).toEqual([false, false, false]);
    expect(statusText(editor.getSnapshot())).toBe("Unsaved changes");
  });
});

describe("PhotoEditorState: writes", () => {
  it("Save draft keeps the photo open and clean", async () => {
    const a = actions();
    const editor = make([stored()], a);
    editor.open("p1");
    editor.edit({ title: "Kızılcıklı" });
    await editor.save();
    expect(a.save).toHaveBeenCalledWith({ id: "p1", expected: "2026-10-05T10:00:00.000Z", content: { title: "Kızılcıklı", alt: "", takenAt: "2026-08-17T18:42:10", camera: "Fujifilm X100VI" } });
    const snap = editor.getSnapshot();
    expect([snap.editing?.updatedAt, snap.dirty, statusText(snap)]).toEqual(["2026-10-05T10:01:00.000Z", false, "Draft saved"]);
  });

  it("Publish closes the form and marks the photo live in the list", async () => {
    const editor = make([stored()]);
    editor.open("p1");
    editor.edit({ title: "Kızılcıklı" });
    await editor.primaryAction();
    const snap = editor.getSnapshot();
    expect([snap.editing, statusText(snap), snap.photos[0].status]).toEqual([null, "Published", "published"]);
  });

  it("Save on a live photo stays open", async () => {
    const a = actions({ save: vi.fn(async () => ({ status: "ok" as const, photo: live({ alt: "A pen", updatedAt: "2026-10-05T10:02:00.000Z" }) })) });
    const editor = make([live()], a);
    editor.open("p2");
    editor.edit({ alt: "A pen" });
    await editor.primaryAction();
    expect(a.save).toHaveBeenCalled();
    expect([editor.getSnapshot().editing?.id, statusText(editor.getSnapshot())]).toEqual(["p2", "Saved"]);
  });

  it("Delete removes the photo and closes the form", async () => {
    const editor = make([stored(), live()]);
    editor.open("p1");
    await editor.remove();
    const snap = editor.getSnapshot();
    expect([snap.editing, snap.photos.map((p) => p.id), statusText(snap)]).toEqual([null, ["p2"], "Deleted"]);
  });

  it("an invalid result keeps the edit and shows the issues", async () => {
    const editor = make([stored()], actions({ publish: vi.fn(async () => ({ status: "invalid" as const, issues: [{ at: "title", message: "Add a title." }] })) }));
    editor.open("p1");
    editor.edit({ title: "x" });
    await editor.primaryAction();
    const snap = editor.getSnapshot();
    expect([snap.editing?.id, snap.dirty, statusText(snap), snap.issues]).toEqual(["p1", true, "Can't publish yet:", [{ at: "title", message: "Add a title." }]]);
    editor.edit({ title: "y" });
    expect(editor.getSnapshot().issues).toEqual([]);
  });

  it("a conflict blocks further writes until a reload", async () => {
    const editor = make([stored()], actions({ save: vi.fn(async () => ({ status: "conflict" as const })) }));
    editor.open("p1");
    editor.edit({ title: "x" });
    await editor.save();
    editor.edit({ title: "y" });
    const snap = editor.getSnapshot();
    expect([snap.blocked, snap.canSave, statusText(snap)]).toEqual([true, false, "This photo changed in another tab. Reload to continue."]);
  });

  it("a thrown action reads as unavailable", async () => {
    const editor = make([stored()], actions({ save: vi.fn(async () => Promise.reject(new Error("network"))) }));
    editor.open("p1");
    editor.edit({ title: "x" });
    await editor.save();
    expect(statusText(editor.getSnapshot())).toBe("Database unavailable — try again.");
  });
});

describe("PhotoEditorState: one thing at a time", () => {
  it("runs one write at a time and ignores switching while it runs", async () => {
    const pending = deferred();
    const a = actions({ save: vi.fn(() => pending.promise) });
    const editor = make([stored(), stored({ id: "p3" })], a);
    editor.open("p1");
    editor.edit({ title: "x" });
    const saving = editor.save();
    expect([editor.getSnapshot().busy, editor.hasUnsaved, statusText(editor.getSnapshot())]).toEqual([true, true, "Saving…"]);
    await editor.save();
    await editor.primaryAction();
    editor.open("p3");
    editor.close();
    expect(a.save).toHaveBeenCalledTimes(1);
    expect(editor.getSnapshot().editing?.id).toBe("p1");
    pending.resolve({ status: "ok", photo: stored({ title: "x", updatedAt: "2026-10-05T10:09:00.000Z" }) });
    await saving;
    expect(editor.getSnapshot().busy).toBe(false);
  });

  it("an upload blocks writes and switching, then opens the new draft", async () => {
    const editor = make([live()]);
    editor.open("p2");
    expect(editor.uploadStarted()).toBe(true);
    expect(editor.uploadStarted()).toBe(false);
    expect([editor.getSnapshot().uploading, editor.hasUnsaved, statusText(editor.getSnapshot())]).toEqual([true, true, "Uploading…"]);
    editor.close();
    expect(editor.getSnapshot().editing?.id).toBe("p2");
    editor.uploadFinished({ status: "ok", photo: stored({ id: "new" }) });
    const snap = editor.getSnapshot();
    expect([snap.editing?.id, snap.photos[0].id, statusText(snap), snap.dirty]).toEqual(["new", "new", "Draft saved", false]);
  });

  it("a refused upload shows why and opens nothing", () => {
    const editor = make([]);
    editor.uploadStarted();
    editor.uploadFinished({ status: "invalid", issues: [{ at: "image", message: "The image is 800×600; photos need at least 1280px on the long side." }] });
    const snap = editor.getSnapshot();
    expect([snap.editing, statusText(snap), snap.issues.length]).toEqual([null, "Can't upload:", 1]);
  });

  it("a write can't start during an upload", async () => {
    const a = actions();
    const editor = make([stored()], a);
    editor.open("p1");
    editor.edit({ title: "x" });
    editor.uploadStarted();
    await editor.save();
    await editor.remove();
    expect(a.save).not.toHaveBeenCalled();
    expect(a.remove).not.toHaveBeenCalled();
  });

  it("notifies subscribers with a new snapshot on every change", () => {
    const editor = make([stored()]);
    const listener = vi.fn();
    editor.subscribe(listener);
    const before = editor.getSnapshot();
    editor.open("p1");
    expect(listener).toHaveBeenCalled();
    expect(editor.getSnapshot()).not.toBe(before);
  });
});

describe("PhotoEditorState: guards and outcomes", () => {
  it("edits are ignored while a save is in flight (value unchanged, dirty unchanged)", async () => {
    const pending = deferred();
    const a = actions({ save: vi.fn(() => pending.promise) });
    const editor = make([stored()], a);
    editor.open("p1");
    editor.edit({ title: "first" });
    const saving = editor.save();
    const beforeEdit = editor.getSnapshot().value.title;
    editor.edit({ title: "second" });
    expect(editor.getSnapshot().value.title).toBe(beforeEdit);
    pending.resolve({ status: "ok", photo: stored({ title: "first", updatedAt: "2026-10-05T10:02:00.000Z" }) });
    await saving;
  });

  it("edits are ignored while an upload is running (value unchanged, dirty unchanged)", async () => {
    const editor = make([live()]);
    editor.open("p2");
    editor.uploadStarted();
    const beforeEdit = editor.getSnapshot().value.alt;
    editor.edit({ alt: "new alt" });
    expect(editor.getSnapshot().value.alt).toBe(beforeEdit);
    editor.uploadFinished({ status: "ok", photo: stored({ id: "new" }) });
  });

  it("a second save after a successful save sends the new updatedAt as expected", async () => {
    const a = actions();
    const editor = make([stored()], a);
    editor.open("p1");
    editor.edit({ title: "first" });
    await editor.save();
    expect(a.save).toHaveBeenNthCalledWith(1, expect.objectContaining({ expected: "2026-10-05T10:00:00.000Z" }));
    editor.edit({ title: "second" });
    await editor.save();
    expect(a.save).toHaveBeenNthCalledWith(2, expect.objectContaining({ expected: "2026-10-05T10:01:00.000Z" }));
  });

  it("a refused upload while a photo is open shows 'Can't upload:' and keeps that photo open, and the next edit clears the issues", () => {
    const editor = make([stored()]);
    editor.open("p1");
    editor.uploadStarted();
    editor.uploadFinished({ status: "invalid", issues: [{ at: "image", message: "too small" }] });
    const snap = editor.getSnapshot();
    expect([snap.editing?.id, statusText(snap), snap.issues.length]).toEqual(["p1", "Can't upload:", 1]);
    editor.edit({ title: "x" });
    expect(editor.getSnapshot().issues).toEqual([]);
  });

  it("an invalid write result on a draft shows 'Can't publish yet:'", async () => {
    const editor = make([stored()], actions({ publish: vi.fn(async () => ({ status: "invalid" as const, issues: [{ at: "title", message: "required" }] })) }));
    editor.open("p1");
    editor.edit({ title: "x" });
    await editor.primaryAction();
    expect(statusText(editor.getSnapshot())).toBe("Can't publish yet:");
  });

  it("uploadFinished without uploadStarted changes nothing (same snapshot object)", () => {
    const editor = make([]);
    const before = editor.getSnapshot();
    editor.uploadFinished({ status: "ok", photo: stored() });
    expect(editor.getSnapshot()).toBe(before);
  });
});
