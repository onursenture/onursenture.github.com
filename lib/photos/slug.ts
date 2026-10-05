// A photo's URL slug (spec §1.2): from the title, set at first publish and
// never changed. Only [a-z0-9-], so "_" can stand in for "no photos" in
// generateStaticParams.

export const PLACEHOLDER_PHOTO_SLUG = "_";
const MAX_LENGTH = 80;

// Before lower-casing: "İ".toLowerCase() is "i" plus a combining dot.
const TURKISH: Record<string, string> = { ç: "c", ğ: "g", ı: "i", İ: "i", ö: "o", ş: "s", ü: "u", Ç: "c", Ğ: "g", Ö: "o", Ş: "s", Ü: "u" };

export function slugify(title: string): string {
  const slug = title
    .replace(/[çğıİöşüÇĞÖŞÜ]/g, (letter) => TURKISH[letter])
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_LENGTH)
    .replace(/-+$/, "");
  return slug || "photo";
}

export function freeSlug(title: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  const base = slugify(title);
  if (!used.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!used.has(candidate)) return candidate;
  }
}
