import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ViewToggle } from "@/components/view-toggle";
import type { View } from "@/lib/view/views";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 pl-3">
      <span aria-hidden="true" className="type-mono-11 text-fg-muted">
        {label}
      </span>
      {children}
    </div>
  );
}

// Labelled Theme and View toggles, stacked: the sidebar foot and the mobile
// menus.
export function ShellControls({ view }: { view: View }) {
  return (
    <div className="flex flex-col gap-2">
      <Row label="Theme">
        <ThemeToggle />
      </Row>
      <Row label="View">
        <ViewToggle current={view} />
      </Row>
    </div>
  );
}
