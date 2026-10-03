import { SiteShell } from "@/components/shell/site-shell";

// The Work side: home, and later /work/, /lab/, /resume/.
export default function WorkLayout({ children }: LayoutProps<"/">) {
  return <SiteShell>{children}</SiteShell>;
}
