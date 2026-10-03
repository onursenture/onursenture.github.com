import { Fragment } from "react";
import { ItemLink } from "@/components/sections/item-link";
import { SectionRow } from "@/components/ui/section-row";
import { ORGS } from "@/content/orgs";
import type { CaseStudy, Fact } from "@/content/work/types";

// The grid header (spec §3.1): back link and identity in the label column;
// lead, intro and facts in the content column. `study.links` is provenance
// and is not rendered (Onur 2026-10-03: no external links except @w00f posts).
export function CaseStudyHeader({ study, facts }: { study: CaseStudy; facts: Fact[] }) {
  return (
    <SectionRow
      labelAs="div"
      label={
        <>
          <ItemLink href="/work/" className="text-fg-muted">
            ← Work
          </ItemLink>
          <span className="mt-4 block text-fg">{study.title}</span>
          <span className="block text-fg-muted">{study.kind}</span>
          <span className="block text-fg-muted">
            {ORGS[study.org].name} · {study.years}
          </span>
        </>
      }
    >
      <h1 className="mb-2.5 type-lead">
        {study.lead.strong} <span className="text-fg-muted">{study.lead.rest}</span>
      </h1>
      {study.intro.map((paragraph, index) => (
        <p key={index} className="mb-2 type-body text-fg-soft">
          {paragraph}
        </p>
      ))}
      <dl className="mt-3 grid grid-cols-[10ch_1fr] gap-x-3 gap-y-0.5 type-meta">
        {facts.map((fact) => (
          <Fragment key={fact.label}>
            <dt className="text-fg-muted">{fact.label}</dt>
            <dd>{fact.value}</dd>
          </Fragment>
        ))}
      </dl>
    </SectionRow>
  );
}
