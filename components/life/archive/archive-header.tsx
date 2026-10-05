import { ItemLink } from "@/components/sections/item-link";
import { SectionRow } from "@/components/ui/section-row";
import { TextLink } from "@/components/ui/text-link";

// The archive pages' first row, the /life/notes/ pattern: ← Life, the title
// with its muted lede, and the upstream profile as the action.
export function ArchiveHeader({ title, lede, source }: { title: string; lede: string; source: { label: string; href: string } }) {
  return (
    <SectionRow
      labelAs="div"
      label={
        <ItemLink href="/life/" className="text-fg-muted">
          ← Life
        </ItemLink>
      }
      action={<TextLink href={source.href}>{source.label}</TextLink>}
    >
      <h1 className="type-lead">
        {title} <span className="text-fg-muted">{lede}</span>
      </h1>
    </SectionRow>
  );
}
