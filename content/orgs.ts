// Organisations named on the site. `logo` is a path under public/ to a 64px
// PNG of the organisation's own logo (taken from its LinkedIn page,
// 2026-10-03); without one, OrgMark draws the monogram.
export type OrgId = "primetek" | "orkestra" | "etiya" | "bilkent";

export interface Org {
  name: string;
  monogram: string;
  logo?: string;
}

export const ORGS: Record<OrgId, Org> = {
  primetek: { name: "PrimeTek", monogram: "P", logo: "/logos/primetek.png" },
  orkestra: { name: "Orkestra Studios", monogram: "O", logo: "/logos/orkestra.png" },
  etiya: { name: "Etiya", monogram: "e", logo: "/logos/etiya.png" },
  bilkent: { name: "Bilkent", monogram: "B", logo: "/logos/bilkent.png" },
};
