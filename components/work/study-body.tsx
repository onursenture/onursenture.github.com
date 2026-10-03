"use client";

import { DitherRule } from "@/components/ui/dither";
import type { StudyView } from "@/lib/work/derive";
import type { IconSet } from "@/lib/work/icons";
import { IconGrid } from "./icon-grid";
import { LogView } from "./log-view";
import { MediaButton } from "./media-button";

// The hero sits in the content column (480px from lg).
const HERO_SIZES = "(min-width: 1024px) 480px, calc(100vw - 32px)";

// Everything under a case study's header: the hero (in the content column)
// and the release Log. PrimeIcons adds its live icon set after the Log (page
// content, not a view). The server renders it with no handlers and no icons as
// the <Suspense> fallback; StudyBrowser drives it after hydration.
export function StudyBody({
  study,
  onOpen,
  icons,
}: {
  study: StudyView;
  onOpen?: (id: string) => void;
  icons?: IconSet;
}) {
  return (
    <div>
      <div className="grid px-4 pb-8 md:px-10 lg:grid-cols-[200px_minmax(0,480px)_1fr] lg:gap-7">
        <div className="lg:col-start-2">
          <MediaButton media={study.hero} onOpen={onOpen} sizes={HERO_SIZES} ratio="aspect-[16/10]" priority />
        </div>
      </div>
      <LogView study={study} onOpen={onOpen} />
      {icons ? (
        <>
          <DitherRule className="mx-4 md:mx-10" />
          <IconGrid set={icons} />
        </>
      ) : null}
    </div>
  );
}
