import { LifeShell } from "@/components/shell/life-shell";

// The Life side: always dark.
export default function LifeLayout({ children }: LayoutProps<"/life">) {
  return <LifeShell>{children}</LifeShell>;
}
