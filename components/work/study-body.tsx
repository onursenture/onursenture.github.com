"use client";

import type { StudyView } from "@/lib/work/derive";
import type { ViewState } from "@/lib/work/url-state";
import { LogView } from "./log-view";
import { MediaButton } from "./media-button";

const HERO_SIZES = "(min-width: 768px) calc(100vw - 80px), calc(100vw - 32px)";

// Everything under a case study's header: the hero and the release log. A
// client component so StudyBrowser (Task 5) can drive it. The server renders
// it with no handlers as the <Suspense> fallback.
export function StudyBody({
  study,
  onChange,
  onOpen,
}: {
  study: StudyView;
  onChange?: (patch: Partial<ViewState>) => void;
  onOpen?: (id: string) => void;
}) {
  return (
    <div>
      <div className="px-4 pb-8 md:px-10">
        <MediaButton media={study.hero} onOpen={onOpen} sizes={HERO_SIZES} ratio="aspect-[16/10] md:aspect-[21/9]" priority />
      </div>
      <LogView study={study} onOpen={onOpen} onShowEntry={(entryId) => onChange?.({ view: "grid", tag: entryId })} />
    </div>
  );
}
