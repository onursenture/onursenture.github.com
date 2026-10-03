import { MetaLabel } from "@/components/ui/meta-label";
import { TextLink } from "@/components/ui/text-link";

// Rendered inside app/(work)/layout.tsx, so a 404 keeps the shell.
export default function NotFound() {
  return (
    <main className="flex flex-col items-start gap-6 py-24">
      <MetaLabel>404</MetaLabel>
      <h1 className="type-display-64">Page not found</h1>
      <TextLink href="/" className="type-sans-16">
        Back to home
      </TextLink>
    </main>
  );
}
