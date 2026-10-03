"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { type IconSet, filterIcons } from "@/lib/work/icons";

// PrimeIcons' live icon set (spec §4.1): the real set from the pinned package,
// searchable; a click copies the class name. Page content, not a view.
export function IconGrid({ set }: { set: IconSet }) {
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const shown = useMemo(() => filterIcons(set.icons, query), [set.icons, query]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy(name: string) {
    try {
      await navigator.clipboard.writeText(`pi pi-${name}`);
    } catch {
      return;
    }
    setCopied(name);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1200);
  }

  return (
    <div data-icons className="px-4 py-6 md:px-10">
      <label className="flex flex-wrap items-center gap-3 type-meta">
        <span className="text-fg-muted">Search</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="arrow, chart, user"
          className="h-8 w-64 max-w-full rounded-control border bg-bg px-2 type-body"
        />
      </label>
      <p className="mt-2 type-meta text-fg-muted">
        {shown.length} of {set.icons.length} icons
      </p>
      <ul className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] border-t border-l">
        {shown.map((icon) => (
          <li key={icon.name} className="border-r border-b">
            <button
              type="button"
              onClick={() => copy(icon.name)}
              aria-label={`Copy pi pi-${icon.name}`}
              className="flex h-24 w-full flex-col items-center justify-center gap-2 px-1 hover:bg-fg hover:text-bg"
            >
              <span className="size-6 [&>svg]:size-6" dangerouslySetInnerHTML={{ __html: icon.svg }} />
              <span className="max-w-full truncate type-label">{copied === icon.name ? "copied" : icon.name}</span>
            </button>
          </li>
        ))}
      </ul>
      <p aria-live="polite" className="sr-only">
        {copied ? `Copied pi pi-${copied}` : ""}
      </p>
      <p className="mt-4 type-label text-fg-muted">PrimeIcons {set.version} © PrimeTek, MIT License</p>
    </div>
  );
}
