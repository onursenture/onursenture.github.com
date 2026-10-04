import type { Metadata } from "next";

// Everything under /admin/ is private: never indexed (also disallowed in robots).
export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
