"use client";

import Link from "next/link";
import { type ReactNode, useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { cx } from "@/lib/cx";
import { DocToolbar } from "./doc-toolbar";
import { IssuesList } from "./issues-list";
import { PreviewPane } from "./preview-pane";
import type { DocEditorState } from "./use-doc-editor";

// Mockup option A: a toolbar, then the form (440px) beside the live draft
// preview. Below lg (1024px) the two become Form / Preview tabs.
export function EditorFrame({
  crumbs,
  editor,
  preview,
  focusId = null,
  openHref,
  extraActions,
  hideDiscard,
  children,
}: {
  crumbs: string[];
  editor: DocEditorState;
  preview?: string;
  focusId?: string | null;
  openHref?: string;
  extraActions?: ReactNode;
  hideDiscard?: boolean;
  children: ReactNode;
}) {
  const [tab, setTab] = useState<"form" | "preview">("form");
  return (
    <div className="flex h-[calc(100dvh-3rem)] flex-col">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-4 py-2">
        <nav aria-label="Breadcrumb" className="type-meta text-fg-muted">
          <Link href="/admin/" className="hover:text-fg">
            Admin
          </Link>
          {crumbs.map((crumb) => (
            <span key={crumb}>
              {" / "}
              <span className="text-fg">{crumb}</span>
            </span>
          ))}
        </nav>
        <div className="ml-auto">
          <DocToolbar
            editor={editor}
            hideDiscard={hideDiscard}
            extra={
              <>
                {extraActions}
                {openHref ? (
                  <a href={openHref} target="_blank" rel="noopener" className={buttonClass("ghost")}>
                    Open page ↗
                  </a>
                ) : null}
              </>
            }
          />
        </div>
      </div>
      <IssuesList issues={editor.issues} blocking={editor.status === "invalid"} />
      {preview ? (
        <div role="tablist" aria-label="Editor view" className="flex gap-4 border-b border-line px-4 py-1.5 type-meta lg:hidden">
          {(["form", "preview"] as const).map((name) => (
            <button key={name} type="button" role="tab" aria-selected={tab === name} onClick={() => setTab(name)} className={tab === name ? "text-fg underline" : "text-fg-muted"}>
              {name === "form" ? "Form" : "Preview"}
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1">
        {/* `relative`: the column is the containing block for absolutely positioned
            descendants (the `sr-only` file inputs), so they can't land outside the
            overflow box and grow the document. */}
        <div
          className={cx(
            "relative w-full overflow-y-auto p-4",
            preview ? "lg:w-[440px] lg:shrink-0 lg:border-r lg:border-line" : "mx-auto max-w-[720px]",
            preview && tab === "preview" && "hidden lg:block",
          )}
        >
          {children}
        </div>
        {preview ? (
          <PreviewPane src={preview} version={editor.previewVersion} focusId={focusId} className={cx("min-w-0 flex-1", tab === "form" && "hidden lg:block")} />
        ) : null}
      </div>
    </div>
  );
}
