import { ThemeToggle } from "@/components/theme-toggle";

// The labelled Theme row of the Work menu dialog.
export function ShellControls() {
  return (
    <div className="flex items-center justify-between gap-3 pl-3">
      <span aria-hidden="true" className="type-label text-fg-muted">
        Theme
      </span>
      <ThemeToggle />
    </div>
  );
}
