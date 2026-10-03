import Link from "next/link";
import type { ReactNode } from "react";
import { LifeSwitch } from "@/components/life-switch";
import { DitherStrip } from "@/components/ui/dither";
import { profile } from "@/content/profile";
import { SideFade } from "./side-fade";
import { SideSync } from "./side-sync";
import { SiteFooter } from "./site-footer";

// The Life side: always dark (data-side="life" forces the dark tokens),
// whatever the theme. No theme toggle; the switch is on.
export function LifeShell({ children }: { children: ReactNode }) {
  return (
    <SideFade>
      <div data-side="life" className="flex min-h-dvh flex-col bg-bg text-fg">
        <SideSync side="life" />
        <DitherStrip />
        <header className="flex h-16 items-center justify-between gap-6 px-4 md:px-10">
          <Link href="/life/" className="type-name uppercase">
            {profile.name}
          </Link>
          <LifeSwitch on />
        </header>
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </div>
    </SideFade>
  );
}
