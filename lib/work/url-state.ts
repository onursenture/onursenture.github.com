// A work page's view state lives in the query: ?view=grid|index, ?tag=<chip
// key>, ?density=2|inf and ?fig=<media id>. Defaults are left out. The server
// always renders the defaults; the client reads the real query after
// hydration (components/work/use-view-state.ts).

export type WorkView = "log" | "grid" | "index";
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
}

export const DEFAULT_VIEW_STATE: ViewState = { view: "log", tag: "all", density: "1", fig: null };

const VIEWS: readonly string[] = ["log", "grid", "index"];

interface ParamReader {
  get(name: string): string | null;
}

export function validValues(media: { id: string }[], chips: { key: string }[]): ValidValues {
  return { tags: new Set(chips.map((chip) => chip.key)), figs: new Set(media.map((item) => item.id)) };
}

// Unknown or out-of-place values fall back to the defaults: tag only applies
// outside the Log, density only in the Grid.
export function parseViewState(params: ParamReader, valid: ValidValues): ViewState {
  const viewParam = params.get("view") ?? "";
  const view = VIEWS.includes(viewParam) ? (viewParam as WorkView) : "log";
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
