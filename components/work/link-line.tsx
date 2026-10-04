import { Fragment } from "react";
import { TextLink } from "@/components/ui/text-link";
import type { Link } from "@/content/work/types";

// External links in one line ("App Store ↗ · nebuu.com ↗"): the Live row, a
// then block's sources and a text block's links. Orkestra pages only.
export function LinkLine({ links }: { links: Link[] }) {
  return (
    <span>
      {links.map((link, index) => (
        <Fragment key={link.href}>
          {index > 0 ? " · " : null}
          <TextLink href={link.href}>{link.label}</TextLink>
        </Fragment>
      ))}
    </span>
  );
}
