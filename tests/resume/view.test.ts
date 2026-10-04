import { describe, expect, it, vi } from "vitest";
import { repoSite } from "@/lib/content/site";
import { firstSentence, resumeView } from "@/lib/resume/view";

const repo = repoSite();

describe("resumeView", () => {
  it("joins each Experience entry, in its order, with the resume's bullets and the entry's products", () => {
    const view = resumeView(repo);
    expect(view.name).toBe("Onur Senture");
    expect(view.role).toBe("Designer who builds");
    expect(view.place).toBe("Ankara");
    expect(view.roles.map((role) => role.org)).toEqual(repo.experience.map((entry) => entry.org));
    const primetek = view.roles.find((role) => role.org === "primetek")!;
    expect(primetek).toMatchObject({ orgName: "PrimeTek", role: "Design lead", span: "May 2016–Apr 2026" });
    expect(primetek.bullets).toEqual(repo.resume.roles.find((role) => role.org === "primetek")!.bullets);
    expect(primetek.products[0]).toEqual({ title: "PrimeOne", href: "/work/primeone/" });
  });

  it("gives an Experience org without resume bullets an empty list, and leaves out bullets for an org not in Experience", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const site = { ...repo, resume: { ...repo.resume, roles: repo.resume.roles.filter((role) => role.org !== "etiya") } };
    expect(resumeView(site).roles.find((role) => role.org === "etiya")!.bullets).toEqual([]);
    const gone = { ...repo, experience: repo.experience.filter((entry) => entry.org !== "etiya") };
    expect(resumeView(gone).roles.map((role) => role.org)).not.toContain("etiya");
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("Etiya is not in Experience"));
    warn.mockRestore();
  });

  it("ignores an empty role for an org that left Experience without a warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const roles = repo.resume.roles.map((role) => (role.org === "etiya" ? { ...role, bullets: [] } : role));
    const gone = { ...repo, experience: repo.experience.filter((entry) => entry.org !== "etiya"), resume: { ...repo.resume, roles } };
    expect(resumeView(gone).roles.map((role) => role.org)).not.toContain("etiya");
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("drops a project link to a missing page, and hides blank contact fields", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const site = {
      ...repo,
      resume: { ...repo.resume, contact: { email: " ", linkedin: "" }, projects: [{ title: "Gone", line: "x", href: "/work/gone/" }] },
    };
    const view = resumeView(site);
    expect(view.projects).toEqual([{ title: "Gone", line: "x" }]);
    expect(view.email).toBeNull();
    expect(view.linkedin).toBeNull();
    warn.mockRestore();
  });

  it("builds the LinkedIn URL from the handle", () => {
    const site = { ...repo, resume: { ...repo.resume, contact: { email: "a@b.co", linkedin: "someone" } } };
    expect(resumeView(site).linkedin).toEqual({ handle: "someone", url: "https://www.linkedin.com/in/someone/" });
    expect(resumeView(site).email).toBe("a@b.co");
  });

  it("stays quiet and prints no 'undefined' span for a half-filled draft in loose mode", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const site = { ...repo, experience: [{ ...repo.experience[0], start: "" }] };
    expect(resumeView(site, { loose: true }).roles[0].span).toBe("");
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("firstSentence", () => {
  it("takes the summary's first sentence for the meta description", () => {
    expect(firstSentence("Designer who builds. Ten years at PrimeTek.")).toBe("Designer who builds.");
    expect(firstSentence("No full stop")).toBe("No full stop");
    expect(firstSentence("  ")).toBe("");
  });

  it("finds the first sentence across a line break", () => {
    expect(firstSentence("Designer who builds\nfull apps. Ten years at PrimeTek.")).toBe("Designer who builds\nfull apps.");
  });
});
