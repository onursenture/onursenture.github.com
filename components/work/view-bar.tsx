import { cx } from "@/lib/cx";
import type { ChipView } from "@/lib/work/derive";
import type { Density, ViewState, WorkView } from "@/lib/work/url-state";

const VIEWS: { value: WorkView; label: string }[] = [
  { value: "log", label: "Log" },
  { value: "grid", label: "Grid" },
  { value: "index", label: "Index" },
  { value: "posts", label: "Posts" },
];

const DEFAULT_VIEWS: readonly WorkView[] = ["log", "grid", "index"];

const DENSITIES: { value: Density; label: string }[] = [
  { value: "1", label: "1×" },
  { value: "2", label: "2×" },
  { value: "inf", label: "∞" },
];

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange?: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex shrink-0 gap-4">
      {options.map((option) => {
        const pressed = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={pressed}
            onClick={() => onChange?.(option.value)}
            className={pressed ? "text-fg underline underline-offset-4" : "text-fg-muted hover:text-fg"}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

// The bar under the hero (spec §3.2): views on the left (Posts only when the
// study has posts), filter chips in Grid and Index (entry chips in Posts),
// density in Grid. Scrolls sideways on narrow screens.
export function ViewBar({
  chips,
  postChips = [],
  views = DEFAULT_VIEWS,
  state,
  onChange,
  showChips = true,
  showDensity = true,
}: {
  chips: ChipView[];
  postChips?: ChipView[];
  views?: readonly WorkView[];
  state: ViewState;
  onChange?: (patch: Partial<ViewState>) => void;
  showChips?: boolean;
  showDensity?: boolean;
}) {
  const posts = state.view === "posts";
  const shownChips = posts ? postChips : chips;
  return (
    <div className="flex items-center gap-x-6 overflow-x-auto border-y px-4 py-2.5 whitespace-nowrap type-meta md:px-10">
      <Segmented label="View" options={VIEWS.filter((option) => views.includes(option.value))} value={state.view} onChange={(view) => onChange?.({ view })} />
      {state.view !== "log" && (posts || showChips) ? (
        <div role="group" aria-label="Filter" className="flex shrink-0 gap-1.5">
          {shownChips.map((chip) => {
            const pressed = chip.key === state.tag;
            return (
              <button
                key={chip.key}
                type="button"
                aria-pressed={pressed}
                onClick={() => onChange?.({ tag: chip.key })}
                className={cx("border px-1.5 type-label", pressed ? "border-fg text-fg" : "text-fg-muted hover:text-fg")}
              >
                {chip.label} <span className="text-fg-muted">{chip.count}</span>
              </button>
            );
          })}
        </div>
      ) : null}
      {state.view === "grid" && showDensity ? (
        <div className="ml-auto">
          <Segmented label="Density" options={DENSITIES} value={state.density} onChange={(density) => onChange?.({ density })} />
        </div>
      ) : null}
    </div>
  );
}
