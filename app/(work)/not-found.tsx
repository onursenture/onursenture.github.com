import { SectionRow } from "@/components/ui/section-row";
import { TextLink } from "@/components/ui/text-link";

// Rendered inside the Work layout, so a 404 keeps the shell.
export default function NotFound() {
  return (
    <main className="pb-16">
      <SectionRow label="404" labelAs="div">
        <h1 className="mb-3 type-lead">Page not found.</h1>
        <p className="type-body text-fg-soft">
          Nothing lives at this address. <TextLink href="/">Back to home</TextLink>
        </p>
      </SectionRow>
    </main>
  );
}
