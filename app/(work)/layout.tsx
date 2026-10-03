import { WorkShell } from "@/components/shell/work-shell";

// The Work side: home, and later /work/, /lab/, /resume/.
export default function WorkLayout({ children }: LayoutProps<"/">) {
  return <WorkShell>{children}</WorkShell>;
}
