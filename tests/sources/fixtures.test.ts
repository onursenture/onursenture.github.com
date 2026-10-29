import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { loadFixtureData } from "@/lib/sources/fixtures";
import { getSource } from "@/lib/sources/registry";
import { SOURCE_IDS } from "@/lib/sources/types";

describe("loadFixtureData", () => {
  it.each(SOURCE_IDS)("%s fixtures validate against the source schema and are not empty", async (id) => {
    const definition = getSource(id);
    const data = await loadFixtureData(id);
    expect(definition.schema.parse(data)).toEqual(data);
    expect(definition.count(data)).toBeGreaterThan(0);
  });

  it("merges the goodreads recordings into the recorded snapshot", async () => {
    const books = await loadFixtureData("goodreads");
    // The profile shows three of four; the fourth comes from the snapshot.
    expect(books.currentlyReading.map((b) => b.title)).toEqual([
      "Harry Potter and the Deathly Hallows (Harry Potter, #7)",
      "Educated",
      "Mutluluğun Mimarisi",
      "The Design of Everyday Things",
    ]);
    expect(books.read.map((b) => b.title)).toContain("Hacı Komünist");
    expect(books.read.find((b) => b.title === "Bonsai")?.readAt).toBe("");
    const reading = new Set(books.currentlyReading.map((b) => b.link));
    expect(books.read.filter((b) => reading.has(b.link))).toEqual([]);
  });
});
