import { MetaLabel } from "@/components/ui/meta-label";
import { TextLink } from "@/components/ui/text-link";

// Rendered inside app/[view]/layout.tsx, so a 404 keeps the shell in both
// views. Not-found files receive no params; density follows the dashboard:
// variant instead.
export default function NotFound() {
  return (
    <main className="flex flex-col items-start gap-6 py-24 dashboard:gap-4 dashboard:p-6">
      <MetaLabel>404</MetaLabel>
      <h1 className="type-display-64 dashboard:type-sans-20-medium">Page not found</h1>
      <TextLink href="/" className="type-sans-16 dashboard:type-sans-14">
        Back to home
      </TextLink>
    </main>
  );
}
