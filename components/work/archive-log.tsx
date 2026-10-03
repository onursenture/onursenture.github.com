import { Fragment } from "react";
import { DitherRule } from "@/components/ui/dither";
import { TextLink } from "@/components/ui/text-link";
import type { ArchiveView } from "@/lib/work/derive";
import { CreditLine } from "./credit-line";
import { MediaButton } from "./media-button";

// The Archive (spec §4.3): a hairline log grouped by year, newest first.
// Each row is month | title, note, credits, optional figure | post ↗.
export function ArchiveLog({ view, onOpen }: { view: ArchiveView; onOpen?: (id: string) => void }) {
  return (
    <div data-view="archive">
      {view.groups.map((group) => (
        <Fragment key={group.year}>
          <DitherRule className="mx-4 md:mx-10" />
          <section aria-labelledby={`year-${group.year}`} className="px-4 py-8 md:px-10 lg:py-[30px]">
            <h2 id={`year-${group.year}`} className="type-name">
              {group.year}
            </h2>
            <ol className="mt-4">
              {group.items.map((row) => (
                <li
                  key={row.id}
                  id={`archive-${row.id}`}
                  className="grid gap-2 border-b py-4 last:border-b-0 lg:grid-cols-[200px_minmax(0,480px)_1fr] lg:gap-7"
                >
                  <p className="type-meta text-fg-muted">{row.monthYear}</p>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="type-body font-medium">{row.title}</h3>
                    <p className="type-body text-fg-soft">{row.note}</p>
                    <CreditLine credits={row.credits} />
                    {row.media ? (
                      <div className="mt-1 max-w-xs">
                        <MediaButton media={row.media} onOpen={onOpen} sizes="320px" />
                      </div>
                    ) : null}
                  </div>
                  <p className="type-meta lg:text-right">
                    <TextLink href={row.source} ariaLabel={`Post on X, ${row.title}, ${row.monthYear}`} className="text-accent">
                      post
                    </TextLink>
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </Fragment>
      ))}
    </div>
  );
}
