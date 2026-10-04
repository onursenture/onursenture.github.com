import { Fragment } from "react";
import { ItemLink } from "@/components/sections/item-link";
import { SectionRow } from "@/components/ui/section-row";
import type { ProductPageView } from "@/lib/work/derive";
import { LinkLine } from "./link-line";

// A product page's header row: the way home in the label column; the lead,
// the intro and the facts (Role, Years, At, and Platform on Orkestra pages)
// and, while the product runs, its Live links in the wide content.
export function ProductHeader({ page }: { page: ProductPageView }) {
  return (
    <SectionRow
      labelAs="div"
      label={
        <ItemLink href="/" className="text-fg-muted">
          ← Home
        </ItemLink>
      }
      wide
    >
      <h1 className="mb-2.5 max-w-[640px] type-lead">
        {page.lead.strong} <span className="text-fg-muted">{page.lead.rest}</span>
      </h1>
      <p className="max-w-[480px] type-body text-fg-soft">{page.intro}</p>
      <dl className="mt-3 grid grid-cols-[10ch_1fr] gap-x-3 gap-y-0.5 type-meta">
        {page.facts.map((fact) => (
          <Fragment key={fact.label}>
            <dt className="text-fg-muted">{fact.label}</dt>
            <dd>{fact.value}</dd>
          </Fragment>
        ))}
        {page.links?.length ? (
          <>
            <dt className="text-fg-muted">Live</dt>
            <dd>
              <LinkLine links={page.links} />
            </dd>
          </>
        ) : null}
      </dl>
    </SectionRow>
  );
}
