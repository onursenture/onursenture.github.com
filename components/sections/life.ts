import { articles } from "./articles";
import { books } from "./books";
import { films } from "./films";
import { notes } from "./notes";
import { photos } from "./photos";
import type { AnySectionDefinition } from "./types";
import { writing } from "./writing";

// Order of sections on /life.
export const lifeSections: AnySectionDefinition[] = [
  films,
  books,
  articles,
  notes,
  writing,
  photos,
];
