import { DashboardShell } from "@/components/shell/dashboard-shell";
import { SiteShell } from "@/components/shell/site-shell";
import { assertView } from "@/lib/view/params";
import { VIEWS } from "@/lib/view/views";

// Prerender every page once per view; the proxy picks which one a visitor gets.
export function generateStaticParams() {
  return VIEWS.map((view) => ({ view }));
}

export default async function ViewLayout({ children, params }: LayoutProps<"/[view]">) {
  const view = assertView((await params).view);
  return (
    <div data-view={view}>
      {view === "dashboard" ? <DashboardShell>{children}</DashboardShell> : <SiteShell>{children}</SiteShell>}
    </div>
  );
}
