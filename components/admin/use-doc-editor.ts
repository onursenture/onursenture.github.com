"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { discardDraftAction, publishAction, resetDocAction, saveDraftAction } from "@/app/admin/actions";
import { type DocActions, DocSession, type EditorStatus } from "@/lib/admin/doc-session";
import { isSaveShortcut, LEAVE_QUESTION, leavesPage } from "@/lib/admin/leave-guard";
import type { DocEditorInit } from "@/lib/admin/results";
import type { Issue } from "@/lib/content/issues";
import type { DocKey } from "@/lib/content/keys";

// React binding for DocSession (lib/admin/doc-session.ts holds the rules:
// manual save, ordering of save and publish, concurrency), plus the window
// listeners: Cmd/Ctrl+S saves, and leaving with unsaved changes warns.

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
  canSave: boolean;
  save: () => Promise<void>;
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

  // Leaving with an unsaved change (or a save in flight) warns and never saves:
  // the browser asks before an unload, and an in-app link asks with confirm()
  // (capture phase on window, so it runs before next/link's handler). Nothing
  // is written when the editor unmounts. Cmd/Ctrl+S saves while mounted.
  useEffect(() => {
    // Set once the user agreed to leave through a link, so a link that
    // reloads the document isn't asked about twice.
    let leaving = false;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (leaving || !session.hasUnsaved) return;
      event.preventDefault();
    }
    function onClick(event: MouseEvent) {
      if (!session.hasUnsaved || !(event.target instanceof Element)) return;
      const anchor = event.target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const target = { href: anchor.href, target: anchor.target, download: anchor.hasAttribute("download") };
      if (!leavesPage(event, target, window.location.href)) return;
      if (window.confirm(LEAVE_QUESTION)) {
        leaving = true;
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (!isSaveShortcut(event)) return;
      event.preventDefault();
      // Not while a save is in flight, nor with nothing to save.
      if (session.getSnapshot().canSave) void session.save();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("click", onClick, true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("keydown", onKeyDown);
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
    save: session.save,
    publish: session.publish,
    discard: () => runAndReload("Discard the draft and go back to the published version?", session.discard),
    reset: () => runAndReload("Reset to the repo version? The published edits are removed from the site.", session.reset),
    report: session.report,
  };
}
