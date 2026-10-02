import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { ViewToggle } from "@/components/view-toggle";
import { assertView } from "@/lib/view/params";
import { VIEWS } from "@/lib/view/views";

// Prerender every page once per view; the proxy picks which one a visitor gets.
export function generateStaticParams() {
  return VIEWS.map((view) => ({ view }));
}

export default async function ViewLayout({ children, params }: LayoutProps<"/[view]">) {
  const view = assertView((await params).view);
  return (
    <div data-view={view} className="mx-auto max-w-3xl p-4 dashboard:max-w-6xl dashboard:text-sm">
      <header className="flex gap-4 border-b pb-2">
        <nav className="flex gap-4">
          <Link href="/">Home</Link>
          <Link href="/life/">Life</Link>
          <Link href="/photos/">Photos</Link>
        </nav>
        <div className="ml-auto flex gap-2">
          <ViewToggle current={view} />
          <ThemeToggle />
        </div>
      </header>
      {children}
    </div>
  );
}
