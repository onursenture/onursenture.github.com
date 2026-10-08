import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Empty } from "@/components/sections/empty";
import { EAGER_TILES } from "@/components/ui/cover";
import { SectionRow } from "@/components/ui/section-row";
import { profile } from "@/content/profile";
import { countLabel, filmArchive } from "@/lib/life/archive";
import { readLifeLog } from "@/lib/life-log/read";
import { ArchiveHeader } from "./archive-header";
import { ArchiveMain } from "./archive-main";
import { TileRow } from "./tile-row";
import { YearIndex } from "./year-index";
import { YearMonths } from "./year-months";

const SOURCE = { label: "Letterboxd", href: `https://letterboxd.com/${profile.social.letterboxd}/` };
const base = "/life/films/";

// /life/films/ (year = null: the newest year) and /life/films/<year|undated>/.
export async function FilmsArchive({ year }: { year: string | null }) {
  const archive = filmArchive(await readLifeLog("letterboxd"));
  const header = <ArchiveHeader title="Films" lede="What I watched." source={SOURCE} />;
  const current = year ?? (archive.years[0] ? String(archive.years[0].year) : archive.undated.length > 0 ? "undated" : null);
  if (current === null) {
    return (
      <ArchiveMain
        rows={[
          header,
          <SectionRow key="empty" label={null}>
            <Empty>No films yet.</Empty>
          </SectionRow>,
        ]}
      />
    );
  }

  let body: ReactNode;
  if (current === "undated") {
    if (archive.undated.length === 0) notFound();
    body = (
      <div>
        <TileRow id="undated" as="h2" heading="Undated" lines={[countLabel(archive.undated.length, "film")]} items={archive.undated} eager={EAGER_TILES} />
      </div>
    );
  } else {
    const group = /^\d{4}$/.test(current) ? archive.years.find((g) => g.year === Number(current)) : undefined;
    if (!group) notFound();
    body = <YearMonths group={group} noun="film" eager={EAGER_TILES} />;
  }

  const entries = [
    ...archive.years.map((g) => ({ label: String(g.year), href: `${base}${g.year}/`, current: String(g.year) === current, doto: true })),
    ...(archive.undated.length > 0 ? [{ label: "Undated", href: `${base}undated/`, current: current === "undated", doto: false }] : []),
  ];
  return (
    <ArchiveMain
      rows={[
        header,
        <SectionRow key="years" label="Years" wide>
          <YearIndex entries={entries} />
        </SectionRow>,
        body,
      ]}
    />
  );
}
