import { ThemeSync } from "@/components/theme-toggle";
import { TextLink } from "@/components/ui/text-link";

// Only for requests that never reach app/[view] (paths the proxy skips, such
// as ones with a dot). Everything else 404s inside the shell.
export default function RootNotFound() {
  return (
    <>
      <ThemeSync />
      <main className="mx-auto flex max-w-312 flex-col items-start gap-6 px-4 py-24 md:px-6">
        <h1 className="type-display-64">Page not found</h1>
        <TextLink href="/" className="type-sans-16">
          Back to home
        </TextLink>
      </main>
    </>
  );
}
