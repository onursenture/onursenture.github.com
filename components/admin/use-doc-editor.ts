"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { discardDraftAction, publishAction, resetDocAction, saveDraftAction } from "@/app/admin/actions";
import { type DocActions, DocSession, type EditorStatus } from "@/lib/admin/doc-session";
import type { DocEditorInit } from "@/lib/admin/results";
import type { Issue } from "@/lib/content/issues";
import type { DocKey } from "@/lib/content/keys";

// React binding for DocSession (lib/admin/doc-session.ts holds the rules:
// autosave, ordering of save and publish, retry, concurrency).

export { AUTOSAVE_MS } from "@/lib/admin/doc-session";
export type { EditorStatus };

export interface DocEditorState {
  docKey: DocKey;
  status: EditorStatus;
  hasDraft: boolean;
  savedAt: string | null;
  publishedAt: string | null;
  issues: Issue[];
  previewVersion: number;
  canPublish: boolean;
  blocked: boolean;
  retrying: boolean;
  flush: () => Promise<void>;
  publish: () => Promise<void>;
  discard: () => Promise<void>;
  reset: () => Promise<void>;
  // Show issues that came from another action (delete page, upload).
  report: (issues: Issue[]) => void;
}

export interface DocEditor<T> extends DocEditorState {
  value: T;
  setValue: (update: (previous: T) => T) => void;
}

const ACTIONS: DocActions = {
  save: saveDraftAction,
  publish: publishAction,
  discard: discardDraftAction,
  reset: resetDocAction,
};

export function useDocEditor<T>(init: DocEditorInit<T>): DocEditor<T> {
  const [session] = useState(() => new DocSession<T>(init, ACTIONS));
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);

  // Leaving with an unsaved change: save it and let the browser ask. An
  // in-app navigation unmounts the editor, which saves the same way.
  useEffect(() => {
    session.attach();
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!session.hasUnsaved) return;
      void session.flush();
      event.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      void session.flush();
      session.dispose();
    };
  }, [session]);

  async function runAndReload(question: string, run: () => Promise<{ status: string }>) {
    if (!window.confirm(question)) return;
    const result = await run();
    if (result.status === "ok") window.location.reload();
    else session.failed(result as Parameters<typeof session.failed>[0]);
  }

  return {
    docKey: session.docKey,
    ...snapshot,
    setValue: session.setValue,
    flush: session.flush,
    publish: session.publish,
    discard: () => runAndReload("Discard the draft and go back to the published version?", session.discard),
    reset: () => runAndReload("Reset to the repo version? The published edits are removed from the site.", session.reset),
    report: session.report,
  };
}
