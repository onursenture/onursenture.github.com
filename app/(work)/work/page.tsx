import type { Metadata } from "next";
import { Fragment } from "react";
import { DitherRule } from "@/components/ui/dither";
import { OrgMark } from "@/components/ui/org-mark";
import { SectionRow } from "@/components/ui/section-row";
import { TextLink } from "@/components/ui/text-link";
import { WorkTable } from "@/components/work/work-table";
import { ORGS } from "@/content/orgs";
import { pageMetadata } from "@/lib/metadata";
import { getWorkIndexGroups } from "@/lib/work";

// Draft lead (Sprint 5); Sprint 6 rewrites it when Orkestra joins.
const LEAD = "Ten years of design systems, icons, blocks and templates at PrimeTek.";

export const metadata: Metadata = pageMetadata("Work", { description: LEAD, openGraph: { description: LEAD } });

// The Work index (spec §5): one index table per org with ready work.
export default function WorkIndexPage() {
  const groups = getWorkIndexGroups();
  return (
    <main className="pb-16">
      <SectionRow label="Work" labelAs="div">
        <h1 className="type-lead">
          Work. <span className="text-fg-muted">{LEAD}</span>
        </h1>
      </SectionRow>
      {groups.map((group) => (
        <Fragment key={group.org}>
          <DitherRule className="mx-4 md:mx-10" />
          <SectionRow
            id={group.org}
            label={
              <>
                <OrgMark org={group.org} /> {ORGS[group.org].name}
                <span className="block text-fg-muted">{group.role}</span>
                <span className="block text-fg-muted">{group.span}</span>
              </>
            }
            action={group.site ? <TextLink href={group.site}>{new URL(group.site).hostname}</TextLink> : undefined}
          >
            <WorkTable rows={group.rows} />
          </SectionRow>
        </Fragment>
      ))}
    </main>
  );
}
