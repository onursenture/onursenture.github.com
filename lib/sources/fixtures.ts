import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseGithub } from "./github";
import { booksSchema, mergeBooks, parseProfile, parseYearInBooks } from "./goodreads";
import { parseInstapaper } from "./instapaper";
import { parseLetterboxd } from "./letterboxd";
import { parseActivity } from "./theatre";
import type { SourceData } from "./registry";
import type { SourceId } from "./types";
import { parseWriting } from "./writing";

// Fixture data mode (SOURCE_FIXTURES=1): lets /life be designed and tested
// with real rows and no database. The recorded upstream responses in
// tests/fixtures/ go through the same parsers the live fetchers use. Dev and
// CI only; never set this on Vercel.

// Goodreads builds on its stored snapshot (see goodreads.ts), so its fixture
// is a recorded RSS-era snapshot plus the two recorded pages, merged at a
// fixed time so fixture mode is deterministic.
const GOODREADS_FIXTURE_NOW = new Date("2026-10-29T09:00:00.000Z");

function readFixture(name: string): Promise<string> {
  return readFile(join(process.cwd(), "tests", "fixtures", name), "utf8");
}

const loaders: { [K in SourceId]: () => Promise<SourceData<K>> } = {
  letterboxd: async () => parseLetterboxd(await readFixture("letterboxd.xml")),
  goodreads: async () =>
    mergeBooks({
      profile: parseProfile(await readFixture("goodreads-profile.html")),
      yearBooks: parseYearInBooks(await readFixture("goodreads-year-2026.html")),
      previous: booksSchema.parse(JSON.parse(await readFixture("goodreads-snapshot.json"))),
      now: GOODREADS_FIXTURE_NOW,
    }),
  instapaper: async () => parseInstapaper(JSON.parse(await readFixture("instapaper.json"))),
  writing: async () => parseWriting(await readFixture("writing.xml")),
  github: async () => parseGithub(JSON.parse(await readFixture("github.json"))),
  theatre: async () => parseActivity(JSON.parse(await readFixture("theatre-activity.json")).html).watches,
};

export function loadFixtureData<K extends SourceId>(id: K): Promise<SourceData<K>> {
  return loaders[id]();
}
