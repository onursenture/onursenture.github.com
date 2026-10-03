"use client";

import { cx } from "@/lib/cx";

export interface ToggleOption<T extends string> {
  value: T;
  label: string;
}

// Segmented control (theme, view). The pressed segment is inverted; the
// frame takes --radius-control, the segments stay square. The owner (a
// client component) keeps the state and passes onChange.
export function Toggle<T extends string>({
  label,
  options,
  value,
  onChange,
  testId,
}: {
  label: string;
  options: readonly ToggleOption<T>[];
  value: T;
  onChange?: (value: T) => void;
  testId?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      data-testid={testId}
      className="inline-flex h-8 shrink-0 items-center rounded-control border border-line-strong p-1"
    >
      {options.map((option) => {
        const pressed = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={pressed}
            onClick={() => onChange?.(option.value)}
            className={cx(
              "h-full px-2 type-sans-13",
              pressed ? "bg-fg text-bg" : "text-fg-muted hover:text-fg",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
