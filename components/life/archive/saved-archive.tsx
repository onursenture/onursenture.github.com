import { Empty } from "@/components/sections/empty";
import { SectionRow } from "@/components/ui/section-row";
import { profile } from "@/content/profile";
import { savedItems } from "@/lib/life/archive";
import { readEnrichments } from "@/lib/life-log/read";
import { readSource } from "@/lib/sources/read";
import { ArchiveHeader } from "./archive-header";
import { ArchiveMain } from "./archive-main";
import { SavedList } from "./saved-list";

const SOURCE = { label: "Instapaper", href: `https://www.instapaper.com/p/${profile.social.instapaper}` };

export async function SavedArchive() {
  const [articles, enrichments] = await Promise.all([readSource("instapaper"), readEnrichments()]);
  const items = savedItems(articles.data, enrichments);
  return (
    <ArchiveMain
      rows={[
        <ArchiveHeader key="header" title="Saved" lede="Articles I liked." source={SOURCE} />,
        items.length > 0 ? (
          <SavedList key="list" items={items} />
        ) : (
          <SectionRow key="empty" label={null}>
            <Empty>Nothing saved yet.</Empty>
          </SectionRow>
        ),
      ]}
    />
  );
}
