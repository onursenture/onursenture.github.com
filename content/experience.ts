import type { OrgId } from "./orgs";

// Roles and dates as on Onur's LinkedIn (read 2026-10-03). Only confirmed facts. Every product links its page; the row's year comes from that page (lib/work/experience.ts).
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
    children: [
      { title: "Nebuu", note: "word game", href: "/work/nebuu/" },
      { title: "Rebound Line", note: "arcade game", href: "/work/rebound-line/" },
      { title: "Hi Jump", note: "arcade game", href: "/work/hi-jump/" },
      { title: "İmparator", note: "football card game", href: "/work/imparator/" },
      { title: "Harf Marf", note: "word puzzle", href: "/work/harf-marf/" },
      { title: "Beatografi", note: "beat marketplace", href: "/work/beatografi/" },
      { title: "count.do", note: "countdown app", href: "/work/countdo/" },
      { title: "Maç Kaçta", note: "football fixtures", href: "/work/mac-kacta/" },
      { title: "Gonna", note: "social agenda", href: "/work/gonna/" },
    ],
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
      { title: "PrimeStore", note: "template store", href: "/work/primestore/" },
      { title: "Theme Designer", note: "theme editor", href: "/work/theme-designer/" },
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
