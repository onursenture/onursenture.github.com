import "server-only";
import { agentIntro } from "@/content/agent-intro";
import { booking, bookingEnabled, calUrl } from "@/content/booking";
import { ORGS } from "@/content/orgs";
import { homeSwitches, profile, socialLinks } from "@/content/profile";
import { safeSpan } from "@/content/experience";
import { getPublishedContent } from "@/lib/content/read";
import { site } from "@/lib/site";
import { experienceViews } from "@/lib/work/views";
import { type AgentInput, bioPlain, workSummary } from "./onur-md";

// Everything /onur.md and /llms.txt say, from the published site (admin
// documents over the repo). `fallback` is true when the repo stands in for an
// unreadable store, so the caller can cache for minutes, like the resume PDF.
export async function agentInput(): Promise<{ input: AgentInput; fallback: boolean }> {
  const { site: content, fallback } = await getPublishedContent();
  const pinnedSlugs = [...new Set(content.pins.map((pin) => pin.slug))];
  const work = pinnedSlugs.flatMap((slug) => {
    const page = content.pages.find((p) => p.slug === slug);
    return page ? [{ title: page.title, summary: workSummary(page.lead), href: `/work/${page.slug}/` }] : [];
  });
  const input: AgentInput = {
    siteUrl: site.url,
    name: profile.name,
    role: profile.role,
    place: profile.location.place,
    available: homeSwitches(content.profile).available,
    intro: agentIntro,
    bio: bioPlain(content.profile.bio),
    experience: experienceViews(content).map((entry) => ({
      org: ORGS[entry.org].name,
      role: entry.role,
      span: safeSpan(entry.start, entry.end),
      products: entry.children.map((child) => ({ title: child.title, href: child.href })),
    })),
    work,
    lab: content.lab.map((entry) => ({ title: entry.title, description: entry.description, year: entry.year, href: entry.href })),
    booking: bookingEnabled() ? booking.types.map((type) => ({ title: type.title, minutes: type.minutes, href: calUrl(type) })) : [],
    socials: socialLinks().map((link) => ({ label: link.label, href: link.href })),
  };
  return { input, fallback };
}
