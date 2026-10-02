import { describe, expect, it } from "vitest";
import { letterboxd } from "@/lib/sources/letterboxd";
import { sources } from "@/lib/sources/registry";
import { SOURCE_IDS, type SourceRegistry } from "@/lib/sources/types";

describe("registry", () => {
  it("has one definition per source id, filed under its own id", () => {
    expect(Object.keys(sources).sort()).toEqual([...SOURCE_IDS].sort());
    for (const [key, definition] of Object.entries(sources)) {
      expect(definition.id).toBe(key);
    }
  });

  it("rejects a definition filed under another source's key at compile time", () => {
    // Checked by `npm run typecheck`: the directive below fails the build if
    // the line after it ever stops being a type error.
    // @ts-expect-error letterboxd is not a "writing" definition
    const misfiled: SourceRegistry = { ...sources, writing: letterboxd };
    expect(misfiled.writing.id).toBe("letterboxd");
  });
});
