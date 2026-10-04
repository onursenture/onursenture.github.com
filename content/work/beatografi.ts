import type { ProductPage } from "./types";

// Facts: orkestra-projects.md §10. Live from 2013-12-24; the last Wayback
// capture with the marketplace is 2016-07.
export const beatografi: ProductPage = {
  slug: "beatografi",
  org: "orkestra",
  title: "Beatografi",
  kind: "beat marketplace",
  lead: {
    strong: "Beatografi.",
    rest: "A marketplace where Turkish beatmakers sold instrumentals to artists.",
  },
  intro: "Orkestra's web marketplace for the underground scene, open from December 2013 to 2016.",
  facts: [
    { label: "Role", value: "Co-founder, designer" },
    { label: "Years", value: "2013–2016" },
    { label: "At", value: "Orkestra Studios" },
    { label: "Platform", value: "Web" },
  ],
  blocks: [
    {
      kind: "then",
      id: "then",
      year: "2013",
      body: [
        "Beatografi opened on 24 December 2013, a home for independent Turkish beatmakers: listings priced in lira, genre shelves from hip-hop to R&B, and its own song contest, with 969 votes for 158 songs by April 2014.",
      ],
      sources: [
        { label: "Launch tweet", href: "https://x.com/w00f/status/415453992878358528" },
        { label: "The marketplace, Dec 2013", href: "https://web.archive.org/web/20131229023139/http://beatografi.com:80/" },
        { label: "Contest votes", href: "https://web.archive.org/web/2014/https://medium.com/p/4568fd72e6ce" },
      ],
    },
    {
      kind: "text",
      id: "what-i-did",
      heading: "What I did",
      body: [
        "I designed it, from the 2013 landing page to the 2014 campaigns, promotions and T-shirts, and worked on its development, sales and support.",
      ],
    },
    {
      kind: "images",
      id: "highlights",
      heading: "Highlights",
      columns: 3,
      images: [
        {
          id: "marketplace",
          caption: "Marketplace",
          pin: { title: "Beatografi", note: "A marketplace for Turkish beatmakers" },
        },
        { id: "beat-page", caption: "Beat page" },
        { id: "campaigns", caption: "Campaigns" },
      ],
    },
  ],
};
