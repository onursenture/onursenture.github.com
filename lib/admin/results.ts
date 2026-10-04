import type { Issue } from "@/lib/content/issues";
import type { DocKey } from "@/lib/content/keys";

// What admin operations return. Plain data (ISO strings, no Dates), so server
// actions can hand it to client components unchanged.
export type OpResult<T extends object = object> = ({ status: "ok" } & T) | { status: "conflict" } | { status: "invalid"; issues: Issue[] };

// A server action adds the two outcomes that only exist at the request level.
export type ActionResult<T extends object = object> = OpResult<T> | { status: "unauthorized" } | { status: "unavailable" };

// What an editor page hands its client editor.
export interface DocEditorInit<T> {
  docKey: DocKey;
  // The draft, else the published value, else the repo value.
  value: T;
  draftUpdatedAt: string | null;
  hasDraft: boolean;
  publishedAt: string | null;
  // False without a database: the editor shows the content but can't save.
  available: boolean;
  // The loaded value differs from the stored one (e.g. resume roles aligned to
  // Experience): start with it as an unsaved edit.
  dirty?: boolean;
}
