import type { Metadata } from "next";
import { Fragment } from "react";
import { ItemLink } from "@/components/sections/item-link";
import { DitherRule } from "@/components/ui/dither";
import { SectionRow } from "@/components/ui/section-row";
import { TextLink } from "@/components/ui/text-link";
import { type ColophonPart, STACK, sections } from "@/content/colophon";
import { DESCRIPTIONS } from "@/content/descriptions";
import { stackItems } from "@/lib/colophon";
import { describedMetadata } from "@/lib/metadata";
import pkg from "@/package.json";

export const metadata: Metadata = describedMetadata("Colophon", DESCRIPTIONS.colophon);

const deps: Record<string, string> = { ...pkg.dependencies, ...pkg.devDependencies };

function Part({ part }: { part: ColophonPart }) {
  if (typeof part === "string") return <>{part}</>;
  // Running text: links are always underlined (WCAG 1.4.1).
  return (
    <TextLink href={part.href} underline="always">
      {part.text}
    </TextLink>
  );
}

// /colophon/ (Sprint 11b spec §2): how the site is made. The /book/ header
// pattern, then one row per section; the Stack row's versions come from
// package.json at build time.
export default function ColophonPage() {
  const stack = stackItems(STACK, deps);
  const [built, ...rest] = sections;
  const textRow = (section: (typeof sections)[number]) => (
    <SectionRow key={section.id} id={section.id} label={section.label}>
      <div className="flex flex-col gap-2 type-body text-fg-soft">
        {section.paragraphs.map((paragraph, index) => (
          <p key={index}>
            {paragraph.map((part, partIndex) => (
              <Part key={partIndex} part={part} />
            ))}
          </p>
        ))}
      </div>
    </SectionRow>
  );
  const rows = [
    <SectionRow
      key="header"
      id="colophon"
      labelAs="div"
      label={
        <ItemLink href="/" className="text-fg-muted">
          ← Home
        </ItemLink>
      }
    >
      <h1 className="type-lead">
        Colophon. <span className="text-fg-muted">How this site is made.</span>
      </h1>
    </SectionRow>,
    textRow(built),
    <SectionRow key="stack" id="stack" label="Stack">
      <ul className="flex flex-col gap-1 type-body text-fg-soft">
        {stack.map((item) => (
          <li key={item.name}>
            <TextLink href={item.href}>{item.version ? `${item.name} ${item.version}` : item.name}</TextLink>
            {item.note ? <span className="text-fg-muted"> · {item.note}</span> : null}
          </li>
        ))}
      </ul>
    </SectionRow>,
    ...rest.map(textRow),
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
