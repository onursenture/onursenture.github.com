import { firstSentence } from "@/lib/resume/view";
import { type AgentInput, absoluteUrl, escapeLinkText } from "./onur-md";

// /llms.txt (llmstxt.org; Sprint 11b spec §3.2): an H1, a one-line summary
// quote, then H2 sections of links. Built from the same input as /onur.md.
export function buildLlmsTxt(input: AgentInput): string {
  const { siteUrl } = input;
  const item = (title: string, href: string, note?: string) => `- [${escapeLinkText(title)}](${absoluteUrl(siteUrl, href)})${note ? `: ${note}` : ""}`;
  const section = (heading: string, lines: string[]) => (lines.length > 0 ? [`## ${heading}`, "", ...lines, ""] : []);
  const summary = input.intro[0] ? firstSentence(input.intro[0]) : `${input.role}.`;
  const lines = [
    `# ${input.name}`,
    "",
    `> ${summary}`,
    "",
    ...section("Profile", [
      item("onur.md", "/onur.md", "the whole site as one Markdown profile"),
      item("Resume", "/resume/", "experience, projects, skills and education"),
      item("Resume (PDF)", "/resume.pdf", "the same resume as a PDF"),
    ]),
    ...section(
      "Work",
      input.work.map((w) => item(w.title, w.href, w.summary)),
    ),
    ...section("Optional", [
      item("Notes", "/notes/", "short notes"),
      item("Life", "/life/", "films, books, theatre, saved articles and photos"),
      item("Changelog", "/changelog/", "every release of the site"),
      item("Colophon", "/colophon/", "how the site is built"),
    ]),
  ];
  return `${lines.join("\n").trimEnd()}\n`;
}
