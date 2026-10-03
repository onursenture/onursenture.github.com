import { SectionRow } from "@/components/ui/section-row";
import { TextLink } from "@/components/ui/text-link";

// Only for requests that match no layout (paths with a dot, for example).
// Everything else 404s inside the Work or Life layout.
export default function RootNotFound() {
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <main className="pb-16 pt-8">
        <SectionRow label="404" labelAs="div">
          <h1 className="mb-3 type-lead">Page not found.</h1>
          <p className="type-body text-fg-soft">
            Nothing lives at this address. <TextLink href="/">Back to home</TextLink>
          </p>
        </SectionRow>
      </main>
    </div>
  );
}
