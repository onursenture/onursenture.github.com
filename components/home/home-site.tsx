import { Band } from "@/components/ui/band";
import { IndexList } from "@/components/ui/index-row";
import { labIndex } from "@/content/lab-index";
import { profile } from "@/content/profile";
import { workIndex } from "@/content/work-index";
import { LabBand } from "./lab-index";
import { MetaLine } from "./meta-line";
import { OffTheClock } from "./off-the-clock";

// Site view of "/": identity, work index, Lab, then the Off the clock strip.
export function HomeSite() {
  return (
    <main className="flex flex-col gap-16 pt-16 pb-24 md:gap-24 md:pt-24">
      <header className="flex flex-col gap-6">
        <h1 className="max-w-[30ch] type-display-40">{profile.identity ?? profile.name}</h1>
        {profile.meta ? <MetaLine segments={profile.meta} available={profile.available} /> : null}
      </header>
      <Band label="Selected work" id="work">
        <IndexList entries={workIndex} />
      </Band>
      <LabBand entries={labIndex} />
      <OffTheClock />
    </main>
  );
}
