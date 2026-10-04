import { PreviewFocus } from "@/components/admin/preview-focus";
import { WorkShell } from "@/components/shell/work-shell";

// Previews render inside the real Work shell, so they look exactly like the site.
export default function PreviewLayout({ children }: LayoutProps<"/admin/preview">) {
  return (
    <WorkShell>
      <PreviewFocus />
      {children}
    </WorkShell>
  );
}
