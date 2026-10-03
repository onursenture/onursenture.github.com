"use client";

import { type StudyView, filterMedia, filterPosts } from "@/lib/work/derive";
import type { IconSet } from "@/lib/work/icons";
import type { ViewState, WorkView } from "@/lib/work/url-state";
import { GridView } from "./grid-view";
import { IconGrid, IconIndex } from "./icon-grid";
import { IndexView } from "./index-view";
import { LogView } from "./log-view";
import { MediaButton } from "./media-button";
import { PostsView } from "./posts-view";
import { ViewBar } from "./view-bar";

const BASE_VIEWS: WorkView[] = ["log", "grid", "index"];
const WITH_POSTS: WorkView[] = [...BASE_VIEWS, "posts"];
const HERO_SIZES = "(min-width: 768px) calc(100vw - 80px), calc(100vw - 32px)";

// Everything under a case study's header: the hero, the view bar and the
// current view. The server renders it with the default state and no
// handlers as the <Suspense> fallback; StudyBrowser drives it after
// hydration.
export function StudyBody({
  study,
  state,
  onChange,
  onOpen,
  icons,
}: {
  study: StudyView;
  state: ViewState;
  onChange?: (patch: Partial<ViewState>) => void;
  onOpen?: (id: string) => void;
  icons?: IconSet;
}) {
  const shown = filterMedia(study.media, state.tag);
  const hasPosts = study.postCount > 0;
  return (
    <div>
      <div className="px-4 pb-8 md:px-10">
        <MediaButton media={study.hero} onOpen={onOpen} sizes={HERO_SIZES} ratio="aspect-[16/10] md:aspect-[21/9]" priority />
      </div>
      <ViewBar
        chips={study.chips}
        postChips={study.postChips}
        views={hasPosts ? WITH_POSTS : BASE_VIEWS}
        state={state}
        onChange={onChange}
        showChips={!icons}
        showDensity={!icons}
      />
      {state.view === "posts" && hasPosts ? (
        <PostsView groups={filterPosts(study.posts, state.tag)} />
      ) : state.view === "grid" ? (
        icons ? <IconGrid set={icons} /> : <GridView media={shown} density={state.density} onOpen={onOpen} />
      ) : state.view === "index" ? (
        icons ? <IconIndex set={icons} /> : <IndexView media={shown} onOpen={onOpen} />
      ) : (
        <LogView study={study} onOpen={onOpen} onShowEntry={(entryId) => onChange?.({ view: "grid", tag: entryId })} />
      )}
    </div>
  );
}
