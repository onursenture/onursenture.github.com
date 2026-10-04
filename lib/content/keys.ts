// Document keys of the admin overlay (Sprint 7 spec §1.2). One key per
// editable unit: a product page is work/<slug>; the rest are singletons.
export const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const SINGLETON_KEYS = ["work-index", "pins", "lab", "profile", "experience"] as const;

export type WorkKey = `work/${string}`;
export type DocKey = WorkKey | (typeof SINGLETON_KEYS)[number];

export function workKey(slug: string): WorkKey {
  return `work/${slug}`;
}

export function slugOfKey(key: string): string | null {
  return key.startsWith("work/") ? key.slice("work/".length) : null;
}

export function isDocKey(value: string): value is DocKey {
  const slug = slugOfKey(value);
  if (slug !== null) return KEBAB.test(slug);
  return (SINGLETON_KEYS as readonly string[]).includes(value);
}
