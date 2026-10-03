import { Fragment } from "react";
import { DitherRule } from "@/components/ui/dither";
import { TextLink } from "@/components/ui/text-link";
import type { EntryColumns } from "@/content/work/types";
import { cx } from "@/lib/cx";
import type { EntryView, PostView, StudyView } from "@/lib/work/derive";
import { CreditLine } from "./credit-line";
import { MediaButton } from "./media-button";

// The media grid's columns from md: 1 (the default) is one figure per row at
// the full width of the media column; 3 is two columns from md and three from
// lg. Below md there is always one column.
const COLUMNS: Record<EntryColumns, string> = {
  1: "",
  2: "md:grid-cols-2",
  3: "md:grid-cols-2 lg:grid-cols-3",
};

// Figure column widths, for the image `sizes`. At lg the media column is what's
// left after the padding (80), the label (200), the text (480) and two gaps
// (56): 100vw - 816px. Below lg the grid spans the page (100vw - 80px from md,
// 100vw - 32px on phones). A cell is that width over its column count.
function figureSizes(columns: EntryColumns) {
  const lg = columns === 3 ? "calc((100vw - 816px) / 3)" : columns === 2 ? "calc((100vw - 816px) / 2)" : "calc(100vw - 816px)";
  const md = columns === 1 ? "calc(100vw - 80px)" : "calc((100vw - 80px) / 2)";
  return `(min-width: 1024px) ${lg}, (min-width: 768px) ${md}, calc(100vw - 32px)`;
}

// The release log: year groups, newest first. The Doto year sticks while its
// group scrolls (lg only). Each entry shows its note, credits, figures (in the
// columns it asks for) and, last, its posts oldest first.
export function LogView({ study, onOpen }: { study: StudyView; onOpen?: (id: string) => void }) {
  return (
    <div data-view="log">
      {study.groups.map((group, index) => (
        <Fragment key={group.year}>
          {index > 0 ? <DitherRule className="mx-4 md:mx-10" /> : null}
          <section
            aria-labelledby={`year-${group.year}`}
            className="grid gap-4 px-4 py-8 md:px-10 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-7 lg:py-[30px]"
          >
            <div>
              <h2 id={`year-${group.year}`} className="type-name lg:sticky lg:top-6">
                {group.year}
              </h2>
            </div>
            <ol className="flex flex-col gap-10">
              {group.items.map((entry) => (
                <li key={entry.id} id={`entry-${entry.id}`}>
                  <EntryBlock entry={entry} onOpen={onOpen} />
                </li>
              ))}
            </ol>
          </section>
        </Fragment>
      ))}
    </div>
  );
}

function EntryBlock({ entry, onOpen }: { entry: EntryView; onOpen?: (id: string) => void }) {
  const count = entry.media.length;
  return (
    <article className={cx("grid gap-4", count > 0 && "lg:grid-cols-[minmax(0,480px)_1fr] lg:grid-rows-[auto_1fr] lg:gap-x-7")}>
        <div className="flex flex-col gap-2 lg:col-start-1 lg:row-start-1">
          <h3 className="type-body">
            <span className="font-medium">{entry.heading}</span> <span className="text-fg-muted">· {entry.month}</span>
          </h3>
          {entry.frameworks.length > 0 ? (
            <ul aria-label="Frameworks" className="flex flex-wrap gap-1.5">
              {entry.frameworks.map((framework) => (
                <li key={framework} className="border px-1.5 type-label text-fg-muted">
                  {framework}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="type-body text-fg-soft">{entry.note}</p>
          <CreditLine credits={entry.credits} />
          {entry.source ? (
            <p className="type-meta">
              <TextLink href={entry.source} ariaLabel={`Post on X, ${entry.heading}, ${entry.month} ${entry.year}`} className="text-accent">
                post
              </TextLink>
            </p>
          ) : null}
        </div>
        {count > 0 ? (
          <div
            data-entry-media={count}
            data-columns={entry.columns}
            className={cx("grid content-start gap-3 lg:col-start-2 lg:row-span-2 lg:row-start-1", COLUMNS[entry.columns])}
          >
            {entry.media.map((media) => (
              <MediaButton key={media.id} media={media} onOpen={onOpen} sizes={figureSizes(entry.columns)} />
            ))}
          </div>
        ) : null}
      {entry.posts.length > 0 ? <PostList posts={entry.posts} /> : null}
    </article>
  );
}

// An entry's posts, oldest first, as quiet rows (from lg, under the note in the
// text column): "Nov 7, 2024 · @primevue ·
// summary" (stacked on phones). Only @w00f posts are links (the summary is the
// link text); other accounts are plain text.
function PostList({ posts }: { posts: PostView[] }) {
  return (
    <ul aria-label="Posts" className="flex flex-col gap-1.5 self-start type-meta lg:col-start-1 lg:row-start-2">
      {posts.map((post) => (
        <li key={post.id} id={`post-${post.id}`}>
          <span className="block text-fg-muted md:inline">
            {post.display} · {post.account}
          </span>
          <span aria-hidden="true" className="hidden text-fg-muted md:inline">
            {" · "}
          </span>
          {post.url ? (
            <a
              href={post.url}
              rel="noopener noreferrer"
              aria-label={`Post on X, ${post.display}, ${post.account}: ${post.summary}`}
              className="text-fg-soft underline decoration-line underline-offset-[0.2em] hover:text-accent hover:decoration-current"
            >
              {post.summary}
            </a>
          ) : (
            <span className="text-fg-soft">{post.summary}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
