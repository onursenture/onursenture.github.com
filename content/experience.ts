import type { OrgId } from "./orgs";

// Roles and dates as on Onur's LinkedIn (read 2026-10-03). Only confirmed facts. PrimeTek products link to their case studies (Sprint 5).
export interface ExperienceChild {
  title: string;
  note: string;
  href?: string;
  // Only for a row without a product page; a linked row reads its page's Years fact.
  years?: string;
}

export interface ExperienceEntry {
  org: OrgId;
  role: string;
  // YYYY-MM
  start: string;
  // YYYY-MM, or null while ongoing.
  end: string | null;
  children: ExperienceChild[];
}

export const experience: ExperienceEntry[] = [
  {
    org: "orkestra",
    role: "Co-founder, designer",
    start: "2013-06",
    end: null,
    children: [{ title: "Nebuu", note: "word game, iOS", years: "2013–now" }],
  },
  {
    org: "primetek",
    role: "Design lead",
    start: "2016-05",
    end: "2026-04",
    children: [
      { title: "PrimeOne", note: "design system", href: "/work/primeone/" },
      { title: "PrimeBlocks", note: "UI blocks", href: "/work/primeblocks/" },
      { title: "PrimeIcons", note: "icon set", href: "/work/primeicons/" },
      { title: "Templates", note: "app templates", href: "/work/templates/" },
    ],
  },
  {
    org: "etiya",
    role: "Design specialist",
    start: "2014-04",
    end: "2016-03",
    children: [],
  },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function month(ym: string): string {
  const [year, m] = ym.split("-");
  return `${MONTHS[Number(m) - 1]} ${year}`;
}

// "May 2016–Apr 2026", "Jun 2013–now".
export function formatSpan(start: string, end: string | null): string {
  return `${month(start)}–${end ? month(end) : "now"}`;
}
