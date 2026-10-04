"use client";

import { Fragment, useSyncExternalStore } from "react";
import { decodeEmail, emailPieces } from "@/lib/resume/email";
import { cx } from "@/lib/cx";

const subscribe = () => () => {};

// Plain pieces in the server HTML and during hydration; a mailto: link after.
export function EmailLink({ code, className }: { code: string; className?: string }) {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const address = decodeEmail(code);
  const text = emailPieces(address).map((piece, index) =>
    piece === "@" || piece === "." ? <span key={index}>{piece}</span> : <Fragment key={index}>{piece}</Fragment>,
  );
  if (!hydrated) return <span className={className}>{text}</span>;
  return (
    <a href={`mailto:${address}`} className={cx("hover:underline hover:underline-offset-[0.2em]", className)}>
      {text}
    </a>
  );
}
