export interface NavItem {
  label: string;
  href: string;
  // Only ready items render; flip the flag when the section ships.
  ready: boolean;
}

// The Work side's IA order (Sprint 4 spec §1). Life is not a nav item: the
// Life switch in the header reaches it. Notes returns in Sprint 9.
export const NAV_ITEMS: NavItem[] = [
  { label: "Work", href: "/work/", ready: true },
  { label: "Lab", href: "/lab/", ready: false },
  { label: "Resume", href: "/resume/", ready: false },
];

export function readyItems(items: NavItem[] = NAV_ITEMS): NavItem[] {
  return items.filter((item) => item.ready);
}

export function isActive(item: NavItem, pathname: string): boolean {
  return pathname.startsWith(item.href);
}
