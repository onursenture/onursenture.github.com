import { MetaLabel } from "@/components/ui/meta-label";
import { TextLink } from "@/components/ui/text-link";

// Rendered inside app/life/layout.tsx, so a 404 keeps the shell.
export default function NotFound() {
  return (
    <main className="flex flex-col items-start gap-6 px-4 py-24 md:px-10">
      <MetaLabel>404</MetaLabel>
      <h1 className="type-lead">Page not found</h1>
      <TextLink href="/life/" className="type-body">
        Back to Life
      </TextLink>
    </main>
  );
}
