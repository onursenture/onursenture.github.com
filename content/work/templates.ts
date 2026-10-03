import type { CaseStudy } from "./types";

// Every template released during Onur's tenure (May 2016 to Apr 2026) that
// the PrimeTek accounts announced, one entry each, sourced from the first
// release post; ports to other frameworks are in `links`. Free templates
// (Sigma, Sakai) are left out. Onur led design on every template; `credits`
// names colleagues where they designed a template or a page (spec §4.2).
export const templates: CaseStudy = {
  slug: "templates",
  org: "primetek",
  title: "Templates",
  kind: "app templates",
  years: "2016–2025",
  lead: {
    strong: "Templates.",
    rest: "Premium application templates for PrimeFaces, PrimeNG, PrimeVue and PrimeReact.",
  },
  intro: ["Each one a complete app: dashboards, apps, landing and auth pages, themed for the Prime component libraries."],
  facts: [
    { label: "Role", value: "Design lead" },
    { label: "Years", value: "2016–2025" },
  ],
  links: [],
  hero: { id: "cover", caption: "Templates" },
  entries: [
    {
      id: "ultima",
      date: "2016-08",
      title: "Ultima",
      frameworks: ["JSF", "Angular", "Vue"],
      note: "A material application template for PrimeFaces, released with 120 layout combinations in total; PrimeNG followed in October 2016 and PrimeVue in March 2020.",
      source: "https://x.com/primefaces/status/770891393459949568",
      links: [
        { label: "PrimeNG version", href: "https://x.com/prime_ng/status/782891216673316864" },
        { label: "PrimeVue version", href: "https://x.com/primevue/status/1242037807427788800" },
      ],
      media: [
        { id: "ultima-cover", caption: "Ultima" },
      ],
    },
    {
      id: "poseidon",
      date: "2016-10",
      title: "Poseidon",
      frameworks: ["JSF", "Angular"],
      note: "A premium application template for PrimeFaces; the PrimeNG version arrived with PrimeNG 2.0 in February 2017.",
      source: "https://x.com/primefaces/status/788650172288999424",
      links: [
        { label: "PrimeNG version", href: "https://x.com/prime_ng/status/828934836584841216" },
      ],
      media: [
        { id: "poseidon-cover", caption: "Poseidon" },
      ],
    },
    {
      id: "atlantis",
      date: "2016-12",
      title: "Atlantis",
      frameworks: ["JSF", "Angular", "Vue", "React"],
      note: "A modern premium application template for PrimeFaces, ported to PrimeNG in 2017 and to PrimeVue and PrimeReact in 2021.",
      source: "https://x.com/primefaces/status/806050632599748609",
      links: [
        { label: "PrimeNG version", href: "https://x.com/prime_ng/status/848818593118789632" },
        { label: "PrimeVue version", href: "https://x.com/primevue/status/1440628415762026510" },
        { label: "PrimeReact version", href: "https://x.com/primereact/status/1452982862878228482" },
      ],
      media: [
        { id: "atlantis-cover", caption: "Atlantis" },
      ],
    },
    {
      id: "verona",
      date: "2017-01",
      title: "Verona",
      frameworks: ["JSF", "Angular", "Vue"],
      note: "A premium application template for PrimeFaces, followed by PrimeNG in October 2017 and PrimeVue in May 2022.",
      source: "https://x.com/w00f/status/821000764709539840",
      links: [
        { label: "PrimeNG version", href: "https://x.com/prime_ng/status/924929983902044161" },
        { label: "PrimeVue version", href: "https://x.com/primevue/status/1524375511459377153" },
      ],
      media: [
        { id: "verona-cover", caption: "Verona" },
        { id: "verona-landing", caption: "Landing", tags: ["page"] },
      ],
    },
    {
      id: "morpheus",
      date: "2017-02",
      title: "Morpheus",
      frameworks: ["JSF", "Angular"],
      note: "A premium application template for PrimeFaces, followed by a PrimeNG version with PrimeNG 4.0 in May 2017.",
      source: "https://x.com/primefaces/status/829245006854643712",
      links: [
        { label: "PrimeNG version", href: "https://x.com/prime_ng/status/859324964268380160" },
      ],
      media: [
        { id: "morpheus-cover", caption: "Morpheus" },
      ],
    },
    {
      id: "barcelona",
      date: "2017-03",
      title: "Barcelona",
      frameworks: ["JSF", "Angular"],
      note: "A material application template for PrimeFaces, followed by a PrimeNG version two weeks later.",
      source: "https://x.com/primefaces/status/836939496381952000",
      links: [
        { label: "PrimeNG version", href: "https://x.com/prime_ng/status/841943776969019392" },
      ],
      media: [
        { id: "barcelona-cover", caption: "Barcelona" },
      ],
    },
    {
      id: "paradise",
      date: "2017-04",
      title: "Paradise",
      frameworks: ["JSF", "Angular"],
      note: "A minimalist application template for PrimeFaces, followed by a PrimeNG version a month later.",
      source: "https://x.com/w00f/status/856854851145408512",
      links: [
        { label: "PrimeNG version", href: "https://x.com/w00f/status/867305687549980672" },
      ],
      media: [
        { id: "paradise-cover", caption: "Paradise" },
      ],
    },
    {
      id: "manhattan",
      date: "2017-07",
      title: "Manhattan",
      frameworks: ["JSF", "Angular"],
      note: "A premium application template for PrimeFaces, followed by a PrimeNG version in the same month.",
      source: "https://x.com/w00f/status/881829683440099330",
      links: [
        { label: "PrimeNG version", href: "https://x.com/prime_ng/status/885118700227047426" },
      ],
      media: [
        { id: "manhattan-cover", caption: "Manhattan" },
      ],
    },
    {
      id: "avalon",
      date: "2017-08",
      title: "Avalon",
      frameworks: ["JSF", "Angular", "Vue"],
      note: "Bootstrap meets PrimeFaces: an application template for PrimeFaces, followed by PrimeNG two weeks later and PrimeVue in October 2019.",
      source: "https://x.com/w00f/status/894495436509261824",
      links: [
        { label: "PrimeNG version", href: "https://x.com/prime_ng/status/899542381611151361" },
        { label: "PrimeVue version", href: "https://x.com/primevue/status/1184065828888731648" },
      ],
      media: [
        { id: "avalon-cover", caption: "Avalon" },
      ],
    },
    {
      id: "serenity",
      date: "2017-09",
      title: "Serenity",
      frameworks: ["JSF", "Angular", "React", "Vue"],
      note: "A material design application template for PrimeFaces, followed by PrimeNG in October 2017, a PrimeReact create-react-app template in December 2017 and PrimeVue in January 2020.",
      source: "https://x.com/primefaces/status/912998218698575872",
      links: [
        { label: "PrimeNG version", href: "https://x.com/prime_ng/status/918028399423221760" },
        { label: "PrimeReact version", href: "https://x.com/primereact/status/940902974657843200" },
        { label: "PrimeVue version", href: "https://x.com/primevue/status/1215605372377010176" },
      ],
      media: [
        { id: "serenity-cover", caption: "Serenity" },
      ],
    },
    {
      id: "apollo",
      date: "2018-01",
      title: "Apollo",
      frameworks: ["Angular"],
      note: "An Angular CLI template for PrimeNG, with dark mode for the first time and 16 themes.",
      source: "https://x.com/prime_ng/status/956451059169456128",
      media: [
        { id: "apollo-cover", caption: "Apollo" },
      ],
    },
    {
      id: "california",
      date: "2018-01",
      title: "California",
      frameworks: ["JSF"],
      note: "The all-new California template, released with PrimeFaces 6.2.RC1.",
      source: "https://x.com/primefaces/status/951360929962307584",
      media: [
        { id: "california-cover", caption: "California" },
      ],
    },
    {
      id: "ecuador",
      date: "2018-05",
      title: "Ecuador",
      frameworks: ["JSF"],
      note: "A premium application template for PrimeFaces with a slick design and 4 responsive layouts; a PrimeNG version was announced for pre-order two weeks later.",
      source: "https://x.com/primefaces/status/995954309627088899",
      links: [
        { label: "PrimeNG pre-order", href: "https://x.com/prime_ng/status/1001725679271075840" },
      ],
      media: [
        { id: "ecuador-cover", caption: "Ecuador" },
      ],
    },
    {
      id: "harmony",
      date: "2018-05",
      title: "Harmony",
      frameworks: ["Angular"],
      note: "A premium Angular CLI application template for PrimeNG, with 4 menu modes.",
      source: "https://x.com/prime_ng/status/994165591920529408",
      media: [
        { id: "harmony-cover", caption: "Harmony" },
      ],
    },
    {
      id: "olympia",
      date: "2018-09",
      title: "Olympia",
      frameworks: ["Angular"],
      note: "A premium Angular CLI template for PrimeNG, with a relaxing design.",
      source: "https://x.com/prime_ng/status/1042682337153220608",
      media: [
        { id: "olympia-cover", caption: "Olympia" },
      ],
    },
    {
      id: "babylon",
      date: "2018-10",
      title: "Babylon",
      frameworks: ["JSF", "Angular", "Vue"],
      note: "A premium application template for PrimeFaces, followed by PrimeNG in November 2018 and PrimeVue in October 2019.",
      source: "https://x.com/w00f/status/1047438960329408512",
      links: [
        { label: "PrimeNG version", href: "https://x.com/prime_ng/status/1057960341336981504" },
        { label: "PrimeVue version", href: "https://x.com/primevue/status/1187269553090371584" },
      ],
      media: [
        { id: "babylon-cover", caption: "Babylon" },
      ],
    },
    {
      id: "roma",
      date: "2019-01",
      title: "Roma",
      frameworks: ["JSF", "Angular", "Vue"],
      note: "A minimalist, clean premium application template for PrimeFaces, followed by PrimeNG in February 2019 and PrimeVue in January 2020.",
      source: "https://x.com/primefaces/status/1087316644286947328",
      links: [
        { label: "PrimeNG version", href: "https://x.com/prime_ng/status/1093130655926501382" },
        { label: "PrimeVue version", href: "https://x.com/primevue/status/1214577006064611329" },
      ],
      media: [
        { id: "roma-cover", caption: "Roma" },
      ],
    },
    {
      id: "sapphire",
      date: "2019-03",
      title: "Sapphire",
      frameworks: ["JSF", "Angular", "React", "Vue"],
      note: "A material design application template for PrimeFaces, ported to PrimeNG in May 2019, PrimeReact in July and PrimeVue in August.",
      source: "https://x.com/primefaces/status/1110835457196285953",
      links: [
        { label: "PrimeNG version", href: "https://x.com/prime_ng/status/1126111697712947208" },
        { label: "PrimeReact version", href: "https://x.com/primereact/status/1156545609962328065" },
        { label: "PrimeVue version", href: "https://x.com/primevue/status/1164474341867831297" },
      ],
      media: [
        { id: "sapphire-cover", caption: "Sapphire" },
      ],
    },
    {
      id: "prestige",
      date: "2019-10",
      title: "Prestige",
      frameworks: ["JSF", "Angular", "Vue"],
      note: "A premium application template for PrimeFaces, followed by PrimeNG in October 2019 and PrimeVue in April 2020.",
      source: "https://x.com/primefaces/status/1179375964926758914",
      links: [
        { label: "PrimeNG version", href: "https://x.com/prime_ng/status/1184749398208724992" },
        { label: "PrimeVue version", href: "https://x.com/primevue/status/1252627440960241668" },
      ],
      media: [
        { id: "prestige-cover", caption: "Prestige" },
      ],
    },
    {
      id: "mirage",
      date: "2019-11",
      title: "Mirage",
      frameworks: ["JSF", "Angular"],
      note: "An application template for PrimeFaces with Bootstrap styling, followed by PrimeNG in December 2019.",
      source: "https://x.com/primefaces/status/1199350602872082432",
      links: [
        { label: "PrimeNG version", href: "https://x.com/prime_ng/status/1205142040100638720" },
      ],
      media: [
        { id: "mirage-cover", caption: "Mirage" },
      ],
    },
    {
      id: "siberia",
      date: "2020-02",
      title: "Siberia",
      frameworks: ["JSF"],
      note: "A fully customizable admin template for PrimeFaces.",
      source: "https://x.com/primefaces/status/1227513266823450626",
      media: [
        { id: "siberia-cover", caption: "Siberia" },
      ],
    },
    {
      id: "pandora",
      date: "2020-05",
      title: "Pandora",
      frameworks: ["JSF"],
      note: "A premium application template for PrimeFaces.",
      source: "https://x.com/primefaces/status/1265260052816035843",
      media: [
        { id: "pandora-cover", caption: "Pandora" },
      ],
    },
    {
      id: "diamond",
      date: "2020-06",
      title: "Diamond",
      frameworks: ["JSF", "Angular", "Vue"],
      note: "A premium application template, released for PrimeFaces in June 2020, then for PrimeNG 10 in September and PrimeVue in October.",
      source: "https://x.com/primefaces/status/1272501580550586368",
      links: [
        { label: "PrimeNG version", href: "https://x.com/prime_ng/status/1304078971571757056" },
        { label: "PrimeVue version", href: "https://x.com/primevue/status/1319550824142561280" },
      ],
      media: [
        { id: "diamond-cover", caption: "Diamond" },
      ],
    },
    {
      id: "rain",
      date: "2020-07",
      title: "Rain",
      frameworks: ["JSF"],
      note: "A PrimeFaces application template with light, dim and dark modes.",
      source: "https://x.com/primefaces/status/1288778825434882049",
      media: [
        { id: "rain-cover", caption: "Rain" },
      ],
    },
    {
      id: "freya",
      date: "2020-09",
      title: "Freya",
      frameworks: ["JSF", "Vue"],
      note: "An application template for PrimeFaces; the Vue CLI version for PrimeVue followed in May 2021, inspired by Scandinavian minimalism.",
      source: "https://x.com/primefaces/status/1308379411037786112",
      links: [
        { label: "PrimeVue version", href: "https://x.com/primevue/status/1390295819937583113" },
      ],
      media: [
        { id: "freya-cover", caption: "Freya" },
      ],
    },
    {
      id: "poseidon-remastered-2020",
      remaster: true,
      date: "2020-12",
      title: "Poseidon Remastered",
      frameworks: ["Angular"],
      note: "Poseidon remastered from the ground up for PrimeNG.",
      source: "https://x.com/prime_ng/status/1334455814099177472",
      media: [
        { id: "poseidon-remastered-2020-cover", caption: "Poseidon Remastered" },
      ],
    },
    {
      id: "ultima-definitive",
      remaster: true,
      date: "2021-01",
      title: "Ultima Definitive Edition",
      frameworks: ["Angular", "React"],
      note: "The material Angular CLI template remastered as the Definitive Edition; PrimeReact followed in March 2021.",
      source: "https://x.com/prime_ng/status/1346782935815499781",
      links: [
        { label: "PrimeReact version", href: "https://x.com/primereact/status/1367073773359349765" },
      ],
      media: [
        { id: "ultima-definitive-cover", caption: "Ultima Definitive Edition" },
      ],
    },
    {
      id: "verona-remastered",
      remaster: true,
      date: "2021-10",
      title: "Verona Remastered",
      frameworks: ["Angular"],
      note: "The Verona admin template remastered for PrimeNG.",
      source: "https://x.com/prime_ng/status/1450438816108531714",
      media: [
        { id: "verona-remastered-cover", caption: "Verona Remastered" },
      ],
    },
    {
      id: "atlantis-remastered",
      remaster: true,
      date: "2022-02",
      title: "Atlantis Remastered",
      frameworks: ["Angular"],
      note: "A newly remastered Atlantis template for PrimeNG.",
      source: "https://x.com/prime_ng/status/1491015084847419393",
      media: [
        { id: "atlantis-remastered-cover", caption: "Atlantis Remastered" },
      ],
    },
    {
      id: "apollo-2022",
      remaster: true,
      date: "2022-06",
      title: "Apollo (all-new)",
      frameworks: ["Angular", "React"],
      note: "An all-new application template for PrimeNG with light, dark and dim modes; the Next.js version for PrimeReact followed in December 2022.",
      source: "https://x.com/prime_ng/status/1542510180499304449",
      links: [
        { label: "PrimeReact version", href: "https://x.com/primereact/status/1600777904069156864" },
      ],
      media: [
        { id: "apollo-2022-cover", caption: "Apollo (all-new)" },
      ],
    },
    {
      id: "diamond-remastered",
      remaster: true,
      date: "2024-10",
      title: "Diamond Remastered",
      frameworks: ["Vue", "Angular"],
      note: "Diamond remastered for PrimeVue with multiple theme presets; the Angular edition followed in March 2025.",
      source: "https://x.com/primevue/status/1844657075156095435",
      links: [
        { label: "PrimeNG version", href: "https://x.com/prime_ng/status/1897609155575201936" },
      ],
      media: [
        { id: "diamond-remastered-cover", caption: "Diamond Remastered" },
      ],
    },
    {
      id: "genesis",
      date: "2024-12",
      title: "Genesis",
      frameworks: ["React", "Vue", "Angular"],
      note: "Prime's first multipurpose premium template, built with React and Next.js; PrimeVue followed in January 2025 and PrimeNG in March 2025.",
      source: "https://x.com/w00f/status/1867143128396058914",
      links: [
        { label: "PrimeVue version", href: "https://x.com/primevue/status/1876588477774803394" },
        { label: "PrimeNG version", href: "https://x.com/prime_ng/status/1897988387069366376" },
      ],
      credits: [
        { name: "Ümit Çelik", href: "https://x.com/umitceliks" },
        { name: "Taner Ergin", role: "implementation", href: "https://x.com/tanerengiin" },
      ],
      media: [
        { id: "genesis-cover", caption: "Genesis" },
      ],
    },
    {
      id: "poseidon-remastered",
      remaster: true,
      date: "2025-02",
      title: "Poseidon Remastered Edition",
      frameworks: ["Vue"],
      note: "Poseidon Remastered Edition for PrimeVue, designed from the ground up with multiple light and dark palettes and 7 menu layouts.",
      source: "https://x.com/primevue/status/1891483427955687549",
      media: [
        { id: "poseidon-remastered-cover", caption: "Poseidon Remastered Edition" },
      ],
    },
    {
      id: "avalon-remastered",
      remaster: true,
      date: "2025-04",
      title: "Avalon Remastered",
      frameworks: ["Vue"],
      note: "The remastered Avalon application template for PrimeVue, built on Vite, with 7 menu modes and various color schemes.",
      source: "https://x.com/primevue/status/1914327500659830814",
      media: [
        { id: "avalon-remastered-cover", caption: "Avalon Remastered" },
      ],
    },
  ],
};
