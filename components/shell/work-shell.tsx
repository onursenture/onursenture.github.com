import Link from "next/link";
import type { ReactNode } from "react";
import { LifeSwitch } from "@/components/life-switch";
import { DitherStrip } from "@/components/ui/dither";
import { profile } from "@/content/profile";
import { headerItems } from "@/lib/nav";
import { MenuDialog } from "./menu-dialog";
import { NavLinks } from "./nav-links";
import { SideFade } from "./side-fade";
import { SiteFooter } from "./site-footer";
import { SkipLink } from "./skip-link";

// The Work side (light only): dither strip, a header with the dot-matrix
// name followed by the Life switch, the nav on the right once an item is
// listed there (none is, so no nav and no Menu button), then the page and the
// footer. Pages pad themselves (SectionRow does).
export function WorkShell({ children }: { children: ReactNode }) {
  const name = (
    <Link href="/" className="type-name uppercase">
      {profile.name}
    </Link>
  );
  const items = headerItems();
  return (
    <SideFade>
      <div className="flex min-h-dvh flex-col bg-bg text-fg">
        <SkipLink />
        <DitherStrip />
        <header className="flex h-16 items-center justify-between gap-6 px-4 md:px-10">
          <div className="flex items-center gap-4">
            {name}
            <LifeSwitch on={false} />
          </div>
          {items.length > 0 ? (
            <>
              <div className="hidden md:block">
                <NavLinks items={items} placement="bar" />
              </div>
              <div className="md:hidden">
                <MenuDialog title={name}>
                  <div className="flex flex-col gap-8 p-4">
                    <NavLinks items={items} placement="list" />
                  </div>
                </MenuDialog>
              </div>
            </>
          ) : null}
        </header>
        <div id="content" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </div>
        <SiteFooter />
      </div>
    </SideFade>
  );
}
