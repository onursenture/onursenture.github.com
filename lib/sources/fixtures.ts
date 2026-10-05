import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseGithub } from "./github";
import { parseGoodreadsShelf } from "./goodreads";
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

// Same limits as goodreads.fetch.
const CURRENTLY_READING_LIMIT = 10;

function readFixture(name: string): Promise<string> {
  return readFile(join(process.cwd(), "tests", "fixtures", name), "utf8");
}

const loaders: { [K in SourceId]: () => Promise<SourceData<K>> } = {
  letterboxd: async () => parseLetterboxd(await readFixture("letterboxd.xml")),
  goodreads: async () => ({
    currentlyReading: await parseGoodreadsShelf(
      await readFixture("goodreads-currently-reading.xml"),
      CURRENTLY_READING_LIMIT,
    ),
    read: await parseGoodreadsShelf(await readFixture("goodreads-read.xml")),
  }),
  instapaper: async () => parseInstapaper(JSON.parse(await readFixture("instapaper.json"))),
  writing: async () => parseWriting(await readFixture("writing.xml")),
  github: async () => parseGithub(JSON.parse(await readFixture("github.json"))),
  theatre: async () => parseActivity(JSON.parse(await readFixture("theatre-activity.json")).html).watches,
};

export function loadFixtureData<K extends SourceId>(id: K): Promise<SourceData<K>> {
  return loaders[id]();
}
