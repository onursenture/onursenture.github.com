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

export function resolveExperience(entries: ExperienceEntry[], pages: ProductPage[]): ExperienceView[] {
  return entries.map((entry) => ({
    ...entry,
    children: entry.children.map((child): ExperienceChildView => {
      const page = child.href ? pages.find((item) => `/work/${item.slug}/` === child.href) : undefined;
      if (child.href && !page) throw new Error(`experience: ${child.title} links ${child.href}, which is not a product page`);
      const years = page ? page.facts.find((fact) => fact.label === "Years")?.value : child.years;
      if (!years) throw new Error(`experience: ${child.title} has no years`);
      return { title: child.title, note: child.note, href: child.href, years };
    }),
  }));
}
