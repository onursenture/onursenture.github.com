// A work page's only query state is the open figure: ?fig=<media id>. The
// server always renders the page without it; the client reads the real query
// after hydration (components/work/use-view-state.ts). Other params (the old
// ?view, ?tag and ?density) are ignored.

export interface ViewState {
  fig: string | null;
}

export const DEFAULT_VIEW_STATE: ViewState = { fig: null };

interface ParamReader {
  get(name: string): string | null;
}

// An unknown figure id falls back to no figure.
export function parseViewState(params: ParamReader, figs: ReadonlySet<string>): ViewState {
  const fig = params.get("fig");
  return { fig: fig && figs.has(fig) ? fig : null };
}

export function viewStateQuery(state: ViewState): string {
  return state.fig ? `?${new URLSearchParams({ fig: state.fig }).toString()}` : "";
}
