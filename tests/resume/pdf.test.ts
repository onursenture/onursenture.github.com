import { describe, expect, it } from "vitest";
import { repoSite } from "@/lib/content/site";
import { renderResumePdf } from "@/lib/resume/pdf/document";
import { resumeView } from "@/lib/resume/view";

const pageCount = (pdf: Buffer) => (pdf.toString("latin1").match(/\/Type \/Page[^s]/g) ?? []).length;

describe("resume PDF", () => {
  it("renders the repo resume as an A4 PDF of one or two pages", async () => {
    const pdf = await renderResumePdf(resumeView(repoSite()));
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(pdf.toString("latin1")).toMatch(/\/MediaBox \[0 0 595\.28\d* 841\.89\d*\]/);
    expect(pageCount(pdf)).toBeGreaterThanOrEqual(1);
    expect(pageCount(pdf)).toBeLessThanOrEqual(2);
  }, 30_000);

  it("changes when the resume changes", async () => {
    const site = repoSite();
    const a = await renderResumePdf(resumeView(site));
    const b = await renderResumePdf(resumeView({ ...site, resume: { ...site.resume, summary: `${site.resume.summary} One more sentence.` } }));
    expect(a.equals(b)).toBe(false);
  }, 30_000);
});
