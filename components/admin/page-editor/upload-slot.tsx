"use client";

import { useState } from "react";
import type { MediaEntry } from "@/lib/images/lookup";
import { cx } from "@/lib/cx";
import { uploadImage } from "./upload";

// Drop a file on the 16:10 area or pick one. On success the image points at
// the new upload; the error reason stays under the slot until the next try.
export function UploadSlot({
  slug,
  imageId,
  mode,
  hasImage,
  onUploaded,
}: {
  slug: string;
  imageId: string;
  mode: "blob" | "local" | null;
  hasImage: boolean;
  onUploaded: (key: string, entry: MediaEntry) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!mode) return <p className="type-meta text-fg-muted">Uploads are off: no media store is configured.</p>;

  async function handle(file: File | undefined) {
    if (!file || !mode) return;
    setBusy(true);
    setError(null);
    try {
      const result = await uploadImage(file, { slug, imageId }, mode);
      if (result.status === "ok") onUploaded(result.key, result.entry);
      else if (result.status === "invalid") setError(result.issues.map((issue) => issue.message).join(" "));
      else setError(result.status === "unauthorized" ? "Signed out — sign in again." : "The upload failed. Try again.");
    } catch {
      setError("The upload failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          void handle(event.dataTransfer.files[0]);
        }}
        className={cx(
          "flex aspect-[16/10] cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-line p-3 text-center type-meta text-fg-muted",
          over && "border-accent text-accent",
        )}
      >
        <span>{busy ? "Uploading…" : hasImage ? "Drop a new image to replace it, or pick one" : "Drop a 16:10 PNG or JPEG, or pick one"}</span>
        <span className="type-label">2560×1600 recommended · at least 1280px wide</span>
        <input type="file" accept="image/png,image/jpeg" aria-label="Upload image" disabled={busy} className="sr-only" onChange={(event) => void handle(event.target.files?.[0])} />
      </label>
      {error ? (
        <p role="alert" className="mt-1 type-meta text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
