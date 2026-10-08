import { SectionRow } from "@/components/ui/section-row";
import { TextLink } from "@/components/ui/text-link";

// Rendered inside app/life/layout.tsx, so a 404 keeps the shell.
export default function NotFound() {
  return (
    <main className="pb-16">
      <SectionRow label="404" labelAs="div">
        <h1 className="mb-3 type-lead">Page not found.</h1>
        <p className="type-body text-fg-soft">
          Nothing here. Not even a film. <TextLink href="/life/" underline="always">Back to Life</TextLink>
        </p>
      </SectionRow>
    </main>
  );
}
