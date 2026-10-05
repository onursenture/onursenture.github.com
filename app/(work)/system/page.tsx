import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ArchiveTile } from "@/components/life/archive/archive-tile";
import { SelectedWorkItem } from "@/components/home/selected-work";
import { LifeSwitch } from "@/components/life-switch";
import { Picture } from "@/components/picture";
import { Empty } from "@/components/sections/empty";
import { SourcesTable } from "@/components/sources/sources-table";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Cover } from "@/components/ui/cover";
import { DataTable } from "@/components/ui/data-table";
import { DitherRule, DitherStrip, FooterWash, PlaceholderWash } from "@/components/ui/dither";
import { EraStamp } from "@/components/ui/era-stamp";
import { Heatmap } from "@/components/ui/heatmap";
import { LiveClock } from "@/components/ui/live-clock";
import { MetaLabel } from "@/components/ui/meta-label";
import { OrgMark } from "@/components/ui/org-mark";
import { PrimaryButton } from "@/components/ui/primary-button";
import { RelativeTime } from "@/components/ui/relative-time";
import { SectionRow } from "@/components/ui/section-row";
import { StatusGlyph } from "@/components/ui/status-glyph";
import { TextLink } from "@/components/ui/text-link";
import { MediaFigure } from "@/components/work/media-figure";
import { ORGS, type OrgId } from "@/content/orgs";
import { type Photo, getPhotos } from "@/lib/content/photos";
import { formatDate } from "@/lib/format";
import { readSourceStatuses } from "@/lib/sources/status";
import { pageMetadata } from "@/lib/metadata";
import { getPins } from "@/lib/work";

// The Sprint 4 style tile: every token, type class, dither specimen and
// primitive in the light palette, plus a Life palette preview. Not
// in the nav, not indexed. Sample values are deliberately generic: no invented
// facts.
export const metadata: Metadata = pageMetadata("System", { robots: { index: false, follow: false } });

const TYPE_STYLES = [
  ["type-name", "ONUR SENTURE"],
  ["type-lead", "Designer who builds."],
  ["type-body", "Body text in mono, 13 on 21."],
  ["type-meta", "May 2016–Apr 2026 · 2,133"],
  ["type-label", "LABEL · 11"],
  ["type-boot", "last watched: Love & Other Drugs 3.5"],
] as const;

// Literal class names so Tailwind generates them.
const SWATCHES = [
  ["--color-bg", "bg-bg"],
  ["--color-fg", "bg-fg"],
  ["--color-fg-muted", "bg-fg-muted"],
  ["--color-fg-soft", "bg-fg-soft"],
  ["--color-line", "bg-line"],
  ["--color-accent", "bg-accent"],
  ["--color-danger", "bg-danger"],
  ["--color-danger-bg", "bg-danger-bg"],
] as const;

// Generic sample for the Heatmap specimen, not real data: 20 weeks, levels 0–4.
const SAMPLE_WEEKS = Array.from({ length: 20 }, (_, w) => ({
  days: Array.from({ length: 7 }, (_, d) => {
    const date = new Date(Date.UTC(2026, 0, 4 + w * 7 + d)).toISOString().slice(0, 10);
    const level = (w * 3 + d * 2) % 5;
    return { date, count: level, level };
  }),
}));
const SAMPLE_CONTRIBUTIONS = {
  total: SAMPLE_WEEKS.flatMap((week) => week.days).reduce((sum, day) => sum + day.count, 0),
  weeks: SAMPLE_WEEKS,
};

// A 16:10 slot holding only the placeholder wash.
function WashTile() {
  return (
    <span className="relative block aspect-[16/10] overflow-hidden border">
      <PlaceholderWash />
    </span>
  );
}

function Swatches() {
  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
      {SWATCHES.map(([token, swatch]) => (
        <div key={token} className="flex flex-col gap-2">
          <span className={`h-12 border ${swatch}`} />
          <span className="type-meta">{token}</span>
        </div>
      ))}
    </div>
  );
}

function Specimen({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div data-primitive={name} className="flex flex-col gap-3 border-b py-6 last:border-b-0">
      <MetaLabel>{name}</MetaLabel>
      <div className="flex flex-wrap items-center gap-4">{children}</div>
    </div>
  );
}

const photoColumns = [
  { header: "Title", cell: (photo: Photo) => photo.title },
  { header: "Camera", cell: (photo: Photo) => photo.camera ?? "", mono: true },
  { header: "Date", cell: (photo: Photo) => formatDate(photo.date), mono: true, align: "right" as const },
];

export default async function SystemPage() {
  const photos = await getPhotos();
  const statuses = await readSourceStatuses();
  const [photo] = photos;
  // A real pin (no invented sample), for the work specimens.
  const [pin] = await getPins();

  return (
    <main className="pb-8">
      <h1 className="type-lead px-4 pt-16 pb-6 md:px-10">System</h1>
      <DitherRule className="mx-4 md:mx-10" />

      <SectionRow label="Type · 6 styles" wide>
        <div className="flex flex-col">
          {TYPE_STYLES.map(([style, sample]) => (
            <div key={style} data-type={style} className="flex flex-col gap-2 border-b py-4 last:border-b-0">
              <MetaLabel>{style}</MetaLabel>
              <p className={style}>{sample}</p>
            </div>
          ))}
        </div>
      </SectionRow>
      <DitherRule className="mx-4 md:mx-10" />
      <SectionRow label="Color · 8 tokens" wide>
        <Swatches />
      </SectionRow>
      <DitherRule className="mx-4 md:mx-10" />
      <SectionRow label="Dither" wide>
        <Specimen name="DitherStrip">
          <div className="w-full">
            <DitherStrip />
          </div>
        </Specimen>
        <Specimen name="DitherRule">
          <div className="w-full">
            <DitherRule />
          </div>
        </Specimen>
        <Specimen name="PlaceholderWash">
          <div className="grid w-full max-w-lg grid-cols-2 gap-4">
            <WashTile />
            <WashTile />
          </div>
        </Specimen>
        <Specimen name="MediaFigure">
          {pin ? (
            <div className="w-full max-w-sm">
              <MediaFigure media={pin.image} sizes="384px" />
            </div>
          ) : null}
        </Specimen>
        <Specimen name="SelectedWorkItem">
          {pin ? (
            <ul className="w-full max-w-sm">
              <SelectedWorkItem pin={pin} sizes="384px" />
            </ul>
          ) : null}
        </Specimen>
        <Specimen name="PrimaryButton">
          <PrimaryButton href="/system/">Book a call →</PrimaryButton>
        </Specimen>
        <Specimen name="Heatmap">
          <Heatmap data={SAMPLE_CONTRIBUTIONS} />
        </Specimen>
        <Specimen name="FooterWash">
          <div className="w-full">
            <FooterWash />
          </div>
        </Specimen>
      </SectionRow>
      <DitherRule className="mx-4 md:mx-10" />
      <SectionRow label="Primitives" wide>
        <Specimen name="MetaLabel">
          <MetaLabel>Label</MetaLabel>
          <MetaLabel status="ok">With a glyph</MetaLabel>
        </Specimen>
        <Specimen name="StatusGlyph">
          <span className="type-body">
            <StatusGlyph status="ok" /> ok · <StatusGlyph status="late" /> late ·{" "}
            <StatusGlyph status="empty" /> empty · <StatusGlyph status="error" /> error · → link · × close
          </span>
        </Specimen>
        <Specimen name="Chip">
          <Chip>live</Chip>
          <Chip tone="danger">error</Chip>
        </Specimen>
        <Specimen name="EraStamp">
          <EraStamp parts={["Year", "Platform", "Era"]} />
        </Specimen>
        <Specimen name="TextLink">
          <TextLink href="/life/">Internal link</TextLink>
          <TextLink href="https://github.com/onursenture">External link</TextLink>
        </Specimen>
        <Specimen name="Button">
          <Button variant="primary">Primary</Button>
          <Button variant="ghost">Ghost →</Button>
          <Button variant="text">Text</Button>
        </Specimen>
        <Specimen name="OrgMark">
          {(Object.keys(ORGS) as OrgId[]).map((org) => (
            <span key={org} className="type-body">
              <OrgMark org={org} /> {ORGS[org].name}
            </span>
          ))}
        </Specimen>
        <Specimen name="LifeSwitch">
          <LifeSwitch on={false} />
          <LifeSwitch on />
        </Specimen>
        <Specimen name="RelativeTime">
          <span className="type-meta">
            {photo ? <RelativeTime iso={`${photo.date}T00:00:00.000Z`} /> : null}
          </span>
        </Specimen>
        <Specimen name="LiveClock">
          <span className="type-meta">
            ANKARA <LiveClock timeZone="Europe/Istanbul" place="Ankara" />
          </span>
        </Specimen>
        <Specimen name="Cover">
          <div className="w-24">
            <Cover src="" alt="" />
          </div>
        </Specimen>
        <Specimen name="ArchiveTile">
          <ul className="grid w-48 grid-cols-2 gap-x-2.5">
            <ArchiveTile item={{ key: "a", title: "A film title that wraps", meta: ["Sep 8 · ↻"], href: "", image: "" }} />
            <ArchiveTile item={{ key: "b", title: "İki", meta: ["Ankara Devlet Tiyatrosu"], href: "", image: "" }} />
          </ul>
        </Specimen>
        <Specimen name="DataTable">
          <div className="grid w-full gap-4 md:grid-cols-2">
            <DataTable columns={photoColumns} rows={photos} rowKey={(p) => p.slug} caption="Photos" />
            <DataTable columns={photoColumns} rows={[]} rowKey={(p) => p.slug} />
          </div>
        </Specimen>
        <Specimen name="Empty">
          <Empty />
        </Specimen>
        <Specimen name="Picture">
          {photo ? (
            <div className="w-full max-w-sm">
              <Picture image={photo.image} alt={photo.title} sizes="384px" />
            </div>
          ) : null}
        </Specimen>
      </SectionRow>
      <DitherRule className="mx-4 md:mx-10" />
      <SectionRow label="Life palette" wide>
        {/* Proves the dark tokens and the dither repaint inside a Life subtree on a light page. */}
        <div data-side="life" data-testid="life-palette" className="flex flex-col gap-6 bg-bg p-6 text-fg">
          <Swatches />
          <p className="type-boot">last watched: Love & Other Drugs 3.5</p>
          <div className="grid max-w-lg grid-cols-2 gap-4">
            <WashTile />
            <WashTile />
          </div>
        </div>
      </SectionRow>
      <DitherRule className="mx-4 md:mx-10" />
      <SectionRow label="Sources" wide>
        <SourcesTable statuses={statuses} />
      </SectionRow>
    </main>
  );
}
