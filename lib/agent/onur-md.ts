// /onur.md (Sprint 11b spec §3.1): the site as one Markdown profile for AI
// agents. Pure: lib/agent/read.ts gathers the input from the published
// content. An empty section is left out; there is never an email address.
import { ORGS } from "@/content/orgs";
import type { PinRef } from "@/content/pins";
import type { BioSegment } from "@/content/profile";
import type { ProductPage } from "@/content/work/types";
import { buildPins } from "@/lib/work/derive";

export interface AgentInput {
  siteUrl: string;
  name: string;
  role: string;
  place: string;
  available: boolean;
  intro: string[];
  bio: string[];
  experience: { org: string; role: string; span: string; products: { title: string; href?: string }[] }[];
  work: { title: string; summary: string; href: string }[];
  lab: { title: string; description: string; year?: string; href?: string }[];
  booking: { title: string; minutes: number; href: string }[];
  socials: { label: string; href: string }[];
}

export function absoluteUrl(siteUrl: string, href: string): string {
  return /^https?:\/\//.test(href) ? href : `${siteUrl}${href}`;
}

// The home bio as plain paragraphs: an organisation mark becomes its name.
export function bioPlain(bio: BioSegment[][]): string[] {
  return bio.map((paragraph) => paragraph.map((segment) => (typeof segment === "string" ? segment : ORGS[segment.org].name)).join(""));
}

// A product's summary: the lead's continuation, since the lead's first words
// are the product name the line already starts with. The first words stand in
// only when there is no continuation.
export function workSummary(lead: { strong: string; rest: string }): string {
  return oneLine(lead.rest) || oneLine(lead.strong);
}

// One line of prose: a newline can't break a list item.
export function oneLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

// The home's Selected work, as /onur.md lists it: the pages behind the pins
// the home shows (buildPins, so a stale ref is left out and a pinned image
// the order doesn't list is appended), each page once, in pin order.
export function selectedWork(pages: ProductPage[], order: PinRef[]): AgentInput["work"] {
  const slugs = [...new Set(buildPins(pages, order, () => undefined).map((pin) => pin.slug))];
  return slugs.flatMap((slug) => {
    const page = pages.find((p) => p.slug === slug);
    return page ? [{ title: page.title, summary: workSummary(page.lead), href: `/work/${page.slug}/` }] : [];
  });
}

// Link text can't hold an unescaped bracket.
export function escapeLinkText(value: string): string {
  return value.replace(/[[\]]/g, (bracket) => `\\${bracket}`);
}

function link(siteUrl: string, title: string, href: string): string {
  return `[${escapeLinkText(title)}](${absoluteUrl(siteUrl, href)})`;
}

function section(heading: string, lines: string[]): string[] {
  return lines.length > 0 ? [`## ${heading}`, "", ...lines, ""] : [];
}

export function buildOnurMd(input: AgentInput): string {
  const { siteUrl } = input;
  const profile = [`- Role: ${input.role}`, `- Location: ${input.place}`, ...(input.available ? ["- Open to work"] : [])];
  const experience = input.experience.map((entry) => {
    const products = entry.products.map((p) => (p.href ? link(siteUrl, p.title, p.href) : escapeLinkText(p.title))).join(", ");
    const head = `- **${escapeLinkText(entry.org)}**, ${entry.role}${entry.span ? ` (${entry.span})` : ""}`;
    return products ? `${head}: ${products}` : head;
  });
  const work = input.work.map((w) => `- ${link(siteUrl, w.title, w.href)}: ${oneLine(w.summary)}`);
  const lab = input.lab.map((entry) => {
    const name = entry.href ? link(siteUrl, entry.title, entry.href) : escapeLinkText(entry.title);
    return `- ${name}${entry.year ? ` (${entry.year})` : ""}: ${oneLine(entry.description)}`;
  });
  const resume = [`- ${link(siteUrl, "Resume", "/resume/")}`, `- ${link(siteUrl, "Resume (PDF)", "/resume.pdf")}`];
  const contact = [
    ...input.booking.map((b) => `- ${link(siteUrl, `Book a call: ${b.title} (${b.minutes} min)`, b.href)}`),
    ...input.socials.map((s) => `- ${link(siteUrl, s.label, s.href)}`),
  ];
  const more = [
    ["Notes", "/notes/"],
    ["Life", "/life/"],
    ["Changelog", "/changelog/"],
    ["Colophon", "/colophon/"],
  ].map(([title, href]) => `- ${link(siteUrl, title, href)}`);

  const lines = [
    `# ${input.name}`,
    "",
    ...input.intro.flatMap((paragraph) => [paragraph, ""]),
    "## Profile",
    "",
    ...profile,
    "",
    ...input.bio.flatMap((paragraph) => [paragraph, ""]),
    ...section("Experience", experience),
    ...section("Selected work", work),
    ...section("Lab", lab),
    ...section("Resume", resume),
    ...section("Contact", contact),
    ...section("More", more),
  ];
  return `${lines.join("\n").trimEnd()}\n`;
}
