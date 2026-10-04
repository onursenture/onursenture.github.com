"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { discardDraftAction, publishAction, resetDocAction, saveDraftAction } from "@/app/admin/actions";
import { type DocActions, DocSession, type EditorStatus } from "@/lib/admin/doc-session";
import { isSaveShortcut, LEAVE_QUESTION, leavesPage, PREVIEW_SAVE } from "@/lib/admin/leave-guard";
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
  // Waits for the requests in flight without writing.
  idle: () => Promise<void>;
  // Drops the unsaved edit (back to the last stored value).
  abandon: () => void;
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

// Every editor's session that is mounted, or hidden with an unsaved edit: Next
// keeps a route it leaves mounted but hidden (back/forward and router.push
// never pass the link guard), and a hidden editor's own listeners are removed.
// One beforeunload listener asks while any of them has an unsaved edit.
const sessions = new Set<DocSession<unknown>>();
let unloadGuard = false;

function guardUnload() {
  if (unloadGuard) return;
  unloadGuard = true;
  window.addEventListener("beforeunload", (event) => {
    for (const session of sessions) {
      if (session.hasUnsaved) {
        event.preventDefault();
        return;
      }
    }
  });
}

export function useDocEditor<T>(init: DocEditorInit<T>): DocEditor<T> {
  const [session] = useState(() => new DocSession<T>(init, ACTIONS));
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);

  // Leaving with an unsaved change (or a save in flight) warns and never saves:
  // the browser asks before an unload (guardUnload), and an in-app link asks
  // with confirm() (capture phase on window, so it runs before next/link's
  // handler); agreeing drops the edit. Nothing is written when the editor
  // unmounts or is hidden. Cmd/Ctrl+S saves while mounted, also from inside the
  // preview iframe (PreviewFocus forwards it).
  useEffect(() => {
    const own = session as DocSession<unknown>;
    // A newer editor for the same document replaces one left behind.
    for (const other of sessions) if (other.docKey === own.docKey) sessions.delete(other);
    sessions.add(own);
    guardUnload();
    function onClick(event: MouseEvent) {
      if (!session.hasUnsaved || !(event.target instanceof Element)) return;
      const anchor = event.target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const target = { href: anchor.href, target: anchor.target, download: anchor.hasAttribute("download") };
      if (!leavesPage(event, target, window.location.href)) return;
      if (window.confirm(LEAVE_QUESTION)) {
        session.abandon();
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    }
    function trySave() {
      // Not while a request is in flight, nor with nothing to save.
      if (session.getSnapshot().canSave) void session.save();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (!isSaveShortcut(event)) return;
      event.preventDefault();
      trySave();
    }
    function onMessage(event: MessageEvent) {
      if (event.origin === window.location.origin && (event.data as { type?: string })?.type === PREVIEW_SAVE) trySave();
    }
    window.addEventListener("click", onClick, true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("message", onMessage);
      // Hidden with an unsaved edit (Back, router.push): closing the tab still
      // asks. Otherwise the session is done with.
      if (!session.hasUnsaved) sessions.delete(own);
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
    idle: session.idle,
    abandon: session.abandon,
    publish: session.publish,
    discard: () => runAndReload("Discard the draft and go back to the published version?", session.discard),
    reset: () => runAndReload("Reset to the repo version? The published edits are removed from the site.", session.reset),
    report: session.report,
  };
}
