// A work page's view state lives in the query: ?view=grid|index|posts, ?tag=<chip
// key>, ?density=2|inf and ?fig=<media id>. Defaults are left out. The server
// always renders the defaults; the client reads the real query after
// hydration (components/work/use-view-state.ts).

export type WorkView = "log" | "grid" | "index" | "posts";
export type Density = "1" | "2" | "inf";

export interface ViewState {
  view: WorkView;
  tag: string;
  density: Density;
  fig: string | null;
}

export interface ValidValues {
  tags: ReadonlySet<string>;
  figs: ReadonlySet<string>;
  // The views the study offers: Posts only when it has posts.
  views: ReadonlySet<WorkView>;
}

export const DEFAULT_VIEW_STATE: ViewState = { view: "log", tag: "all", density: "1", fig: null };

const BASE_VIEWS: readonly WorkView[] = ["log", "grid", "index"];

interface ParamReader {
  get(name: string): string | null;
}

// `extraTags` adds more valid tag keys (a study's post chips); `views`
// defaults to Log, Grid and Index.
export function validValues(
  media: { id: string }[],
  chips: { key: string }[],
  extraTags: { key: string }[] = [],
  views: ReadonlySet<WorkView> = new Set(BASE_VIEWS),
): ValidValues {
  return {
    tags: new Set([...chips, ...extraTags].map((chip) => chip.key)),
    figs: new Set(media.map((item) => item.id)),
    views,
  };
}

// Unknown or out-of-place values fall back to the defaults: tag only applies
// outside the Log, density only in the Grid, and Posts only where the study
// has posts.
export function parseViewState(params: ParamReader, valid: ValidValues): ViewState {
  const viewParam = params.get("view") ?? "";
  const view = valid.views.has(viewParam as WorkView) ? (viewParam as WorkView) : "log";
  const tagParam = params.get("tag");
  const tag = view !== "log" && tagParam && valid.tags.has(tagParam) ? tagParam : "all";
  const densityParam = params.get("density");
  const density: Density = view === "grid" && (densityParam === "2" || densityParam === "inf") ? densityParam : "1";
  const figParam = params.get("fig");
  const fig = figParam && valid.figs.has(figParam) ? figParam : null;
  return { view, tag, density, fig };
}

export function viewStateQuery(state: ViewState): string {
  const params = new URLSearchParams();
  if (state.view !== "log") params.set("view", state.view);
  if (state.view !== "log" && state.tag !== "all") params.set("tag", state.tag);
  if (state.view === "grid" && state.density !== "1") params.set("density", state.density);
  if (state.fig) params.set("fig", state.fig);
  const query = params.toString();
  return query ? `?${query}` : "";
}
