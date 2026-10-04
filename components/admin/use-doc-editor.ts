"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { discardDraftAction, publishAction, resetDocAction, saveDraftAction } from "@/app/admin/actions";
import type { ActionResult, DocEditorInit } from "@/lib/admin/results";
import type { Issue } from "@/lib/content/issues";
import type { DocKey } from "@/lib/content/keys";

// One document's editing session (spec §2.3): local state, autosave ~1s after
// the last change (one save in flight at a time, the latest value wins),
// optimistic concurrency through draftUpdatedAt, publish/discard/reset, and a
// preview version that bumps after each save so the preview reloads.

export const AUTOSAVE_MS = 1000;

export type EditorStatus =
  | "idle"
  | "dirty"
  | "saving"
  | "saved"
  | "publishing"
  | "published"
  | "conflict"
  | "signed-out"
  | "unavailable"
  | "invalid";

export interface DocEditorState {
  docKey: DocKey;
  status: EditorStatus;
  hasDraft: boolean;
  savedAt: string | null;
  publishedAt: string | null;
  issues: Issue[];
  previewVersion: number;
  canPublish: boolean;
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

const BLOCKING: EditorStatus[] = ["conflict", "signed-out", "unavailable"];

export function useDocEditor<T>(init: DocEditorInit<T>): DocEditor<T> {
  const { docKey } = init;
  const [value, setValueState] = useState<T>(init.value);
  const [status, setStatus] = useState<EditorStatus>(init.available ? "idle" : "unavailable");
  const [hasDraft, setHasDraft] = useState(init.hasDraft);
  const [savedAt, setSavedAt] = useState(init.draftUpdatedAt);
  const [publishedAt, setPublishedAt] = useState(init.publishedAt);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [previewVersion, setPreviewVersion] = useState(0);

  const valueRef = useRef(init.value);
  const expected = useRef(init.draftUpdatedAt);
  const pending = useRef(false);
  const blocked = useRef(!init.available);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chain = useRef<Promise<void>>(Promise.resolve());

  const fail = useCallback((result: ActionResult) => {
    if (result.status === "invalid") {
      setIssues(result.issues);
      setStatus("invalid");
      return;
    }
    const next: EditorStatus = result.status === "conflict" ? "conflict" : result.status === "unauthorized" ? "signed-out" : "unavailable";
    blocked.current = BLOCKING.includes(next);
    setStatus(next);
  }, []);

  const flush = useCallback((): Promise<void> => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    chain.current = chain.current.then(async () => {
      if (!pending.current || blocked.current) return;
      pending.current = false;
      setStatus("saving");
      const result = await saveDraftAction(docKey, valueRef.current, expected.current).catch(() => ({ status: "unavailable" as const }));
      if (result.status !== "ok") return fail(result);
      expected.current = result.draftUpdatedAt;
      setSavedAt(result.draftUpdatedAt);
      setHasDraft(true);
      setStatus(pending.current ? "dirty" : "saved");
      setPreviewVersion((version) => version + 1);
    });
    return chain.current;
  }, [docKey, fail]);

  const setValue = useCallback(
    (update: (previous: T) => T) => {
      const next = update(valueRef.current);
      valueRef.current = next;
      pending.current = true;
      setValueState(next);
      if (!blocked.current) setStatus("dirty");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), AUTOSAVE_MS);
    },
    [flush],
  );

  const publish = useCallback(async () => {
    await flush();
    if (blocked.current) return;
    setStatus("publishing");
    const result = await publishAction(docKey).catch(() => ({ status: "unavailable" as const }));
    if (result.status !== "ok") return fail(result);
    expected.current = null;
    setIssues([]);
    setHasDraft(false);
    setSavedAt(null);
    setPublishedAt(result.publishedAt);
    setStatus("published");
    setPreviewVersion((version) => version + 1);
  }, [docKey, flush, fail]);

  const runAndReload = useCallback(
    async (question: string, action: (key: string) => Promise<ActionResult>) => {
      if (!window.confirm(question)) return;
      if (timer.current) clearTimeout(timer.current);
      pending.current = false;
      await chain.current;
      const result = await action(docKey).catch((): ActionResult => ({ status: "unavailable" }));
      if (result.status === "ok") window.location.reload();
      else fail(result);
    },
    [docKey, fail],
  );

  const discard = useCallback(() => runAndReload("Discard the draft and go back to the published version?", discardDraftAction), [runAndReload]);
  const reset = useCallback(() => runAndReload("Reset to the repo version? The published edits are removed from the site.", resetDocAction), [runAndReload]);
  const report = useCallback((next: Issue[]) => {
    setIssues(next);
    if (next.length) setStatus("invalid");
  }, []);

  // Leaving with an unsaved change: save it and let the browser ask.
  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!pending.current) return;
      void flush();
      event.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [flush]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const busy = status === "saving" || status === "publishing" || status === "invalid" || BLOCKING.includes(status);
  return {
    docKey,
    value,
    setValue,
    status,
    hasDraft,
    savedAt,
    publishedAt,
    issues,
    previewVersion,
    canPublish: !busy && (hasDraft || status === "dirty"),
    flush,
    publish,
    discard,
    reset,
    report,
  };
}
