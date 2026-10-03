import { Fragment } from "react";
import { DitherRule } from "@/components/ui/dither";
import { TextLink } from "@/components/ui/text-link";
import { cx } from "@/lib/cx";
import type { EntryView, StudyView } from "@/lib/work/derive";
import { CreditLine } from "./credit-line";
import { MediaButton } from "./media-button";

// At lg the figure column is what's left after the padding (80), the label
// (200), the text (480) and two gaps (56).
const FIGURE_SIZES = "(min-width: 1024px) calc(100vw - 816px), (min-width: 768px) calc(100vw - 80px), calc(100vw - 32px)";

// The release log: year groups, newest first. The Doto year sticks while its
// group scrolls (lg only). Each entry shows its first figure; "+N in Grid →"
// opens the Grid filtered to that entry.
export function LogView({
  study,
  onOpen,
  onShowEntry,
}: {
  study: StudyView;
  onOpen?: (id: string) => void;
  onShowEntry?: (entryId: string) => void;
}) {
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
                  <EntryBlock entry={entry} moreLabel={study.moreLabel} onOpen={onOpen} onShowEntry={onShowEntry} />
                </li>
              ))}
            </ol>
          </section>
        </Fragment>
      ))}
    </div>
  );
}

function EntryBlock({
  entry,
  moreLabel,
  onOpen,
  onShowEntry,
}: {
  entry: EntryView;
  moreLabel: StudyView["moreLabel"];
  onOpen?: (id: string) => void;
  onShowEntry?: (entryId: string) => void;
}) {
  const [first, ...rest] = entry.media;
  return (
    <article className={cx("grid gap-4", first && "lg:grid-cols-[minmax(0,480px)_1fr] lg:gap-7")}>
      <div className="flex flex-col gap-2">
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
        {entry.source || entry.links.length > 0 ? (
          <p className="flex flex-wrap gap-x-4 type-meta">
            {entry.source ? (
              <TextLink href={entry.source} ariaLabel={`Post on X, ${entry.heading}, ${entry.month} ${entry.year}`} className="text-accent">
                post
              </TextLink>
            ) : null}
            {entry.links.map((link) => (
              <TextLink key={link.href} href={link.href} className="text-accent">
                {link.label}
              </TextLink>
            ))}
          </p>
        ) : null}
      </div>
      {first ? (
        <div className="flex flex-col gap-1.5">
          <MediaButton media={first} onOpen={onOpen} sizes={FIGURE_SIZES} />
          {rest.length > 0 ? (
            <button
              type="button"
              onClick={() => onShowEntry?.(entry.id)}
              className="self-start type-meta text-accent hover:underline"
            >
              +{rest.length} {rest.length === 1 ? moreLabel.one : moreLabel.many} →
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
