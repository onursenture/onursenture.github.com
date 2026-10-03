import { Fragment } from "react";
import { ItemLink } from "@/components/sections/item-link";
import { cx } from "@/lib/cx";
import type { Credit } from "@/content/work/types";
import { groupCredits } from "@/lib/work/derive";

// "Design: Ada, Bo · Implementation: Cy". Names link when they have an href.
// Renders nothing without credits.
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
              {person.href ? (
                <ItemLink href={person.href} className="text-fg">
                  {person.name}
                </ItemLink>
              ) : (
                <span className="text-fg">{person.name}</span>
              )}
            </Fragment>
          ))}
        </Fragment>
      ))}
    </p>
  );
}
