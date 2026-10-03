import { describe, expect, it } from "vitest";
import { archive, caseStudies } from "@/content/work";
import { workSettings } from "@/content/work/settings";
import { hasImage } from "@/lib/images/manifest";
import { getArchiveView, getCaseStudies, getStudyView } from "@/lib/work";
import { validateWork } from "@/lib/work/validate";

describe("content/work", () => {
  it("passes every registry check", () => {
    expect(validateWork(caseStudies, archive, hasImage)).toEqual([]);
  });

  it("lists the four PrimeTek case studies in display order", () => {
    expect(caseStudies.map((s) => s.slug)).toEqual(["primeone", "primeblocks", "primeicons", "templates"]);
    for (const study of caseStudies) expect(study.org).toBe("primetek");
  });

  it("gives every entry a source, so each note can be checked", () => {
    for (const study of caseStudies) {
      expect(study.entries.length).toBeGreaterThan(0);
      for (const entry of study.entries) expect(entry.source, `${study.slug}/${entry.id}`).toMatch(/^https:\/\//);
    }
  });

  it("states Onur's role on every case study", () => {
    for (const study of caseStudies) expect(study.facts.find((f) => f.label === "Role")?.value).toBe("Design lead");
  });

  it("credits Genesis to its designer only", () => {
    const genesis = caseStudies.find((s) => s.slug === "templates")!.entries.find((e) => e.id === "genesis")!;
    expect(genesis.credits).toEqual([{ name: "Ümit Çelik", href: "https://x.com/umitceliks" }]);
  });

  it("fills PrimeOne's posts, each in order of the registry's entries and with a derived URL", () => {
    const primeone = caseStudies.find((s) => s.slug === "primeone")!;
    const view = getStudyView(primeone);
    expect(view.postCount).toBe(12);
    expect(view.postChips.map((c) => c.key)).toEqual(["all", "4-0", "3-0", "2-2", "2-1", "2-0", "kit-2022"]);
    for (const post of view.posts.flatMap((g) => g.items)) expect(post.url).toBe(`https://x.com/${post.account.slice(1)}/status/${post.id}`);
  });

  it("gives every case study posts that are one short line, newest first, with a unique id", () => {
    for (const study of caseStudies) {
      const posts = study.posts ?? [];
      expect(posts.length, study.slug).toBeGreaterThan(0);
      expect(new Set(posts.map((p) => p.id)).size, study.slug).toBe(posts.length);
      for (const post of posts) {
        expect(post.summary.length, `${study.slug}/${post.id}`).toBeLessThanOrEqual(110);
        expect(post.summary, `${study.slug}/${post.id}`).not.toMatch(/[!#]/u);
        expect(post.date >= "2016-05", `${study.slug}/${post.id}`).toBe(true);
      }
      const dates = posts.map((p) => p.date);
      expect(dates, study.slug).toEqual([...dates].sort().reverse());
    }
  });

  it("never states an unconfirmed headline number", () => {
    const text = JSON.stringify({ caseStudies, archive });
    for (const claim of ["80+", "500 blocks", "25+"]) expect(text).not.toContain(claim);
  });

  it("ships the Figma links switch off", () => {
    expect(workSettings.figmaLinks).toBe(false);
  });

  it("exposes no figma refs through lib/work while figmaLinks is off", () => {
    if (workSettings.figmaLinks) return;
    const media = [...getCaseStudies().flatMap((study) => getStudyView(study).media), ...getArchiveView().media];
    expect(media.length).toBeGreaterThan(0);
    for (const item of media) expect(item.figma, item.id).toBeNull();
  });

  it("marks exactly the nine remastered or all-new templates", () => {
    const templates = caseStudies.find((s) => s.slug === "templates")!;
    expect(
      templates.entries
        .filter((e) => e.remaster)
        .map((e) => e.id)
        .sort(),
    ).toEqual(
      [
        "poseidon-remastered-2020",
        "ultima-definitive",
        "verona-remastered",
        "atlantis-remastered",
        "apollo-2022",
        "ultima-reloaded",
        "diamond-remastered",
        "poseidon-remastered",
        "avalon-remastered",
      ].sort(),
    );
  });
});
