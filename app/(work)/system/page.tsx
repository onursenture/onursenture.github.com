import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Picture } from "@/components/picture";
import { Empty } from "@/components/sections/empty";
import { SourcesTable } from "@/components/sources/sources-table";
import { ToggleDemo } from "@/components/system/toggle-demo";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ContributionChart } from "@/components/ui/contribution-chart";
import { Cover } from "@/components/ui/cover";
import { DataTable } from "@/components/ui/data-table";
import { DitherRule, DitherStrip, FooterWash } from "@/components/ui/dither";
import { EraStamp } from "@/components/ui/era-stamp";
import { LabAvatar } from "@/components/ui/lab-avatar";
import { LiveClock } from "@/components/ui/live-clock";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import { MetaLabel } from "@/components/ui/meta-label";
import { PrimaryButton } from "@/components/ui/primary-button";
import { RelativeTime } from "@/components/ui/relative-time";
import { SectionRow } from "@/components/ui/section-row";
import { StatusGlyph } from "@/components/ui/status-glyph";
import { TextLink } from "@/components/ui/text-link";
import { type Photo, getPhotos } from "@/lib/content/photos";
import { formatDate } from "@/lib/format";
import { formatRating } from "@/lib/sources/rating";
import { readSourceStatuses } from "@/lib/sources/status";
import { pageMetadata } from "@/lib/metadata";

// The in-code style tile and the S3 review surface. Not in the nav, not
// indexed. Every primitive renders here in whichever theme is active. Sample values are deliberately generic: no invented facts.
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

// Generic sample shape for the specimen, not real data.
const SAMPLE_WEEKS = Array.from({ length: 52 }, (_, i) => ({
  week: `w${i}`,
  count: Math.round(20 + 15 * Math.sin(i / 5) + (i % 7) * 2),
}));

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

  return (
    <main className="flex flex-col py-16">
      <h1 className="type-lead px-4 pb-8 md:px-10">System</h1>

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

      <SectionRow label="Color · 8 tokens" wide>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {SWATCHES.map(([token, swatch]) => (
            <div key={token} className="flex flex-col gap-2">
              <span className={`h-12 border ${swatch}`} />
              <span className="type-meta">{token}</span>
            </div>
          ))}
        </div>
      </SectionRow>

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
        <Specimen name="MediaPlaceholder">
          <div className="grid w-full max-w-lg grid-cols-2 gap-4">
            <MediaPlaceholder label="Placeholder" index={1} />
            <MediaPlaceholder label="Placeholder" index={2} tone="ink" />
          </div>
        </Specimen>
        <Specimen name="PrimaryButton">
          <PrimaryButton href="/system/">Book a call →</PrimaryButton>
        </Specimen>
        <Specimen name="LabAvatar">
          {["alpha", "beta", "gamma", "delta", "epsilon"].map((name) => (
            <LabAvatar key={name} name={name} />
          ))}
        </Specimen>
        <Specimen name="ContributionChart">
          <div className="w-full max-w-120">
            <ContributionChart weeks={SAMPLE_WEEKS} />
          </div>
        </Specimen>
        <Specimen name="FooterWash">
          <div className="w-full">
            <FooterWash />
          </div>
        </Specimen>
      </SectionRow>

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
        <Specimen name="Toggle">
          <ToggleDemo />
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
        <Specimen name="Rating">
          <span className="type-meta">
            {formatRating(3.5)} · {formatRating(4)}
          </span>
          <span className="type-meta text-fg-muted">unrated shows nothing: [{formatRating(null)}]</span>
        </Specimen>
        <Specimen name="Cover">
          <div className="w-24">
            <Cover src="" alt="" />
          </div>
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

      <SectionRow label="Sources" wide>
        <SourcesTable statuses={statuses} />
      </SectionRow>
    </main>
  );
}
