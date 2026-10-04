import { cacheLife } from "next/cache";
import { Suspense } from "react";
import { EditLink } from "@/components/shell/edit-link";
import { FooterWash } from "@/components/ui/dither";
import { profile, socialLinks } from "@/content/profile";
import { buildLine } from "@/lib/build-info";

// Pages are prerendered and the year changes once a year; a cached read
// keeps `new Date()` out of the render (Cache Components requires that).
async function copyrightYear(): Promise<number> {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

// One mono line (build metadata, © and the social links) over the accent
// wash. The paddle slot is reserved for Sprint 11.
export async function SiteFooter() {
  const year = await copyrightYear();
  return (
    <footer className="mt-16">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 pb-4 type-meta text-fg-muted md:px-10">
        <p data-testid="build-line">{buildLine()}</p>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {/* usePathname() is request-time data on a route with params, so it sits in its own boundary. */}
          <Suspense fallback={null}>
            <EditLink />
          </Suspense>
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
        </p>
        <div data-slot="paddle" className="empty:hidden" />
      </div>
      <FooterWash />
    </footer>
  );
}
