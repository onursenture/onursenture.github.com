"use client";

import { useId, useState } from "react";
import { fetchLinkCardAction } from "@/app/admin/notes-actions";
import { PictureView } from "@/components/picture-view";
import { Button, buttonClass } from "@/components/ui/button";
import type { ComposerSnapshot, NoteComposerState } from "@/lib/admin/note-composer";
import { cx } from "@/lib/cx";
import { MAX_IMAGES } from "@/lib/notes/types";
import { CONTROL } from "../fields";
import { uploadNoteImage } from "./note-upload";

// One attachment per note: up to four images (alt text required to publish)
// or one link card. Switching kinds asks first when the other has content.
export function Attachments({
  composer,
  snap,
  uploadMode,
  disabled,
}: {
  composer: NoteComposerState;
  snap: ComposerSnapshot;
  uploadMode: "blob" | "local" | null;
  disabled: boolean;
}) {
  const embed = snap.value.embed;
  const images = embed?.kind === "images" ? embed.images : [];
  const [linkOpen, setLinkOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showLink = linkOpen || embed?.kind === "link";
  const altId = useId();

  async function pick(list: FileList | null) {
    if (!list || !uploadMode) return;
    if (composer.getSnapshot().value.embed?.kind === "link" && !window.confirm("Replace the link card with images?")) return;
    setLinkOpen(false);
    setError(null);
    const room = MAX_IMAGES - images.length;
    for (const file of Array.from(list).slice(0, room)) {
      composer.uploadStarted();
      try {
        const result = await uploadNoteImage(file, uploadMode);
        if (result.status === "ok") composer.addImage(result.image);
        else if (result.status === "invalid") setError(result.issues.map((issue) => issue.message).join(" "));
        else setError(result.status === "unauthorized" ? "Signed out — sign in again." : "The upload failed. Try again.");
      } catch {
        setError("The upload failed. Try again.");
      } finally {
        composer.uploadFinished();
      }
    }
  }

  function openLink() {
    if (images.length > 0 && !window.confirm("Replace the images with a link card?")) return;
    if (images.length > 0) composer.setLink(null);
    setLinkOpen(true);
  }

  const full = images.length >= MAX_IMAGES;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {uploadMode ? (
          <label className={cx(buttonClass("ghost"), "relative cursor-pointer", (disabled || full) && "pointer-events-none opacity-40")}>
            Images
            <input
              type="file"
              accept="image/*"
              multiple
              aria-label="Add images"
              disabled={disabled || full}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              onChange={(event) => {
                void pick(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
        ) : (
          <span className="type-meta text-fg-muted">Uploads are off: no media store is configured.</span>
        )}
        <Button variant="ghost" onClick={openLink} disabled={disabled || embed?.kind === "link"}>
          Link
        </Button>
      </div>
      {error ? (
        <p role="alert" className="type-meta text-danger">
          {error}
        </p>
      ) : null}
      {images.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((image, index) => (
            <li key={`${index}-${image.key}`} className="flex flex-col gap-1">
              <div className="relative aspect-square overflow-hidden border">
                <PictureView image={image.key} entry={image} alt="" sizes="160px" className="block h-full w-full object-cover" />
                <button
                  type="button"
                  aria-label={`Remove image ${index + 1}`}
                  onClick={() => composer.removeImage(index)}
                  disabled={disabled}
                  className="absolute top-1 right-1 h-7 w-7 bg-bg type-body text-fg"
                >
                  ×
                </button>
              </div>
              {/* Not wrapped: a wrapped textarea's text would become part of the label's name. */}
              <div className="flex flex-col gap-1">
                <label htmlFor={`${altId}-${index}`} className="type-label text-fg-muted">
                  Alt text {index + 1}
                </label>
                <textarea
                  id={`${altId}-${index}`}
                  rows={2}
                  value={image.alt}
                  disabled={disabled}
                  onChange={(event) => composer.setAlt(index, event.target.value)}
                  className={cx(CONTROL, "resize-y")}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {showLink ? <LinkField composer={composer} snap={snap} disabled={disabled} onClose={() => setLinkOpen(false)} /> : null}
    </div>
  );
}

function LinkField({ composer, snap, disabled, onClose }: { composer: NoteComposerState; snap: ComposerSnapshot; disabled: boolean; onClose: () => void }) {
  const card = snap.value.embed?.kind === "link" ? snap.value.embed : null;
  const [url, setUrl] = useState(card?.url ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchCard() {
    setBusy(true);
    setError(null);
    try {
      const result = await fetchLinkCardAction(url);
      if (result.status === "ok") composer.setLink(result.card);
      else setError(result.status === "invalid" ? result.issues[0].message : "Signed out — sign in again.");
    } catch {
      setError("Fetching the card failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-2">
        <label className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="type-label text-fg-muted">Link URL</span>
          <input type="url" inputMode="url" value={url} disabled={disabled} onChange={(event) => setUrl(event.target.value)} className={CONTROL} />
        </label>
        <Button variant="ghost" onClick={() => void fetchCard()} disabled={disabled || busy || url.trim() === ""}>
          {busy ? "Fetching…" : "Fetch card"}
        </Button>
      </div>
      {error ? (
        <p role="alert" className="type-meta text-danger">
          {error}
        </p>
      ) : null}
      {card ? (
        <div className="flex items-start justify-between gap-3 border px-3 py-2">
          <div className="min-w-0">
            <p className="truncate type-body">{card.title || card.url}</p>
            <p className="type-meta text-fg-muted">{card.siteName}</p>
          </div>
          <Button
            variant="text"
            disabled={disabled}
            onClick={() => {
              composer.setLink(null);
              setUrl("");
              onClose();
            }}
          >
            Remove link
          </Button>
        </div>
      ) : null}
    </div>
  );
}
