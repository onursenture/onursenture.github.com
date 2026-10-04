# Sprint 6: Work II, Orkestra and two PrimeTek pages — Design Spec

## Overview

Sprint 6 adds 11 product pages to the block-based Work model from the work rethink (`2026-10-03-work-rethink-design.md`):
- nine Orkestra Studios projects;
- two PrimeTek products: PrimeStore and Theme Designer.

It also adds:
- a **Then** block that places an old project in its moment;
- **Live** links for Orkestra products that still run;
- a year column on the home's Experience rows;
- six curated Selected work pins;
- six new Lab entries.

The decisions come from a brainstorm with Onur on 2026-10-04. The mockup is `2026-10-04-sprint-6-mockups/orkestra-page.html`, and option A is chosen.

The research behind the copy is in the main checkout's gitignored `.superpowers/research/orkestra-projects.md`. Every fact in it is tagged:
- **[X]:** from Onur's tweet archive;
- **[web]:** from a public URL;
- **[unverified]:** a guess or an unconfirmed claim.

Images come from Onur later. Until then every image is the usual dither placeholder.

## Decisions

| Topic | Decision |
|---|---|
| Orkestra structure | **One page per project**, the same as the PrimeTek products. Every project is a row under Orkestra in Experience. |
| Orkestra projects | Nebuu, count.do, Maç Kaçta, Gonna, Beatografi, Harf Marf, İmparator, Hi Jump, Rebound Line. Indovina Chi è and Guessy appear on the Nebuu page as editions. Unlisted projects (Direniş, Flappy Sarıgül, PLY, Akorlar, Fenomen Videolar, the 2020–2023 3D games) stay off the site. |
| Historical context | **A Then block per page.** "Then" and the year in Doto sit in the label column, with 2 or 3 sourced sentences in the 480px column and an optional sources line (mockup option A). |
| Links | The no-external-links rule applies to **PrimeTek pages only**. Orkestra pages may link wherever it helps: Live links, sources and press. |
| PrimeStore | **The 2025 redesign, which shipped.** It is a regular product page with no "unreleased" framing. |
| PrimeDesigner | **Designed, then shipped after a pivot as Theme Designer (2025).** The page is `/work/theme-designer/`, titled after what shipped, and its copy tells the pivot. |
| Experience | All 15 products are rows, now `[title][note][year]`. Orkestra rows are newest first, and PrimeTek keeps its order with the two new products added at the end. |
| Selected work | **Exactly 6 pins:** PrimeOne, PrimeBlocks, Templates, PrimeStore, Nebuu, Beatografi. |
| Lab | 7 text rows: this site plus 6 entries from Onur (§6). |
| Facts only Onur knows | **A questionnaire is the sprint's first task.** Copy is drafted after it, only from [X]/[web] facts and his answers. |

## 1. Content model (`content/work/types.ts`)

```ts
export type WorkSlug =
  | "primeone" | "primeblocks" | "primeicons" | "templates"
  | "primestore" | "theme-designer"
  | "nebuu" | "countdo" | "mac-kacta" | "gonna" | "beatografi"
  | "harf-marf" | "imparator" | "hi-jump" | "rebound-line";

export interface Link { label: string; href: string } // https only

export type Block =
  | { kind: "text"; id: string; heading: string; body: string[] }
  | { kind: "images"; id: string; heading?: string; columns?: 1 | 2 | 3; images: WorkImage[] }
  | { kind: "icons"; id: string; heading?: string }
  // New. Places the project in its moment. `year` is display text ("2013").
  | { kind: "then"; id: string; year: string; body: string[]; sources?: Link[] };

export interface ProductPage {
  // ...unchanged fields...
  // New. Rendered as a "Live" row after the facts. Orkestra only.
  links?: Link[];
}
```

- One file per page in `content/work/<slug>.ts`. The registry `content/work/index.ts` lists them in this order: the PrimeTek pages first, then Orkestra in Experience order.
- The `Credit.href` comment changes from "no external links on /work/**" to "no external links on PrimeTek pages".

### Validator additions (`lib/work/validate.ts`)

- `links` and `then.sources` are rejected on `org: "primetek"` pages.
- Every `Link.href` is `https://`.
- A `then` block appears at most once and only as `blocks[0]`, right after the header.
- A `then` block has a non-empty `year` and `body`.
- The existing rules stay: unique ids, unique pin `order`, columns 1, 2 or 3, `icons` only on primeicons, a non-empty intro, and at least one block.
- Each rule gets a test.

## 2. Renderers (`components/work/`)

- **Then block** (`blocks.tsx`), a row on `ROW_GRID`:
  - **Label column:** "Then" (`type-meta text-fg-muted`), and under it the year in Doto at display size, in the accent colour.
  - **480px column:** the body paragraphs (`type-body text-fg-soft`).
  - **Sources:** one `type-meta text-fg-muted` line, "Sources: A · B", each an external `TextLink`.
  - The row's anchor is the block `id`.
- **Live row** (`product-header.tsx`): after the facts, a fact row labelled "Live" whose value is the `links` as external `TextLink`s, separated by " · ". It is hidden when `links` is empty.
- **Unchanged:** the images, text and icons blocks, the viewer, `?fig=`, and the metadata rules.

## 3. The pages

The structure is common to every page:
- the header: lead, intro, facts and Live;
- Then, if sourced;
- What I did;
- any extra blocks;
- one `images` block with 3 placeholder images at 16:10, captioned with what Onur will show.

Facts are Role, Years and At, plus Platform on Orkestra pages.

| Slug | Org | Experience note | Years (draft, confirmed in the questionnaire) | Then | Extra blocks | Live |
|---|---|---|---|---|---|---|
| `primestore` | PrimeTek | template store | 2025 | — | — | — |
| `theme-designer` | PrimeTek | theme editor | 2023–2025 | — | "From PrimeDesigner to Theme Designer" (text) | — |
| `nebuu` | Orkestra | word game, iOS · Android | 2013–now | 2013: Heads Up! reached the US App Store on 2013-05-02 and Nebuu on 2013-08-06; it took the format into Turkish, with local words and decks | Editions (Indovina Chi è 2015, Guessy 2016); Decks (to 100+ by 2021, Nebuu Çocuk) | App Store, Google Play, nebuu.com |
| `rebound-line` | Orkestra | casual game, iOS | 2019 | only if sourced | — | App Store (still listed) |
| `hi-jump` | Orkestra | casual game, iOS | 2018 | only if sourced | — | App Store (still listed) |
| `imparator` | Orkestra | football card manager, iOS | 2017 | only if sourced | — | App Store (still listed) |
| `harf-marf` | Orkestra | word puzzle, iOS | 2016 | only if sourced | — | App Store (still listed) |
| `beatografi` | Orkestra | beat marketplace, web | 2013 | 2013: an online marketplace for Turkish beatmakers, live 2013-12-24 to 2016 | — | — (dead; sources may link Wayback) |
| `countdo` | Orkestra | countdown app, iOS | 2013 | 2013: shipped 2013-06-23, three months before iOS 7 (sources: the release tweet, and Apple's iOS 7 release date) | — | countdo.orkestra.co (the 2026 remaster) |
| `mac-kacta` | Orkestra | football fixtures, iOS | 2013 | only if sourced | — | — |
| `gonna` | Orkestra | social agenda, web · iOS | 2012–2013 | only if sourced (Gonnasphere on the web in 2012, the iOS app in 2013) | Recognition (2nd place at MIT EF Turkey among 2,800+ projects, the US trip) | — |

- **Page copy:** the Then sentences above are directions, not copy. Final copy is written in the content task from tagged facts and the questionnaire answers.
- **`kind`:** each page's `kind` equals its Experience note in the table.
- **Then rule:** a page has a Then block only if a [X] or [web] fact backs every claim in it. Where none does, the page has no Then block.
- **PrimeStore copy:** What I did, from the Figma survey's screen list (store, template detail, licence modal, dashboard with versions, server files, payments and subscriptions, sign in and up, PayLink, Command K search). Image captions: Store, Template detail, Dashboard.
- **Theme Designer copy:** PrimeDesigner was designed as a standalone app (themes, components, auth, plans and billing) and shipped in 2025 as Theme Designer. Image captions: Themes, Editor, Billing.
- **count.do:** the intro mentions the 2026 remaster, and Live links it.

## 4. Home: Experience

- `ExperienceChild` gains `years?: string`.
- For a child whose `href` is a product page (`/work/<slug>/`), the year column reads that page's `Years` fact; `years` is used only when there is no page.
- A test asserts that every linked child resolves to a registered page.
- The row is a 3-column grid, `[title][note][year]`:
  - the year is right-aligned, `type-meta`, tabular figures;
  - below md the year stays visible and the note truncates.
- **Orkestra children, in order:** Nebuu, Rebound Line, Hi Jump, İmparator, Harf Marf, Beatografi, count.do, Maç Kaçta, Gonna. All are linked.
- **PrimeTek children:** PrimeOne, PrimeBlocks, PrimeIcons, Templates, PrimeStore, Theme Designer. All are linked.
- **Etiya:** unchanged, with no children.

## 5. Home: Selected work

| Order | Page | Pinned image |
|---|---|---|
| 1 | PrimeOne | unchanged |
| 2 | PrimeBlocks | unchanged |
| 3 | Templates | Apollo, unchanged (was order 4) |
| 4 | PrimeStore | the first image of its images block |
| 5 | Nebuu | the first image of its images block |
| 6 | Beatografi | the first image of its images block |

- The PrimeIcons pin is removed. Its page and the icons block stay.
- Each new pin gets a title and a one-line note in the content task.

## 6. Home: Lab (`content/lab-index.ts`)

Display order: the existing site entry, then these. The copy is a draft for Onur to correct on the preview.

| Title | Year | Description | href |
|---|---|---|---|
| Cehennem Rebirth | 2026 | An unofficial revival of Cehennem Online, the Turkish internet community started in December 1998, rebuilt as a modern forum with editor-reviewed news and docs. | https://cehennem-rebirth.vercel.app/ |
| count.do Remastered | 2026 | Orkestra's 2013 countdown app, remastered. | https://countdo.orkestra.co/ |
| Motif | 2026 | A carpet-pattern generator for Tanerman's stage visuals. | https://motif.tanerman.com/ |
| tanerman.com | 2026 | Homepage for the producer and DJ Tanerman: dates, bio, booking. | https://tanerman.com/ |
| Dönerverse | 2026 | A clicker game, inspired by Clicking Bad, that grows one knife and one skewer into a global, then orbital, döner empire. | https://donerverse.vercel.app/ |
| Nebuu Deck Studio | 2026 | An internal tool for improving Nebuu's word-card decks. | https://studio.nebuu.com/ |

Sources for the drafts: the Cehennem Rebirth `/bilgi` page, the Dönerverse README, the tanerman.com bio, and Onur's own lines.

## 7. The questionnaire (Task 1, controller)

Asked through AskUserQuestion, grouped by project, with the known facts shown as defaults to confirm:

- **Orkestra:**
  - the founding date;
  - the co-founders who may be named (Can Bülbül is public; are Taner Yıldırım and Aras Can Akın co-founders?);
  - whether Orkestra continues the Gonnasphere team.
- **Per project:**
  - Onur's role (design, product, art direction, code);
  - the years;
  - Live links;
  - why it ended, if it ended.
- **Numbers:** which ones Onur stands behind, with the store or country and the period:
  - Nebuu's #7 in top paid games on 2015-02-11;
  - "#1 in Turkey word games";
  - 500,000 players;
  - "1 million people reached";
  - count.do's 100k or 300k downloads.
  Anything unconfirmed is left out (honest-numbers rule).
- **PrimeStore and Theme Designer:** the years, the role, and the pivot story in one or two sentences.
- **Gonna:** the years shown (Gonnasphere 2012 on the web, Gonna on iOS in 2013).

The answers are saved as a gitignored note, `.superpowers/research/orkestra-answers.md`, next to the fact sheet.

## 8. Sprint process

- Worktree `../onursenture.github.com-sprint-6`, branch `sprint-6` from `v2`.
- Subagent-driven development, ending in a PR into `v2`. Onur checks the Vercel preview before the merge.
- **Order:**
  1. the questionnaire;
  2. the model and validator;
  3. the renderers;
  4. the content (11 pages, Experience, pins, Lab);
  5. verification and the PR.
- Pre-merge checks for Onur go in `docs/superpowers/plans/2026-10-04-sprint-6-followups.md`:
  - copy approval;
  - the Lab lines;
  - the image list per page (16:10, 2560×1600 into `images-src/work/<slug>/<image id>`);
  - the CDN cache check.

## 9. Testing

**Unit:**
- each new validator rule (links and sources rejected on PrimeTek; `then` only at `blocks[0]` and at most once; https links);
- the Then block markup (year, body, sources line);
- the Live row (rendered, and hidden when empty);
- the Experience year read from the linked page, and the fallback `years`;
- the six pins in order.

**E2E:**
- all 11 new routes return 200 and render their header and blocks;
- `main` has no external links on the 6 PrimeTek pages; on `/work/nebuu/` the Live links are present and external;
- the home's Experience has 15 product rows, each linked and each with a year;
- Selected work has exactly 6 pins in order;
- Lab has 7 rows;
- the existing work-page e2e (viewer, `?fig=`, Back, the PrimeIcons search and licence line) still passes.

**Visual:**
- `/work/nebuu/` and `/work/theme-designer/` at 1440 and 390;
- the home's Experience at 390 (the note truncates and the year stays visible);
- the Then block's Doto year checked against the mockup.

## Out of scope

- Admin upload and editing (Sprint 7).
- Images: they come from Onur.
- Projects Onur didn't list (Direniş, Flappy Sarıgül, PLY, Akorlar, Fenomen Videolar, the 3D games).
- Changes to the PrimeTek pages' existing copy.
