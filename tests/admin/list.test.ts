import { describe, expect, it } from "vitest";
import { insertAt, move, optional, removeAt, replaceAt } from "@/lib/admin/list";

describe("list helpers", () => {
  const list = ["a", "b", "c"];
  it("move an item, leaving the input untouched and ignoring out-of-range moves", () => {
    expect(move(list, 0, 2)).toEqual(["b", "c", "a"]);
    expect(move(list, 2, 0)).toEqual(["c", "a", "b"]);
    expect(move(list, 0, 3)).toEqual(list);
    expect(list).toEqual(["a", "b", "c"]);
  });
  it("insert, remove and replace by index", () => {
    expect(insertAt(list, 1, "x")).toEqual(["a", "x", "b", "c"]);
    expect(removeAt(list, 1)).toEqual(["a", "c"]);
    expect(replaceAt(list, 2, "z")).toEqual(["a", "b", "z"]);
  });
  it("turns blank text into undefined", () => {
    expect(optional("  ")).toBeUndefined();
    expect(optional("2026")).toBe("2026");
  });
});
