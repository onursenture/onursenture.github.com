// Organisations named on the site. `logo` is a path under public/ to a small
// monochrome SVG; until Onur supplies or approves one, OrgMark draws the
// monogram.
export type OrgId = "primetek" | "orkestra" | "etiya" | "bilkent";

export interface Org {
  name: string;
  monogram: string;
  logo?: string;
}

export const ORGS: Record<OrgId, Org> = {
  primetek: { name: "PrimeTek", monogram: "P" },
  orkestra: { name: "Orkestra Studios", monogram: "O" },
  etiya: { name: "Etiya", monogram: "e" },
  bilkent: { name: "Bilkent", monogram: "B" },
};
