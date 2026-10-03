import { Fragment } from "react";
import { cx } from "@/lib/cx";
import type { Credit } from "@/content/work/types";
import { groupCredits } from "@/lib/work/derive";

// "Design: Ada, Bo · Implementation: Cy". Names are plain text: a credit's href
// is provenance and is not rendered (Onur 2026-10-03: no external links
// except @w00f posts). Renders nothing without credits.
export function CreditLine({ credits, className }: { credits: Credit[]; className?: string }) {
  if (credits.length === 0) return null;
  return (
    <p data-credits className={cx("type-meta text-fg-muted", className)}>
      {groupCredits(credits).map((group, groupIndex) => (
        <Fragment key={group.role}>
          {groupIndex > 0 ? " · " : null}
          {group.role}:{" "}
          {group.people.map((person, personIndex) => (
            <Fragment key={person.name}>
              {personIndex > 0 ? ", " : null}
              <span className="text-fg">{person.name}</span>
            </Fragment>
          ))}
        </Fragment>
      ))}
    </p>
  );
}
