import type { ExperienceEntry } from "@/content/experience";
import type { ProductPage } from "@/content/work/types";

// The home's Experience rows with their year column. A linked product reads
// its year from its page's Years fact, so the row and the page never drift;
// a row without a page carries its own `years`.

export interface ExperienceChildView {
  title: string;
  note: string;
  href?: string;
  years: string;
}

export interface ExperienceView extends Omit<ExperienceEntry, "children"> {
  children: ExperienceChildView[];
}

// Published content fails soft: validateSite refuses a publish that breaks
// these rules and lib/work/index.ts gates the repo content at build time, so a
// row that still breaks them (data changed underneath) warns and renders
// without its link or year instead of taking the home down. `loose` (the admin
// preview of a draft, where a half-filled row is normal) does the same quietly.
export function resolveExperience(entries: ExperienceEntry[], pages: ProductPage[], { loose = false }: { loose?: boolean } = {}): ExperienceView[] {
  const warn = (message: string) => {
    if (!loose) console.warn(`[experience] ${message}`);
  };
  return entries.map((entry) => ({
    ...entry,
    children: entry.children.map((child): ExperienceChildView => {
      const page = child.href ? pages.find((item) => `/work/${item.slug}/` === child.href) : undefined;
      if (child.href && !page) {
        warn(`${child.title} links ${child.href}, which is not a product page; showing it without the link`);
        return { title: child.title, note: child.note, years: child.years ?? "" };
      }
      const years = (page ? page.facts.find((fact) => fact.label === "Years")?.value : undefined) || child.years;
      if (!years) warn(`${child.title} has no years`);
      return { title: child.title, note: child.note, href: child.href, years: years ?? "" };
    }),
  }));
}
