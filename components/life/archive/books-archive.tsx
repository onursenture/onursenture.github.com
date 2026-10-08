import { Empty } from "@/components/sections/empty";
import { EAGER_TILES } from "@/components/ui/cover";
import { SectionRow } from "@/components/ui/section-row";
import { profile } from "@/content/profile";
import { bookArchive, countLabel } from "@/lib/life/archive";
import { readSource } from "@/lib/sources/read";
import { ArchiveHeader } from "./archive-header";
import { ArchiveMain } from "./archive-main";
import { TileRow } from "./tile-row";
import { YearMonths } from "./year-months";

const SOURCE = { label: "Goodreads", href: `https://www.goodreads.com/${profile.social.goodreads}` };

export async function BooksArchive() {
  const archive = bookArchive((await readSource("goodreads")).data);
  const rows = [<ArchiveHeader key="header" title="Books" lede="What I read." source={SOURCE} />];
  // Only the first tile row on the page loads eagerly.
  let eager = EAGER_TILES;
  if (archive.reading.length > 0) {
    // Wrapped so the row is a first child: no hairline next to the dither rule.
    rows.push(
      <div key="reading">
        <TileRow as="h2" heading="Reading now" items={archive.reading} eager={eager} />
      </div>,
    );
    eager = 0;
  }
  for (const group of archive.years) {
    rows.push(<YearMonths key={group.year} group={group} noun="book" eager={eager} />);
    eager = 0;
  }
  if (archive.undated.length > 0) {
    rows.push(
      <div key="undated">
        <TileRow as="h2" heading="Undated" lines={[countLabel(archive.undated.length, "book")]} items={archive.undated} eager={eager} />
      </div>,
    );
  }
  if (rows.length === 1) {
    rows.push(
      <SectionRow key="empty" label={null}>
        <Empty>No books yet.</Empty>
      </SectionRow>,
    );
  }
  return <ArchiveMain rows={rows} />;
}
