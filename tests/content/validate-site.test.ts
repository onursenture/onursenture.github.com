import { describe, expect, it } from "vitest";
import { productPages } from "@/content/work";
import type { ProductPage } from "@/content/work/types";
import { hasImage } from "@/lib/images/manifest";
import { formatIssue, issuesAt } from "@/lib/content/issues";
import { repoSite } from "@/lib/content/site";
import { validateSite, workIssue } from "@/lib/content/validate-site";

const repo = repoSite();
const withPage = (slug: string, change: (page: ProductPage) => ProductPage) => ({
  ...repo,
  pages: repo.pages.map((page) => (page.slug === slug ? change(page) : page)),
});

describe("validateSite", () => {
  it("accepts the repo content", () => {
    expect(validateSite(repo, hasImage)).toEqual([]);
  });

  it("reports validateWork problems per page document", () => {
    const issues = validateSite(withPage("nebuu", (page) => ({ ...page, intro: " " })), hasImage);
    expect(issues).toEqual([{ doc: "work/nebuu", at: "", message: "intro must not be empty" }]);
  });

  it("rejects a slug that isn't kebab-case", () => {
    const site = { ...repo, pages: [...repo.pages, { ...productPages[0], slug: "Bad Slug" }] };
    expect(validateSite(site, hasImage)).toContainEqual({ doc: "work/Bad Slug", at: "slug", message: 'slug "Bad Slug" is not kebab-case' });
  });

  it("rejects a pin listed twice", () => {
    const site = { ...repo, pins: [...repo.pins, repo.pins[0]] };
    expect(validateSite(site, hasImage)).toEqual([{ doc: "pins", at: "6", message: "primeone/components is listed twice" }]);
  });

  it("rejects an Experience link to a missing page", () => {
    const site = { ...repo, pages: repo.pages.filter((page) => page.slug !== "gonna") };
    expect(validateSite(site, hasImage)).toContainEqual({
      doc: "experience",
      at: "0/children/8",
      message: "Gonna links /work/gonna/, which is not a product page",
    });
  });

  it("asks a linked page for its Years fact", () => {
    const site = withPage("nebuu", (page) => ({ ...page, facts: page.facts.filter((fact) => fact.label !== "Years") }));
    expect(validateSite(site, hasImage)).toEqual([{ doc: "work/nebuu", at: "facts", message: "Experience links this page, so it needs a Years fact" }]);
  });

  it("asks an unlinked Experience row for its own years, and an end after the start", () => {
    const experience = [{ ...repo.experience[2], end: "2013-01", children: [{ title: "Portal", note: "web" }] }];
    expect(validateSite({ ...repo, experience }, hasImage)).toEqual([
      { doc: "experience", at: "0/end", message: "the end is before the start" },
      { doc: "experience", at: "0/children/0", message: "Portal needs a page or its own years" },
    ]);
  });

  it("asks Lab links for https", () => {
    const lab = [{ title: "X", description: "Y", href: "http://x.com" }];
    expect(validateSite({ ...repo, lab }, hasImage)).toEqual([{ doc: "lab", at: "0/href", message: 'link "http://x.com" must be https' }]);
  });

  it("rejects an unknown organisation token in the bio", () => {
    const profile = { ...repo.profile, bio: [["At {acme} since 2020."]] };
    expect(validateSite({ ...repo, profile }, hasImage)).toEqual([{ doc: "profile", at: "bio/0", message: 'unknown organisation "{acme}"' }]);
  });
});

describe("workIssue", () => {
  it("splits validateWork lines into document, place and message", () => {
    expect(workIssue("nebuu/highlights/game: credit \"x\" must be https")).toEqual({ doc: "work/nebuu", at: "highlights/game", message: 'credit "x" must be https' });
    expect(workIssue('duplicate slug "nebuu"')).toEqual({ doc: "work-index", at: "", message: 'duplicate slug "nebuu"' });
  });
});

describe("issues", () => {
  const issues = [
    { doc: "work/nebuu" as const, at: "highlights/game", message: "a" },
    { doc: "work/nebuu" as const, at: "highlights", message: "b" },
    { doc: "work/nebuu" as const, at: "facts", message: "c" },
  ];
  it("formats an issue for a list", () => {
    expect(formatIssue(issues[0])).toBe("work/nebuu highlights/game: a");
    expect(formatIssue({ doc: "lab", at: "", message: "x" })).toBe("lab: x");
  });
  it("selects the issues at a place and below it", () => {
    expect(issuesAt(issues, "work/nebuu", "highlights").map((i) => i.message)).toEqual(["a", "b"]);
  });
});
