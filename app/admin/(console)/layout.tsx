import { AdminShell } from "@/components/admin/admin-shell";

export default function ConsoleLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
