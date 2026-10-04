import { Fragment } from "react";
import { DitherRule } from "@/components/ui/dither";
import { LiveClock } from "@/components/ui/live-clock";
import { SectionRow } from "@/components/ui/section-row";
import { StatusGlyph } from "@/components/ui/status-glyph";
import { TextLink } from "@/components/ui/text-link";
import { bookingEnabled } from "@/content/booking";
import { homeSwitches, profile } from "@/content/profile";
import { NAV_ITEMS } from "@/lib/nav";
import type { HomeContent } from "@/lib/work/views";
import { Bio } from "./bio";
import { Contributions } from "./contributions-row";
import { ExperienceList } from "./experience-list";
import { LabGrid } from "./lab-grid";
import { SelectedWork } from "./selected-work";

// An "All →" style action, only once its section ships. Undefined (not an
// element that renders nothing) so SectionRow leaves out the action cell.
function sectionLink(label: string, href: string) {
  const item = NAV_ITEMS.find((i) => i.href === href);
  return item?.ready ? <TextLink href={href}>{label}</TextLink> : undefined;
}

// The Work home: identity, Lab, Selected work, experience and contributions,
// separated by dither rules.
export function HomeSite({ content }: { content: HomeContent }) {
  const { pins } = content;
  const switches = homeSwitches(content.profile);
  const rows = [
    <SectionRow
      key="identity"
      id="identity"
      labelAs="div"
      label={
        <>
          <span className="text-fg">{profile.role}</span>
          <br />
          <span className="text-fg-muted">
            {profile.location.place}, <LiveClock timeZone={profile.location.timeZone} place={profile.location.place} />
          </span>
        </>
      }
      action={
        switches.available ? (
          <span>
            Open to work <StatusGlyph status="ok" />
          </span>
        ) : undefined
      }
    >
      <h1 className="mb-2.5 type-lead">
        {content.profile.lead.strong} <span className="text-fg-muted">{content.profile.lead.rest}</span>
      </h1>
      <Bio paragraphs={content.profile.bio} />
      {switches.bookOnHome && bookingEnabled() ? (
        // A text link, not a button: the home has no call to action (Sprint 8).
        <p className="mt-2 type-body">
          <TextLink href="/book/" className="text-accent">
            Book a call
          </TextLink>
        </p>
      ) : null}
    </SectionRow>,
    content.lab.length > 0 ? (
      <SectionRow key="lab" id="lab" label="Lab" action={sectionLink("All lab", "/lab/")}>
        <LabGrid entries={content.lab} />
      </SectionRow>
    ) : null,
    pins.length > 0 ? <SelectedWork key="selected-work" pins={pins} /> : null,
    <SectionRow key="experience" id="experience" label="Experience" action={sectionLink("Resume", "/resume/")}>
      <ExperienceList entries={content.experience} />
    </SectionRow>,
    <SectionRow
      key="contributions"
      id="contributions"
      label="Contributions"
      // A year of weeks is ~690px, wider than the 480px content column.
      wide
      action={<TextLink href={`https://github.com/${profile.social.github}`}>GitHub</TextLink>}
    >
      <Contributions />
    </SectionRow>,
  ].filter(Boolean);

  return (
    <main className="pb-8">
      {rows.map((row, index) => (
        <Fragment key={index}>
          {index > 0 ? <DitherRule className="mx-4 md:mx-10" /> : null}
          {row}
        </Fragment>
      ))}
    </main>
  );
}
