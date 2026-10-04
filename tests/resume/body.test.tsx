import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ResumeBody } from "@/components/resume/resume-body";
import { repoSite } from "@/lib/content/site";
import { keepWhole } from "@/lib/resume/pdf/document";
import { type ResumeView, resumeView } from "@/lib/resume/view";

const repo = resumeView(repoSite());
const render = (resume: ResumeView) => renderToStaticMarkup(<ResumeBody resume={resume} bookable={false} />);
const section = (html: string, id: string) => html.slice(html.indexOf(`id="${id}"`), html.indexOf("</section>", html.indexOf(`id="${id}"`)));

describe("ResumeBody", () => {
  it("keeps each product title on one line", () => {
    const html = section(render(repo), "experience");
    expect(html).toMatch(/<span class="whitespace-nowrap"><a [^>]*href="\/work\/harf-marf\/"[^>]*>Harf Marf<\/a><\/span>/);
  });

  it("renders a project title like a Lab row: no arrow inside the site, ↗ when it leaves", () => {
    const projects = [
      { title: "PrimeOne", line: "Design system.", href: "/work/primeone/" },
      { title: "Elsewhere", line: "Off site.", href: "https://example.com/" },
      { title: "Plain", line: "No link." },
    ];
    const html = section(render({ ...repo, projects }), "projects");
    expect(html).not.toContain("→");
    expect(html).toMatch(/<a [^>]*href="\/work\/primeone\/"[^>]*>PrimeOne<\/a> <span class="text-fg-soft">— Design system\.<\/span>/);
    expect(html).toMatch(/<a [^>]*href="https:\/\/example\.com\/"[^>]*>Elsewhere<span aria-hidden="true"> ↗<\/span><\/a> <span class="text-fg-soft">— Off site\.<\/span>/);
    expect(html).toContain('<span class="text-fg">Plain</span> <span class="text-fg-soft">— No link.</span>');
  });
});

describe("resume PDF titles", () => {
  it("joins a product title's words with non-breaking spaces", () => {
    expect(keepWhole("Maç Kaçta")).toBe("Maç Kaçta");
    expect(keepWhole("Theme  Designer")).toBe("Theme  Designer");
    expect(keepWhole("Gonna")).toBe("Gonna");
  });
});
