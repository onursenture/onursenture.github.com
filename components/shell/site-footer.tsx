import { cacheLife } from "next/cache";
import { profile, socialLinks } from "@/content/profile";

// Pages are prerendered and the year changes once a year; a cached read
// keeps `new Date()` out of the render (Cache Components requires that).
async function copyrightYear(): Promise<number> {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

// One mono line: © year, the social links, and a slot reserved for the S9
// paddle easter egg.
export async function SiteFooter() {
  const year = await copyrightYear();
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-312 flex-wrap items-center gap-x-2 gap-y-1 px-4 py-6 type-mono-11 text-fg-muted md:px-6">
        <span>
          © {year} {profile.name}
        </span>
        {socialLinks().map((link) => (
          // The separator travels with the link after it, so a wrapped line
          // starts with "· Goodreads" instead of ending with a stray "·".
          <span key={link.label} className="flex gap-2 whitespace-nowrap">
            <span aria-hidden="true">·</span>
            <a href={link.href} rel="noopener noreferrer" className="hover:text-fg hover:underline">
              {link.label}
            </a>
          </span>
        ))}
        <div data-slot="paddle" className="ml-auto" />
      </div>
    </footer>
  );
}
