import { Fragment } from "react";
import { DitherRule } from "@/components/ui/dither";
import { LiveClock } from "@/components/ui/live-clock";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SectionRow } from "@/components/ui/section-row";
import { StatusGlyph } from "@/components/ui/status-glyph";
import { TextLink } from "@/components/ui/text-link";
import { experience } from "@/content/experience";
import { labIndex } from "@/content/lab-index";
import { profile } from "@/content/profile";
import { workIndex } from "@/content/work-index";
import { NAV_ITEMS } from "@/lib/nav";
import { heroImageKey } from "@/lib/work";
import { Bio } from "./bio";
import { Contributions } from "./contributions-row";
import { ExperienceTree } from "./experience-tree";
import { LabGrid } from "./lab-grid";
import { WorkTiles } from "./work-tiles";

// An "All →" style action, only once its section ships (/work/ is always
// there, so its link is written out below). Undefined (not an
// element that renders nothing) so SectionRow leaves out the action cell.
function sectionLink(label: string, href: string) {
  const item = NAV_ITEMS.find((i) => i.href === href);
  return item?.ready ? <TextLink href={href}>{label}</TextLink> : undefined;
}

// The Work home: identity, Lab, work, experience and contributions, separated
// by dither rules.
export function HomeSite() {
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
        profile.available ? (
          <span>
            Open to work <StatusGlyph status="ok" />
          </span>
        ) : undefined
      }
    >
      <h1 className="mb-2.5 type-lead">
        {profile.lead.strong} <span className="text-fg-muted">{profile.lead.rest}</span>
      </h1>
      <Bio paragraphs={profile.bio} />
      {profile.bookingUrl ? (
        <div className="mt-3.5">
          <PrimaryButton href={profile.bookingUrl}>Book a call →</PrimaryButton>
        </div>
      ) : null}
    </SectionRow>,
    labIndex.length > 0 ? (
      <SectionRow key="lab" id="lab" label="Lab" action={sectionLink("All lab", "/lab/")}>
        <LabGrid entries={labIndex} />
      </SectionRow>
    ) : null,
    <SectionRow key="work" id="work" label="Work" action={<TextLink href="/work/">All work</TextLink>}>
      <WorkTiles entries={workIndex.map((entry) => ({ ...entry, image: entry.slug ? heroImageKey(entry.slug) : undefined }))} />
    </SectionRow>,
    <SectionRow key="experience" id="experience" label="Experience" action={sectionLink("Resume", "/resume/")}>
      <ExperienceTree entries={experience} />
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
