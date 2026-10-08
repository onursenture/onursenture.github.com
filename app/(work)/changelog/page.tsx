import type { Metadata } from "next";
import { Fragment } from "react";
import { ItemLink } from "@/components/sections/item-link";
import { DitherRule } from "@/components/ui/dither";
import { SectionRow } from "@/components/ui/section-row";
import { TextLink } from "@/components/ui/text-link";
import { eras, releases } from "@/content/changelog";
import { DESCRIPTIONS } from "@/content/descriptions";
import { anchorOf, eraSpan } from "@/lib/changelog";
import { formatDate } from "@/lib/format";
import { describedMetadata } from "@/lib/metadata";

export const metadata: Metadata = describedMetadata("Changelog", DESCRIPTIONS.changelog);

// /changelog/ (Sprint 11b spec §1.5): the /book/ header pattern, then one row
// per release (anchored at v2-8-1, the footer's version links there) and the
// eras. Static: content/changelog.ts is the source.
export default function ChangelogPage() {
  const rows = [
    <SectionRow
      key="header"
      id="changelog"
      labelAs="div"
      label={
        <ItemLink href="/" className="text-fg-muted">
          ← Home
        </ItemLink>
      }
    >
      <h1 className="type-lead">
        Changelog. <span className="text-fg-muted">Every release of this site.</span>
      </h1>
      <p className="mt-2 type-meta text-fg-muted">
        How it&apos;s built:{" "}
        <TextLink href="/colophon/" underline="always">
          Colophon
        </TextLink>
      </p>
    </SectionRow>,
    ...releases.map((release) => (
      <SectionRow
        key={release.version}
        id={anchorOf(release.version)}
        label={
          <>
            v{release.version}
            <span className="block type-meta text-fg-muted">{formatDate(release.date)}</span>
          </>
        }
      >
        <p className="type-body text-fg">{release.title}</p>
        <ul className="mt-2 flex list-disc flex-col gap-1 pl-4 type-body text-fg-soft marker:text-fg-muted">
          {release.items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </SectionRow>
    )),
    <SectionRow key="earlier" id="earlier" label="Earlier">
      <ul className="flex flex-col gap-3 type-body">
        {eras.map((era) => (
          <li key={era.major}>
            <span className="text-fg">
              v{era.major} · {era.name}
            </span>{" "}
            <span className="type-meta text-fg-muted">· {eraSpan(era)}</span>
            <p className="text-fg-soft">{era.summary}</p>
          </li>
        ))}
      </ul>
    </SectionRow>,
  ];
  return (
    <main className="pb-8">
      {rows.map((row, index) => (
        <Fragment key={index}>
          {index > 0 ? <DitherRule className="mx-4 md:mx-10" /> : null}
          {row}
        </Fragment>
      ))}
    </main>
  );
}
