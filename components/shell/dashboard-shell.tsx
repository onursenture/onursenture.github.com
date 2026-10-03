import Link from "next/link";
import type { ReactNode } from "react";
import { SyncLine } from "@/components/sources/source-health";
import { profile } from "@/content/profile";
import { OVERVIEW, readyItems } from "@/lib/nav";
import type { SourceStatus } from "@/lib/sources/health";
import { readSourceStatuses } from "@/lib/sources/status";
import { MenuDialog } from "./menu-dialog";
import { NavLinks } from "./nav-links";
import { ShellControls } from "./shell-controls";

// Nav on top; toggles and the sync line at the foot.
function SidebarBody({ statuses }: { statuses: SourceStatus[] }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-between gap-8 overflow-y-auto p-4">
      <NavLinks items={[OVERVIEW, ...readyItems()]} placement="list" />
      <div className="flex flex-col gap-4 border-t pt-4">
        <ShellControls view="dashboard" />
        <div className="pl-3">
          <SyncLine statuses={statuses} />
        </div>
      </div>
    </div>
  );
}

// Dashboard view: a 240px sidebar beside the content. Pages render their own
// 48px top bar (PageHeader) and panel grid. Below md the sidebar becomes a
// top bar whose Menu opens the same content as a slide-over.
export async function DashboardShell({ children }: { children: ReactNode }) {
  const statuses = await readSourceStatuses();
  const name = (
    <Link href="/" className="type-sans-14-medium">
      {profile.name}
    </Link>
  );
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[240px_minmax(0,1fr)]">
      {/* The column carries the fill, so it runs the full page height while
          the sidebar itself stays pinned to the viewport. */}
      <div className="hidden border-r bg-surface md:block">
        <aside className="sticky top-0 flex h-dvh flex-col">
          <div className="flex h-12 shrink-0 items-center border-b pr-4 pl-7">{name}</div>
          <SidebarBody statuses={statuses} />
        </aside>
      </div>
      <div className="flex h-12 items-center justify-between border-b bg-surface pr-1 pl-4 md:hidden">
        {name}
        <MenuDialog variant="slide" title={name}>
          <SidebarBody statuses={statuses} />
        </MenuDialog>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
