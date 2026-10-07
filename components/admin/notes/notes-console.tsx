"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { deleteNoteAction, publishNoteAction, saveNoteAction, scheduleNoteAction, unscheduleNoteAction } from "@/app/admin/notes-actions";
import { LEAVE_QUESTION, isSaveShortcut } from "@/lib/admin/leave-guard";
import { type NoteActions, NoteComposerState } from "@/lib/admin/note-composer";
import type { NotesConsoleInit } from "@/lib/admin/notes";
import type { NoteSide } from "@/lib/notes/types";
import { useConfirm } from "../confirm-dialog";
import { useLeaveGuard } from "../use-leave-guard";
import { ComposeBox } from "./compose-box";
import { type Filter, Timeline } from "./timeline";

const ACTIONS: NoteActions = {
  save: saveNoteAction,
  publish: publishNoteAction,
  schedule: scheduleNoteAction,
  unschedule: unscheduleNoteAction,
  remove: deleteNoteAction,
};

// The side a new note starts on, remembered per browser (spec §4.1).
const SIDE_KEY = "notes.lastSide";

function readSide(): NoteSide {
  try {
    const side = window.localStorage.getItem(SIDE_KEY);
    return side === "life" || side === "both" ? side : "work";
  } catch {
    return "work";
  }
}

// /admin/notes/ (mockup B): the compose box on top, the timeline below. Leaving
// with an unsaved note asks first (in-page dialog) and never saves (Sprint 7
// rule); Cmd/Ctrl+S saves; closing the tab asks too.
export function NotesConsole({ init }: { init: NotesConsoleInit }) {
  const [composer] = useState(() => new NoteComposerState({ notes: init.notes, available: init.available, side: "work" }, ACTIONS));
  const snap = useSyncExternalStore(composer.subscribe, composer.getSnapshot, composer.getSnapshot);
  const [filter, setFilter] = useState<Filter>("all");
  const confirm = useConfirm();
  // True once a link click was answered "Leave": the navigation may become a
  // full page load, and the browser must not ask again then.
  const isLeaving = useLeaveGuard(() => composer.hasUnsaved);

  useEffect(() => {
    composer.setDefaultSide(readSide());
  }, [composer]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDE_KEY, snap.lastSide);
    } catch {
      // Private mode or blocked storage: the default side is simply Work.
    }
  }, [snap.lastSide]);

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (composer.hasUnsaved && !isLeaving()) event.preventDefault();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (!isSaveShortcut(event)) return;
      event.preventDefault();
      void composer.save();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [composer, isLeaving]);

  async function leaveCurrent(): Promise<boolean> {
    return !composer.hasUnsaved || confirm({ question: LEAVE_QUESTION, confirmLabel: "Leave" });
  }

  return (
    <main className="mx-auto flex w-full max-w-[720px] flex-col gap-8 px-4 py-6">
      <nav aria-label="Breadcrumb" className="type-meta text-fg-muted">
        <Link href="/admin/" className="hover:text-fg">
          Admin
        </Link>{" "}
        / <span className="text-fg">Notes</span>
      </nav>
      <ComposeBox
        composer={composer}
        snap={snap}
        uploadMode={init.uploadMode}
        onNew={async () => {
          if (await leaveCurrent()) composer.startNew();
        }}
      />
      <Timeline
        notes={snap.notes}
        filter={filter}
        onFilter={setFilter}
        activeId={snap.editing?.id ?? null}
        disabled={snap.busy || snap.uploads > 0}
        onOpen={async (id) => {
          if (!(await leaveCurrent())) return;
          composer.open(id);
          window.scrollTo({ top: 0 });
        }}
      />
    </main>
  );
}
