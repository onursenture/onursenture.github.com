import { describe, expect, it } from "vitest";
import { DEFAULT_VIEW_STATE, parseViewState, validValues, viewStateQuery } from "@/lib/work/url-state";

const valid = validValues([{ id: "cover" }, { id: "tokens" }], [{ key: "all" }, { key: "3-0" }, { key: "tokens" }]);
const parse = (query: string) => parseViewState(new URLSearchParams(query), valid);

describe("parseViewState", () => {
  it("defaults to Log, All, 1×, no figure", () => {
    expect(parse("")).toEqual(DEFAULT_VIEW_STATE);
    expect(DEFAULT_VIEW_STATE).toEqual({ view: "log", tag: "all", density: "1", fig: null });
  });

  it("reads view, tag, density and fig", () => {
    expect(parse("view=grid&tag=3-0&density=inf&fig=tokens")).toEqual({ view: "grid", tag: "3-0", density: "inf", fig: "tokens" });
    expect(parse("view=index&tag=tokens")).toEqual({ view: "index", tag: "tokens", density: "1", fig: null });
  });

  it("falls back to defaults for unknown values", () => {
    expect(parse("view=wall&tag=nope&density=9&fig=ghost")).toEqual(DEFAULT_VIEW_STATE);
  });

  it("ignores tag in Log and density outside Grid", () => {
    expect(parse("tag=tokens&density=2")).toEqual(DEFAULT_VIEW_STATE);
    expect(parse("view=index&density=2").density).toBe("1");
  });

  it("keeps a figure in any view", () => {
    expect(parse("fig=cover")).toEqual({ ...DEFAULT_VIEW_STATE, fig: "cover" });
  });
});

describe("viewStateQuery", () => {
  it("leaves defaults out", () => {
    expect(viewStateQuery(DEFAULT_VIEW_STATE)).toBe("");
    expect(viewStateQuery({ ...DEFAULT_VIEW_STATE, tag: "tokens", density: "2" })).toBe("");
  });

  it("writes params in a fixed order", () => {
    expect(viewStateQuery({ view: "grid", tag: "3-0", density: "inf", fig: "tokens" })).toBe("?view=grid&tag=3-0&density=inf&fig=tokens");
    expect(viewStateQuery({ view: "index", tag: "all", density: "inf", fig: null })).toBe("?view=index");
    expect(viewStateQuery({ ...DEFAULT_VIEW_STATE, fig: "cover" })).toBe("?fig=cover");
  });

  it("round-trips through parseViewState", () => {
    const state = { view: "grid" as const, tag: "tokens", density: "2" as const, fig: "cover" };
    expect(parse(viewStateQuery(state).slice(1))).toEqual(state);
  });
});
