import { Fragment } from "react";
import { OrgMark } from "@/components/ui/org-mark";
import { ORGS } from "@/content/orgs";
import type { BioSegment } from "@/content/profile";

// Bio paragraphs: justified mono with a 3ch first-line indent; an org renders
// as its mark plus its name, kept together on one line.
export function Bio({ paragraphs }: { paragraphs: BioSegment[][] }) {
  return (
    <>
      {paragraphs.map((segments, index) => (
        <p key={index} className="mb-2 indent-[3ch] md:text-justify type-body text-fg-soft">
          {segments.map((segment, i) =>
            typeof segment === "string" ? (
              <Fragment key={i}>{segment}</Fragment>
            ) : (
              <span key={i} className="whitespace-nowrap indent-0">
                <OrgMark org={segment.org} /> <span className="text-fg">{ORGS[segment.org].name}</span>
              </span>
            ),
          )}
        </p>
      ))}
    </>
  );
}
