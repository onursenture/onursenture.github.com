import type { ProductPage } from "./types";

// Facts: .superpowers/research/orkestra-projects.md §2 and orkestra-answers.md.
// "#1 in Turkey's word-game category" is self-reported (orkestra.co, Dec 2014),
// published with its year on Onur's say-so.
export const nebuu: ProductPage = {
  slug: "nebuu",
  org: "orkestra",
  title: "Nebuu",
  kind: "word game",
  lead: {
    strong: "Nebuu.",
    rest: "A word-guessing party game: the phone on your forehead, friends giving clues.",
  },
  intro:
    "Orkestra's longest-running product, in the App Store since August 2013 and still updated. It was #1 in Turkey's word-game category in 2014.",
  facts: [
    { label: "Role", value: "Co-founder, designer" },
    { label: "Years", value: "2013–now" },
    { label: "At", value: "Orkestra Studios" },
    { label: "Platform", value: "iOS, Android" },
  ],
  links: [
    { label: "App Store", href: "https://apps.apple.com/tr/app/nebuu-kelime-tahmin-oyunu/id689774499" },
    { label: "Google Play", href: "https://play.google.com/store/apps/details?id=com.orkestra.NebuuLite" },
    { label: "nebuu.com", href: "https://nebuu.com/" },
  ],
  blocks: [
    {
      kind: "then",
      id: "then",
      year: "2013",
      body: [
        "Heads Up!, the forehead game, reached the US App Store on 2 May 2013. Nebuu followed on 6 August, made for Turkish players, with decks for local pop culture, cities and each year's in-jokes.",
      ],
      sources: [
        { label: "Heads Up! on the App Store", href: "https://apps.apple.com/us/app/heads-up/id623592465" },
        { label: "Nebuu on the App Store", href: "https://apps.apple.com/tr/app/nebuu-tahmin-oyunu-full/id681748644" },
      ],
    },
    {
      kind: "text",
      id: "what-i-did",
      heading: "What I did",
      body: ["As a co-founder I designed Nebuu: the app, its cards and nebuu.com, and every update since 2013."],
    },
    {
      kind: "text",
      id: "decks",
      heading: "Decks",
      body: [
        "The word list grew with the game: an English-learning deck in 2017, 100 decks by 2021, Nebuu Çocuk, a kids' deck written with two psychologists, and 28 new decks in 2024. Today it holds more than 30,000 Turkish words.",
      ],
    },
    {
      kind: "text",
      id: "editions",
      heading: "Editions",
      body: ["Indovina Chi è brought the game to Italy in 2015 with all-Italian content, and Guessy was the English edition in 2016."],
      links: [{ label: "Indovina Chi è", href: "https://apps.apple.com/tr/app/indovina-chi-%C3%A8/id927913928" }],
    },
    {
      kind: "images",
      id: "highlights",
      heading: "Highlights",
      columns: 3,
      images: [
        { id: "game", caption: "Game", pin: { order: 5, title: "Nebuu", note: "A Turkish party word game, live since 2013" } },
        { id: "cards", caption: "Cards" },
        { id: "site", caption: "nebuu.com" },
      ],
    },
  ],
};
