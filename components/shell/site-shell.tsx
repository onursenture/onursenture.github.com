import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ButtonLink } from "@/components/ui/button";
import { profile } from "@/content/profile";
import { readyItems } from "@/lib/nav";
import { MenuDialog } from "./menu-dialog";
import { NavLinks } from "./nav-links";
import { ShellControls } from "./shell-controls";
import { SiteFooter } from "./site-footer";

function BookACall() {
  if (!profile.bookingUrl) return null;
  return <ButtonLink href={profile.bookingUrl}>Book a call →</ButtonLink>;
}

// A 64px top bar on the 12-column grid (name on 3 columns, nav from column 4,
// actions on the right), content in a 1200px container, and the footer. Below md the bar collapses to the name and a Menu button.
export function SiteShell({ children }: { children: ReactNode }) {
  const name = (
    <Link href="/" className="type-body font-medium">
      {profile.name}
    </Link>
  );
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="h-14 border-b md:h-16">
        <div className="mx-auto flex h-full max-w-312 items-center justify-between pr-1 pl-4 md:grid md:grid-cols-12 md:gap-x-6 md:px-6">
          <div className="md:col-span-3">{name}</div>
          <div className="hidden md:col-span-5 md:block">
            <NavLinks items={readyItems()} placement="bar" />
          </div>
          <div className="hidden items-center justify-end gap-3 md:col-span-4 md:flex">
            <BookACall />
            <ThemeToggle />
          </div>
          <div className="md:hidden">
            <MenuDialog title={name}>
              <div className="flex flex-col gap-8 p-4">
                <NavLinks items={readyItems()} placement="list" />
                <BookACall />
                <ShellControls />
              </div>
            </MenuDialog>
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-312 flex-1 px-4 md:px-6">{children}</div>
      <SiteFooter />
    </div>
  );
}
