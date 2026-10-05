"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { deletePhotoAction, publishPhotoAction, savePhotoAction } from "@/app/admin/photos-actions";
import { LEAVE_QUESTION, isSaveShortcut, leavesPage } from "@/lib/admin/leave-guard";
import { type PhotoActions, PhotoEditorState, statusText } from "@/lib/admin/photo-editor";
import type { PhotosConsoleInit } from "@/lib/admin/photos";
import { cx } from "@/lib/cx";
import type { PhotoActionResult } from "@/lib/photos/operations";
import { PhotoForm } from "./photo-form";
import { PhotoList } from "./photo-list";
import { uploadPhoto } from "./photo-upload";

// False while the server HTML is hydrating, true after: the file input only
// exists once its onChange is attached, so a pick can never land before React.
const noSubscribe = () => () => {};
const useHydrated = () =>
  useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );

const ACTIONS: PhotoActions = {
  save: savePhotoAction,
  publish: publishPhotoAction,
  remove: deletePhotoAction,
};

// /admin/photos/ (mockup A, phone-first): "+ Add photo" on top, the open
// photo's form under it, every photo below. Leaving with unsaved changes asks
// first and never saves (Sprint 7 rule); Cmd/Ctrl+S saves; closing the tab
// asks too.
export function PhotosConsole({ init }: { init: PhotosConsoleInit }) {
  const [editor] = useState(() => new PhotoEditorState({ photos: init.photos, available: init.available }, ACTIONS));
  const snap = useSyncExternalStore(editor.subscribe, editor.getSnapshot, editor.getSnapshot);

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (editor.hasUnsaved) event.preventDefault();
    }
    function onClick(event: MouseEvent) {
      if (!editor.hasUnsaved || !(event.target instanceof Element)) return;
      const anchor = event.target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const target = {
        href: anchor.href,
        target: anchor.target,
        download: anchor.hasAttribute("download"),
      };
      if (!leavesPage(event, target, window.location.href)) return;
      if (window.confirm(LEAVE_QUESTION)) return;
      event.preventDefault();
      event.stopPropagation();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (!isSaveShortcut(event)) return;
      event.preventDefault();
      // On a live photo, Save is the primary action.
      void (editor.getSnapshot().editing?.status === "published" ? editor.primaryAction() : editor.save());
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("click", onClick, true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [editor]);

  function leaveCurrent(): boolean {
    return !editor.hasUnsaved || window.confirm(LEAVE_QUESTION);
  }

  async function pick(file: File | undefined) {
    if (!file || !init.uploadMode || !leaveCurrent()) return;
    if (!editor.uploadStarted()) return;
    let result: PhotoActionResult;
    try {
      result = await uploadPhoto(file, init.uploadMode);
    } catch {
      result = { status: "unavailable" };
    }
    editor.uploadFinished(result);
    window.scrollTo({ top: 0 });
  }

  const hydrated = useHydrated();
  const adding = snap.busy || snap.uploading || snap.blocked;
  return (
    <main className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-4 py-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <nav aria-label="Breadcrumb" className="type-meta text-fg-muted">
          <Link href="/admin/" className="hover:text-fg">
            Admin
          </Link>{" "}
          / <span className="text-fg">Photos</span>
        </nav>
        <p role="status" className="type-meta text-fg-muted">
          {statusText(snap)}
        </p>
      </div>
      {init.uploadMode ? (
        <label
          className={cx(
            "relative flex min-h-16 cursor-pointer items-center justify-center rounded-control border border-dashed type-body text-accent",
            adding && "pointer-events-none opacity-40",
          )}
        >
          {snap.uploading ? "Uploading…" : "+ Add photo"}
          {hydrated ? (
            <input
              type="file"
              accept="image/*"
              aria-label="Add photo"
              disabled={adding}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                void pick(file);
              }}
            />
          ) : null}
        </label>
      ) : (
        <p className="type-meta text-fg-muted">Uploads are off: no media storage is configured.</p>
      )}
      {snap.issues.length > 0 ? (
        <ul className="flex flex-col gap-0.5 type-meta text-danger">
          {snap.issues.map((issue) => (
            <li key={`${issue.at}-${issue.message}`}>{issue.message}</li>
          ))}
        </ul>
      ) : null}
      <PhotoForm
        key={snap.generation}
        editor={editor}
        snap={snap}
        onClose={() => {
          if (leaveCurrent()) editor.close();
        }}
      />
      <PhotoList
        photos={snap.photos}
        activeId={snap.editing?.id ?? null}
        disabled={snap.busy || snap.uploading}
        onOpen={(id) => {
          if (!leaveCurrent()) return;
          editor.open(id);
          window.scrollTo({ top: 0 });
        }}
      />
    </main>
  );
}
