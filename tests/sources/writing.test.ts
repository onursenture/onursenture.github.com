import { describe, expect, it } from "vitest";
import { parseWriting } from "@/lib/sources/writing";
import { fixture } from "../helpers/fixtures";

describe("parseWriting", () => {
  it("parses Bear Blog Atom entries", async () => {
    expect(await parseWriting(fixture("writing.xml"))).toEqual([
      { title: "Second post", link: "https://w00f.org/second-post/", date: "2026-09-20T10:00:00.000Z" },
      { title: "First post", link: "https://w00f.org/first-post/", date: "2026-08-01T08:30:00.000Z" },
    ]);
  });
});
