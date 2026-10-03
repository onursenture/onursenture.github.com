import { Fragment } from "react";
import { DitherRule } from "@/components/ui/dither";
import { TextLink } from "@/components/ui/text-link";
import { cx } from "@/lib/cx";
import { type EntryView, type StudyView, sourceLabel } from "@/lib/work/derive";
import { CreditLine } from "./credit-line";
import { MediaButton } from "./media-button";

// Figure column widths: at lg it is what's left after the padding (80), the
// label (200), the text (480) and two gaps (56), so 100vw - 816px. A grid cell
// is that width divided by its column count (2 from md, 3 from xl on 3+; one figure uses the 2-column width).
function figureSizes(count: number) {
  const xl = count >= 3 ? "(min-width: 1280px) calc((100vw - 816px) / 3), " : "";
  return `${xl}(min-width: 1024px) calc((100vw - 816px) / 2), (min-width: 768px) calc((100vw - 80px) / 2), calc(100vw - 32px)`;
}

// 1 or 2 figures: two columns from md (a lone figure takes the first cell, so
// it is the same width as a grid cell). 3+: two from md, three from xl.
function gridClass(count: number) {
  return count >= 3 ? "md:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2";
}

// The release log: year groups, newest first. The Doto year sticks while its
// group scrolls (lg only). Each entry shows all of its figures as an equal grid.
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
    <article className={cx("grid gap-4", count > 0 && "lg:grid-cols-[minmax(0,480px)_1fr] lg:gap-7")}>
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
              <TextLink href={entry.source} ariaLabel={`${sourceLabel(entry.source)}, ${entry.heading}, ${entry.month} ${entry.year}`} className="text-accent">
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
      {count > 0 ? (
        <div data-entry-media={count} className={cx("grid content-start gap-3", gridClass(count))}>
          {entry.media.map((media) => (
            <MediaButton key={media.id} media={media} onOpen={onOpen} sizes={figureSizes(count)} />
          ))}
        </div>
      ) : null}
    </article>
  );
}
