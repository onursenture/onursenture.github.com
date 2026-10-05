import { Empty } from "@/components/sections/empty";
import { SectionRow } from "@/components/ui/section-row";
import { countLabel, theatreArchive } from "@/lib/life/archive";
import { readLifeLog } from "@/lib/life-log/read";
import { THEATRE_PROFILE_URL } from "@/lib/sources/theatre";
import { ArchiveHeader } from "./archive-header";
import { ArchiveMain } from "./archive-main";
import { TileRow } from "./tile-row";

const SOURCE = { label: "tiyatrolar.com.tr", href: THEATRE_PROFILE_URL };

// One row per year (spec §1.4): no months, since tiyatrolar only shows
// relative times. The oldest backfilled year is "and earlier".
export async function TheatreArchive() {
  const years = theatreArchive(await readLifeLog("theatre"));
  const header = <ArchiveHeader title="Theatre" lede="Plays I saw." source={SOURCE} />;
  if (years.length === 0) {
    return (
      <ArchiveMain
        rows={[
          header,
          <SectionRow key="empty" label={null}>
            <Empty>No plays yet.</Empty>
          </SectionRow>,
        ]}
      />
    );
  }
  return (
    <ArchiveMain
      rows={[
        header,
        <div key="years">
          {years.map((group) => (
            <TileRow
              key={group.year}
              id={`year-${group.year}`}
              as="h2"
              heading={<span className="block type-name">{group.year}</span>}
              lines={[countLabel(group.items.length, "play"), ...(group.andEarlier ? ["and earlier"] : [])]}
              items={group.items}
            />
          ))}
        </div>,
      ]}
    />
  );
}
