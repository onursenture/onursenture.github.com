import { VIEWS } from "./view/views";

export interface NavItem {
  label: string;
  href: string;
  // Only ready items render; flip the flag when the section ships.
  ready: boolean;
  // Other path prefixes that belong to this item.
  also?: string[];
}

// Foundation IA order. Photos is not an item: it lives under Life.
export const NAV_ITEMS: NavItem[] = [
  { label: "Work", href: "/work/", ready: false },
  { label: "Lab", href: "/lab/", ready: false },
  { label: "Resume", href: "/resume/", ready: false },
  { label: "Notes", href: "/notes/", ready: false },
  { label: "Life", href: "/life/", ready: true, also: ["/photos/"] },
];

// First item of the dashboard sidebar; the site links home from the name.
export const OVERVIEW: NavItem = { label: "Overview", href: "/", ready: true };

export function readyItems(items: NavItem[] = NAV_ITEMS): NavItem[] {
  return items.filter((item) => item.ready);
}

// usePathname() returns the rewritten /site/... path while prerendering and
// the browser's clean path after hydration. Comparing clean paths keeps the
// server HTML and the client render identical.
export function cleanPath(pathname: string): string {
  const [, first, ...rest] = pathname.split("/");
  return (VIEWS as readonly string[]).includes(first) ? `/${rest.join("/")}` : pathname;
}

export function isActive(item: NavItem, pathname: string): boolean {
  const path = cleanPath(pathname);
  if (item.href === "/") return path === "/";
  return [item.href, ...(item.also ?? [])].some((prefix) => path.startsWith(prefix));
}
