import { articles } from "./articles";
import { books } from "./books";
import { films } from "./films";
import { notes } from "./notes";
import { photos } from "./photos";
import { theatre } from "./theatre";
import type { AnySectionDefinition } from "./types";
import { writing } from "./writing";

// Order of sections on /life (Sprint 10): the archives first, then the
// authored and synced streams.
export const lifeSections: AnySectionDefinition[] = [
  films,
  books,
  theatre,
  articles,
  notes,
  writing,
  photos,
];
