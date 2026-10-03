# Work rethink (site polish, part 2): design

Onur, 2026-10-03. This follows part 1 (`2026-10-03-site-polish-design.md`). It replaces Sprint 5's release-log case studies with simpler product pages, and the home page's Work tiles with "Selected work", made of images pinned from those pages. It also restyles the Experience row.

Mockups are in the gitignored `.superpowers/brainstorm/23460-1791055492/content/`: `experience.html`, `selected-work-v2.html` (option B) and `product-page.html` (option A).

The work lands on branch `sprint-5` (PR #27).

## Decisions

| Topic | Decision |
|---|---|
| Home order | Bio, Lab, Selected work, Experience, Contributions |
| Selected work | Not a page. A wide row of images pinned from product pages: three equal 16:10 frames per row, each with a title, one muted context line and a source link |
| Experience | Option B. Each role is a header line, and its products are rows below it with hairlines and a short note. No tree glyphs. A product without a page is an unlinked row |
| Product pages | `/work/<slug>/`, option A: on the site grid. The block heading sits in the label column, text in the 480px column, and images span the full width to the right |
| Blocks | `text`, `images` (1, 2 or 3 columns) and `icons` (PrimeIcons only) |
| Removed | The release log, posts, version and date detail, the `/work/` index, `/work/archive/` and the Archive content |
| No images yet | Faint dither placeholders. Each product page has a placeholder images block, and each product gives one placeholder pin to Selected work |

## 1. Content model (`content/work/`)

```ts
export type WorkSlug = "primeone" | "primeblocks" | "primeicons" | "templates";

export interface Credit { name: string; role?: string; href?: string } // href kept as provenance, not rendered

// Pinned to the home's Selected work.
export interface Pin {
  order: number;   // display order on the home, unique across all pins
  title: string;   // "Tokens, 4.0"
  note: string;    // one line of context: "Semantic tokens across 80 components"
}

export interface WorkImage {
  id: string;          // stable, kebab-case, unique within its page; keys the image file and ?fig=
  caption?: string;
  credits?: Credit[];  // only designers; rendered as "Design: Name"
  image?: string;      // manifest key; unset → lib/work finds work/<slug>/<id>, or a placeholder
  pin?: Pin;
}

export type Block =
  | { kind: "text"; id: string; heading: string; body: string[] }
  | { kind: "images"; id: string; heading?: string; columns?: 1 | 2 | 3; images: WorkImage[] }
  | { kind: "icons"; id: string; heading?: string }; // PrimeIcons only

export interface Fact { label: string; value: string }

export interface ProductPage {
  slug: WorkSlug;
  org: OrgId;
  title: string;
  kind: string;                        // "design system", shown as the Experience row's note
  lead: { strong: string; rest: string };
  intro: string;                       // one paragraph
  facts: Fact[];                       // Role, Years, At
  blocks: Block[];                     // rendered in order
}
```

- Files: `content/work/<slug>.ts` (one `ProductPage` each) and `content/work/index.ts` (the registry).
- Delete `archive.ts` and `posts/`, along with the `Entry`, `Post`, `ArchiveEntry`, `Link`, `FigmaRef`, `MediaAspect` and `EntryColumns` types.
- Delete `content/work-index.ts`.
- Delete the Figma path entirely: `content/work/settings.ts` (`figmaLinks`), the viewer's Figma link and embed, `lib/work/figma*.ts`, `scripts/figma.ts`, `npm run figma` and `figma.example.json`. Images now come from Onur. The gitignored `figma.local.json` and `figma.lock.local.json` stay on disk and are not touched.
- `content/experience.ts` stays as it is. `ExperienceChild.href` links a product, and a child without `href` is an unlinked row.
- **Images:** all images are 16:10. Onur delivers them at 2560×1600 into `images-src/work/<slug>/<image id>.(png|jpg)`, and `npm run images` builds them.
- **Validation** (`lib/work/validate.ts`):
  - Block ids and image ids are unique within a page.
  - Pin `order` is unique across all pins.
  - `columns` is 1, 2 or 3.
  - `icons` appears only on `primeicons`.
  - Every page has a non-empty `intro` and at least one block.
  - Tests cover each rule.

## 2. lib/work

- `getProductPage(slug)`, `getProductSlugs()`.
- `getPins()` returns every pinned image across pages, sorted by `order`. Each pin is `{ slug, pageTitle, blockId, image: WorkImage (resolved), pin }`.
- `pageImages(page)` returns every image on a page in block order. These are the viewer's items for `?fig=`.
- Image resolution is the same as today: the manifest key or a placeholder.
- Keep `lib/work/url-state.ts` (`?fig=` only), the viewer history hook and `MediaViewer`. Delete `derive.ts` code that no longer has a caller.

## 3. Home

### Selected work row

- `SectionRow` with `id="selected-work"`, label "Selected work", `wide`, and no action.
- The grid is 1 column below md, 2 from md and 3 from lg, with a 16px gap. Each item:
  - a 16:10 frame (the image, or the dither placeholder with its title as the FIG label);
  - the title (`type-body`);
  - the note (`type-meta text-fg-muted`, one line, truncated);
  - the source link `PrimeOne →` (`TextLink`) to `/work/<slug>/#<blockId>`.
- The frame itself also links there.
- Hidden while there are no pins.
- `sizes` must match the wide row: 3 columns from lg inside `100vw − 308px`.

### Experience row

- Each role is a header line: org mark, org name, `· role` muted, and the span right-aligned.
- Under it, each child is a row in a 2-column grid (`[title][note]`), with a hairline (`border-t`) above each child row:
  - the title links to `href` when it is set; otherwise it is plain text;
  - the note is muted.
- No `├─` or `└─` glyphs. Remove them from `CLAUDE.md`'s glyph list.
- A role with no children shows only its header line.

### Removed

- `WorkTiles`, the `All work` action and `heroImageKey`.

## 4. Product page (`/work/<slug>/`)

Everything is on the site grid (`ROW_GRID`).

- **Header row:**
  - The label column has `← Home`, linking to `/`.
  - The content (wide) has the `h1` lead (`type-lead`, strong plus muted rest), the intro paragraph, and the facts as a small 2-column list (Role, Years, At).
- **Blocks:** each block is a row with a `DitherRule` between rows.
  - `text`: the heading in the label column, and the body paragraphs in the 480px column (`type-body text-fg-soft`).
  - `images`: the heading (if any) in the label column. The grid spans wide, with `columns` from md (1, 2 or 3; 3 is 2 from md and 3 from lg) and always 1 below md.
    - Each image is a 16:10 frame and a button that opens the viewer at that image (`?fig=<id>`).
    - The optional caption and the "Design: Name" credit sit under the frame in `type-meta`.
    - The block's `id` is the row's anchor, which Selected work links to.
  - `icons`: the existing PrimeIcons grid (search, copy, licence line), server-rendered, in a wide row.
- **Viewer:** `MediaViewer` over `pageImages(page)`, with the same `?fig=` history, focus return and dark palette as now. The server renders the page with no viewer open, and the client reads `?fig=` after hydration. This keeps the CDN caching intact.
- **Metadata:** the title is the page title. The OG image is the first block image that has a real image. The page has none while everything is a placeholder.
- No external links on `/work/**`.

## 5. Routes

- **`/work/`:** a permanent redirect to `/`, in `next.config` redirects with the trailing slash. Delete `app/(work)/work/page.tsx`.
- **`/work/archive/`:** a permanent redirect to `/`. Delete its page.
- **`/work/[slug]/`:** unchanged path. `generateStaticParams` comes from the registry.
- Old query URLs (`?view=…`, `?tag=…`) are ignored, as now. A `?fig=` naming an image that no longer exists is ignored.

## 6. Initial content

The implementer writes this from the existing content files. It reuses each page's current `lead`, `intro` and `facts`, and makes no new factual claims.

- **Every page:**
  - the header;
  - one `text` block, "What I did": 2 or 3 sentences built only from the current intro;
  - one `images` block, `columns: 3`, with three placeholder images and short captions describing what Onur will show (for example "Components", "Tokens", "Themes" for PrimeOne).
- **Pins:** the first image of each page's images block is pinned, with orders 1 to 4 (PrimeOne, PrimeBlocks, PrimeIcons, Templates) and a one-line note.
- **PrimeIcons:** add the `icons` block after the images block.
- **Templates:**
  - The images block has six placeholders captioned with template names that are in the current content: Apollo, Diamond, Ultima, Verona, Atlantis, Genesis.
  - The Genesis image keeps the credit `Ümit Çelik`.
- Onur approves the copy on the preview, then replaces the placeholders with his images.

## 7. Removals (dead code)

Delete these, and their tests, specimens and docs:
- the release `Log`, `PostList`, `archive-log`, `work-table`, the index groups and `case-study-header`;
- the coverage facts;
- `content/work-index.ts`, `WorkTiles` and `heroImageKey`;
- the posts and archive content;
- the Figma path (§1).

## 8. Testing

**Unit:**
- the validator rules;
- `getPins` ordering;
- `pageImages` order;
- Experience row markup (linked and unlinked child, no tree glyphs);
- the Selected work item markup (title, note, source link to `#blockId`);
- the block renderers (text, images with columns 1, 2 and 3, the icons block only on PrimeIcons).

**E2E:**
- **Home:**
  - The order is Lab, Selected work, Experience, Contributions.
  - Selected work shows 4 pins in order, each linking to `/work/<slug>/#<blockId>`.
  - Experience has product rows, PrimeTek's four products linked and Nebuu unlinked.
- **Product page:**
  - The header, blocks and anchors render.
  - Clicking an image opens the viewer with `?fig=`, and Back closes it.
  - There are no external links in `main`.
  - PrimeIcons still has its search and its licence line in the server HTML.
- **Redirects:** `/work/` and `/work/archive/` redirect to `/`.
- **Mobile:** at 390, Selected work has 1 column and blocks stack.

**Screenshots:**
- `/` and `/work/primeone/` at 1440 and 390.
- `/work/primeicons/` and `/work/templates/` at 1440.
