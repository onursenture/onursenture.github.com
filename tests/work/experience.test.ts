import { describe, expect, it } from "vitest";
import type { ExperienceEntry } from "@/content/experience";
import type { ProductPage } from "@/content/work/types";
import { resolveExperience } from "@/lib/work/experience";

const page: ProductPage = {
  slug: "primeone",
  org: "primetek",
  title: "PrimeOne",
  kind: "design system",
  lead: { strong: "PrimeOne.", rest: "A kit." },
  intro: "A kit.",
  facts: [
    { label: "Role", value: "Design lead" },
    { label: "Years", value: "2022–2026" },
  ],
  blocks: [{ kind: "text", id: "what-i-did", heading: "What I did", body: ["x"] }],
};
const entry = (children: ExperienceEntry["children"]): ExperienceEntry => ({
  org: "primetek",
  role: "Design lead",
  start: "2016-05",
  end: "2026-04",
  children,
});

describe("resolveExperience", () => {
  it("reads a linked product's year from its page's Years fact", () => {
    const [resolved] = resolveExperience([entry([{ title: "PrimeOne", note: "design system", href: "/work/primeone/" }])], [page]);
    expect(resolved.children).toEqual([{ title: "PrimeOne", note: "design system", href: "/work/primeone/", years: "2022–2026" }]);
    expect(resolved.role).toBe("Design lead");
  });

  it("uses a row's own years when it has no page", () => {
    const [resolved] = resolveExperience([entry([{ title: "Nebuu", note: "word game", years: "2013–now" }])], [page]);
    expect(resolved.children[0].years).toBe("2013–now");
    expect(resolved.children[0].href).toBeUndefined();
  });

  it("throws on a link to a page that does not exist, and on a row without a year", () => {
    expect(() => resolveExperience([entry([{ title: "Gone", note: "x", href: "/work/gone/" }])], [page])).toThrow(/not a product page/);
    expect(() => resolveExperience([entry([{ title: "Bare", note: "x" }])], [page])).toThrow(/has no years/);
  });
});
