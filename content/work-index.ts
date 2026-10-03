// The home page's selected work, in display order. Only confirmed facts:
// years, roles, eras and links arrive with the case studies (S4).
export interface WorkEntry {
  title: string;
  meta?: string;
  years?: string;
  role?: string;
  era?: string;
  href?: string;
}

export const workIndex: WorkEntry[] = [
  { title: "PrimeOne", meta: "80+ components" },
  { title: "PrimeBlocks", meta: "500 UI blocks" },
  { title: "PrimeIcons", meta: "hand-drawn icon set" },
  { title: "Premium admin dashboards" },
  { title: "nebuu", meta: "ongoing, Orkestra" },
];
