export interface NavItem {
  label: string;
  href: string;
  // The section has shipped: links to it may render (the home's section actions).
  ready: boolean;
  // Also listed in the header nav.
  inHeader: boolean;
}

// The Work side's IA order (Sprint 4 spec §1). Resume shipped in Sprint 8
// without a header entry: it is reached from the home's Experience row, so the
// header still shows no nav. The product pages are reached from the home page
// (Selected work, Experience), not the header: there is no /work/ index (it
// redirects to /). Life is not a nav item: the Life switch in the header
// reaches it. Notes returns in Sprint 9.
export const NAV_ITEMS: NavItem[] = [
  { label: "Lab", href: "/lab/", ready: false, inHeader: true },
  { label: "Resume", href: "/resume/", ready: true, inHeader: false },
];

export function readyItems(items: NavItem[] = NAV_ITEMS): NavItem[] {
  return items.filter((item) => item.ready);
}

// The header nav: ready items that are listed there.
export function headerItems(items: NavItem[] = NAV_ITEMS): NavItem[] {
  return items.filter((item) => item.ready && item.inHeader);
}

export function isActive(item: NavItem, pathname: string): boolean {
  return pathname.startsWith(item.href);
}
