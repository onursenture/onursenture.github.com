export interface StackEntry {
  name: string;
  href: string;
  // The npm package whose version to show; without it, no version.
  pkg?: string;
  note?: string;
}

export interface StackItem {
  name: string;
  href: string;
  version?: string;
  note?: string;
}

// "16.3.8" → "16", "~0.45.3" → "0.45" (a 0.x major says nothing), else null.
export function shortVersion(range: string): string | null {
  const match = /(\d+)\.(\d+)/.exec(range);
  if (!match) return null;
  return match[1] === "0" ? `0.${match[2]}` : match[1];
}

// The Stack row's items, versions read from package.json at build time. An
// entry whose package isn't installed is left out, so the row can't go stale.
export function stackItems(entries: StackEntry[], deps: Record<string, string>): StackItem[] {
  const items: StackItem[] = [];
  for (const entry of entries) {
    const item: StackItem = { name: entry.name, href: entry.href };
    if (entry.pkg) {
      const range = deps[entry.pkg];
      const version = range ? shortVersion(range) : null;
      if (!version) continue;
      item.version = version;
    }
    if (entry.note) item.note = entry.note;
    items.push(item);
  }
  return items;
}
