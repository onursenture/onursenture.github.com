import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Picture } from "@/components/picture";
import { Empty } from "@/components/sections/empty";
import { SourcesTable } from "@/components/sources/sources-table";
import { ToggleDemo } from "@/components/system/toggle-demo";
import { Band } from "@/components/ui/band";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Cover } from "@/components/ui/cover";
import { DataTable } from "@/components/ui/data-table";
import { EraStamp } from "@/components/ui/era-stamp";
import { IndexRow } from "@/components/ui/index-row";
import { LiveClock } from "@/components/ui/live-clock";
import { MetaLabel } from "@/components/ui/meta-label";
import { RelativeTime } from "@/components/ui/relative-time";
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
  ["type-display-160", "Aa"],
  ["type-display-96", "One system"],
  ["type-display-64", "Two densities"],
  ["type-display-40", "Same tokens, two readings."],
  ["type-sans-28", "Selected work"],
  ["type-sans-28-medium", "Selected work"],
  ["type-sans-20", "Section title"],
  ["type-sans-20-medium", "Section title"],
  ["type-sans-16", "Site body text sits in a ~680px measure at line-height 1.6."],
  ["type-sans-16-medium", "Site body text sits in a ~680px measure at line-height 1.6."],
  ["type-sans-14", "Navigation, buttons and compact body."],
  ["type-sans-14-medium", "Navigation, buttons and compact body."],
  ["type-sans-13", "Sidebar items, table cells, panel headers."],
  ["type-sans-13-medium", "Sidebar items, table cells, panel headers."],
  ["type-mono-13", "2026 · 1,284 · 12:00"],
  ["type-mono-12", "2026 · 1,284 · 12:00"],
  ["type-mono-11", "2026 · 1,284 · 12:00"],
] as const;

// Literal class names so Tailwind generates them.
const SWATCHES = [
  ["--color-bg", "bg-bg"],
  ["--color-surface", "bg-surface"],
  ["--color-fg", "bg-fg"],
  ["--color-fg-muted", "bg-fg-muted"],
  ["--color-line", "bg-line"],
  ["--color-line-strong", "bg-line-strong"],
  ["--color-danger", "bg-danger"],
  ["--color-danger-bg", "bg-danger-bg"],
] as const;

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
    <main className="flex flex-col gap-16 py-16">
      <h1 className="type-display-64">System</h1>

      <Band label="Type" source="17 styles">
        <div className="flex flex-col">
          {TYPE_STYLES.map(([style, sample]) => (
            <div key={style} data-type={style} className="flex flex-col gap-2 border-b py-4 last:border-b-0">
              <MetaLabel>{style}</MetaLabel>
              <p className={style}>{sample}</p>
            </div>
          ))}
        </div>
      </Band>

      <Band label="Color" source="8 tokens">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {SWATCHES.map(([token, swatch]) => (
            <div key={token} className="flex flex-col gap-2">
              <span className={`h-12 border ${swatch}`} />
              <span className="type-mono-12">{token}</span>
            </div>
          ))}
        </div>
      </Band>

      <Band label="Primitives">
        <Specimen name="MetaLabel">
          <MetaLabel>Label</MetaLabel>
          <MetaLabel status="ok">With a glyph</MetaLabel>
        </Specimen>
        <Specimen name="StatusGlyph">
          <span className="type-sans-16">
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
          <span className="type-mono-12">
            {photo ? <RelativeTime iso={`${photo.date}T00:00:00.000Z`} /> : null}
          </span>
        </Specimen>
        <Specimen name="LiveClock">
          <span className="type-mono-12">
            ANKARA <LiveClock timeZone="Europe/Istanbul" place="Ankara" />
          </span>
        </Specimen>
        <Specimen name="Rating">
          <span className="type-mono-12">
            {formatRating(3.5)} · {formatRating(4)}
          </span>
          <span className="type-mono-12 text-fg-muted">unrated shows nothing: [{formatRating(null)}]</span>
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
        <Specimen name="Band">
          <div className="w-full">
            <Band label="Label" source="Source" href="/life/">
              <p className="type-sans-16">Band content.</p>
            </Band>
          </div>
        </Specimen>
        <Specimen name="IndexRow">
          <div className="w-full">
            <IndexRow entry={{ years: "Year", title: "Title", meta: "meta", role: "Role", era: "Era" }} />
            <IndexRow entry={{ title: "Linked row", meta: "the whole row is the link", href: "/life/" }} />
            <IndexRow entry={{ title: "Plain row", meta: "no link, no year, no role" }} />
            <IndexRow entry={{ title: "With a status", meta: "◐ wip", status: "late", statusLabel: "in progress" }} />
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
      </Band>

      <Band label="Sources">
        <SourcesTable statuses={statuses} />
      </Band>
    </main>
  );
}
