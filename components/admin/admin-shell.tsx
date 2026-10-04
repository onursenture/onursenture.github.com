import Link from "next/link";
import type { ReactNode } from "react";

// The admin chrome: one hairline bar with the way home and Sign out. Light,
// on the site tokens; editors fill the rest of the viewport.
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-line px-4 type-meta">
        <Link href="/admin/" className="type-body text-fg">
          Admin
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-fg-muted hover:text-fg">
            Site →
          </Link>
          <form action="/api/auth/signout/" method="post">
            <button type="submit" className="text-fg-muted hover:text-fg">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
