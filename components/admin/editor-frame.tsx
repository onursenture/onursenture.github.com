"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { buttonClass } from "@/components/ui/button";
import type { IssueTarget } from "@/lib/content/issue-labels";
import { cx } from "@/lib/cx";
import { DocToolbar } from "./doc-toolbar";
import { IssuesList } from "./issues-list";
import { PreviewPane } from "./preview-pane";
import type { DocEditorState } from "./use-doc-editor";

// The card an issue points at, inside the form column: the image card when
// there is one, else the block card.
function cardOf(column: HTMLElement, target: IssueTarget): HTMLElement | null {
  const block = column.querySelector<HTMLElement>(`[data-block="${CSS.escape(target.block)}"]`);
  if (!block || !target.image) return block;
  return block.querySelector<HTMLElement>(`[data-image="${CSS.escape(target.image)}"]`) ?? block;
}

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
  onIssue,
  children,
}: {
  crumbs: string[];
  // The value names the issues in the banner (labelIssue).
  editor: DocEditorState & { value: unknown };
  preview?: string;
  focusId?: string | null;
  openHref?: string;
  extraActions?: ReactNode;
  hideDiscard?: boolean;
  // Opens the card an issue in the banner points at (the page editor); the
  // frame then scrolls the form column to it and focuses its toggle.
  onIssue?: (target: IssueTarget) => void;
  children: ReactNode;
}) {
  const [tab, setTab] = useState<"form" | "preview">("form");
  const column = useRef<HTMLDivElement>(null);
  const [reveal, setReveal] = useState<{ target: IssueTarget } | null>(null);

  // After the render that opened the card. The column is the scroll container:
  // scrollIntoView would also move the document.
  useEffect(() => {
    const box = column.current;
    if (!reveal || !box) return;
    const card = cardOf(box, reveal.target);
    if (!card) return;
    const padding = Number.parseFloat(getComputedStyle(box).paddingTop) || 0;
    box.scrollTo({ top: box.scrollTop + card.getBoundingClientRect().top - box.getBoundingClientRect().top - padding, behavior: "instant" });
    card.querySelector<HTMLElement>("button[aria-expanded]")?.focus({ preventScroll: true });
  }, [reveal]);

  function selectIssue(target: IssueTarget) {
    onIssue?.(target);
    setTab("form");
    // A new object each time, so selecting the same issue again scrolls again.
    setReveal({ target });
  }
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
      <IssuesList
        issues={editor.issues}
        blocking={editor.status === "invalid"}
        context={{ doc: editor.docKey, value: editor.value }}
        onSelect={onIssue ? selectIssue : undefined}
      />
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
          ref={column}
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
