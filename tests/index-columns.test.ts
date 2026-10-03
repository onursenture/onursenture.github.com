import { describe, expect, it } from "vitest";
import { visibleColumns } from "@/lib/index-columns";

interface Row {
  title: string;
  years?: string;
  role?: string;
}

describe("visibleColumns", () => {
  it("returns nothing when no entry has a value", () => {
    const rows: Row[] = [{ title: "a" }, { title: "b", years: "", role: "  " }];
    expect(visibleColumns(rows, ["years", "role"])).toEqual([]);
  });

  it("returns only the columns at least one entry fills, in the order asked", () => {
    const rows: Row[] = [{ title: "a" }, { title: "b", role: "Lead" }];
    expect(visibleColumns(rows, ["years", "role"])).toEqual(["role"]);
    expect(visibleColumns(rows, ["role", "years"])).toEqual(["role"]);
  });

  it("returns every column once each has a value somewhere", () => {
    const rows: Row[] = [{ title: "a", years: "2020" }, { title: "b", role: "Lead" }];
    expect(visibleColumns(rows, ["years", "role"])).toEqual(["years", "role"]);
  });

  it("returns nothing for an empty list", () => {
    expect(visibleColumns([] as Row[], ["years", "role"])).toEqual([]);
  });
});
