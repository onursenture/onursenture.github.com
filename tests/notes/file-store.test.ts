import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FileNoteStore, notesFileFor } from "@/lib/notes/file-store";
import { describeNoteStore } from "../helpers/note-store-contract";

describeNoteStore("FileNoteStore", async () => new FileNoteStore(join(mkdtempSync(join(tmpdir(), "notes-")), "content.notes.json")));

describe("notesFileFor", () => {
  it("puts the notes next to the content store file", () => {
    expect(notesFileFor(".e2e-admin/content.json")).toBe(".e2e-admin/content.notes.json");
    expect(notesFileFor("store")).toBe("store.notes.json");
  });
});
