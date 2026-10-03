import { articles } from "./articles";
import { books } from "./books";
import { films } from "./films";
import { photos } from "./photos";
import type { AnySectionDefinition } from "./types";
import { writing } from "./writing";

// Order of sections on /life.
export const lifeSections: AnySectionDefinition[] = [
  films,
  books,
  articles,
  writing,
  photos,
];
