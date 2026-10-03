import { describe, expect, it } from "vitest";
import { DEFAULT_VIEW_STATE, parseViewState, viewStateQuery } from "@/lib/work/url-state";

const figs = new Set(["cover", "tokens"]);
const parse = (query: string) => parseViewState(new URLSearchParams(query), figs);

describe("parseViewState", () => {
  it("defaults to no figure", () => {
    expect(parse("")).toEqual(DEFAULT_VIEW_STATE);
    expect(DEFAULT_VIEW_STATE).toEqual({ fig: null });
  });

  it("reads a known fig", () => {
    expect(parse("fig=tokens")).toEqual({ fig: "tokens" });
  });

  it("falls back to no figure for an unknown id", () => {
    expect(parse("fig=ghost")).toEqual(DEFAULT_VIEW_STATE);
  });

  it("ignores the removed ?view, ?tag and ?density params, keeping the figure", () => {
    expect(parse("view=grid&tag=tokens&density=2")).toEqual(DEFAULT_VIEW_STATE);
    expect(parse("view=posts&fig=cover")).toEqual({ fig: "cover" });
  });
});

describe("viewStateQuery", () => {
  it("leaves the default out", () => {
    expect(viewStateQuery(DEFAULT_VIEW_STATE)).toBe("");
  });

  it("writes only ?fig=", () => {
    expect(viewStateQuery({ fig: "cover" })).toBe("?fig=cover");
  });

  it("round-trips through parseViewState", () => {
    expect(parse(viewStateQuery({ fig: "tokens" }).slice(1))).toEqual({ fig: "tokens" });
  });
});
