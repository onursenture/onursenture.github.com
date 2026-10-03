import { describe, expect, it } from "vitest";
import { parseViewState, viewStateQuery } from "@/lib/work/url-state";

const NONE = { fig: null };
const figs = new Set(["cover", "tokens"]);
const parse = (query: string) => parseViewState(new URLSearchParams(query), figs);

describe("parseViewState", () => {
  it("defaults to no figure", () => {
    expect(parse("")).toEqual(NONE);
  });

  it("reads a known fig", () => {
    expect(parse("fig=tokens")).toEqual({ fig: "tokens" });
  });

  it("falls back to no figure for an unknown id", () => {
    expect(parse("fig=ghost")).toEqual(NONE);
  });

  it("ignores the removed ?view, ?tag and ?density params, keeping the figure", () => {
    expect(parse("view=grid&tag=tokens&density=2")).toEqual(NONE);
    expect(parse("view=posts&fig=cover")).toEqual({ fig: "cover" });
  });
});

describe("viewStateQuery", () => {
  it("leaves the default out", () => {
    expect(viewStateQuery(NONE)).toBe("");
  });

  it("writes only ?fig=", () => {
    expect(viewStateQuery({ fig: "cover" })).toBe("?fig=cover");
  });

  it("round-trips through parseViewState", () => {
    expect(parse(viewStateQuery({ fig: "tokens" }).slice(1))).toEqual({ fig: "tokens" });
  });
});
