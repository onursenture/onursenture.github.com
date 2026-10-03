import Link from "next/link";
import type { ReactNode } from "react";
import { LifeSwitch } from "@/components/life-switch";
import { ThemeToggle } from "@/components/theme-toggle";
import { DitherStrip } from "@/components/ui/dither";
import { profile } from "@/content/profile";
import { readyItems } from "@/lib/nav";
import { MenuDialog } from "./menu-dialog";
import { NavLinks } from "./nav-links";
import { ShellControls } from "./shell-controls";
import { SideFade } from "./side-fade";
import { SiteFooter } from "./site-footer";

// The Work side: dither strip, a header with the dot-matrix name, the nav
// (once items are ready), the theme toggle and the Life switch, then the
// page and the footer. Pages pad themselves (SectionRow does).
export function WorkShell({ children }: { children: ReactNode }) {
  const name = (
    <Link href="/" className="type-name uppercase">
      {profile.name}
    </Link>
  );
  return (
    <SideFade>
      <div className="flex min-h-dvh flex-col bg-bg text-fg">
        <DitherStrip />
        <header className="flex h-16 items-center justify-between gap-6 px-4 md:px-10">
          {name}
          <div className="hidden items-center gap-5 md:flex">
            <NavLinks items={readyItems()} placement="bar" />
            <ThemeToggle />
            <LifeSwitch on={false} />
          </div>
          <div className="flex items-center gap-3 md:hidden">
            <LifeSwitch on={false} />
            <MenuDialog title={name}>
              <div className="flex flex-col gap-8 p-4">
                <NavLinks items={readyItems()} placement="list" />
                <ShellControls />
              </div>
            </MenuDialog>
          </div>
        </header>
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </div>
    </SideFade>
  );
}
