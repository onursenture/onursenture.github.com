import { describe, expect, it, vi } from "vitest";
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

  it("fails soft on published data that breaks the rules: warns, drops a dead link, leaves the year empty", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const [resolved] = resolveExperience(
      [
        entry([
          { title: "Gone", note: "x", href: "/work/gone/" },
          { title: "Gone with years", note: "x", href: "/work/gone/", years: "2014" },
          { title: "Bare", note: "x" },
        ]),
      ],
      [page],
    );
    expect(resolved.children).toEqual([
      { title: "Gone", note: "x", years: "" },
      { title: "Gone with years", note: "x", years: "2014" },
      { title: "Bare", note: "x", href: undefined, years: "" },
    ]);
    expect(warn).toHaveBeenCalledTimes(3);
    warn.mockRestore();
  });

  it("falls back to the row's own years when the linked page has no Years fact", () => {
    const bare = { ...page, facts: page.facts.filter((fact) => fact.label !== "Years") };
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const [resolved] = resolveExperience([entry([{ title: "PrimeOne", note: "x", href: "/work/primeone/" }])], [bare]);
    expect(resolved.children[0]).toEqual({ title: "PrimeOne", note: "x", href: "/work/primeone/", years: "" });
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it("shows an unfinished draft row quietly", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const [resolved] = resolveExperience(
      [entry([{ title: "Bare", note: "x" }, { title: "Gone", note: "x", href: "/work/gone/" }])],
      [page],
      { loose: true },
    );
    expect(resolved.children.map((child) => child.years)).toEqual(["", ""]);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
