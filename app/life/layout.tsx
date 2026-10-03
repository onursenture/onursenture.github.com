import { SiteShell } from "@/components/shell/site-shell";

// The Life side. Task 7 swaps in the always-dark Life shell.
export default function LifeLayout({ children }: LayoutProps<"/life">) {
  return <SiteShell>{children}</SiteShell>;
}
