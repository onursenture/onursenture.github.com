# Sprint 6: Work II, Orkestra and two PrimeTek pages — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 11 product pages: nine Orkestra projects plus PrimeStore and Theme Designer. Add a sourced "Then" block, Live links on Orkestra pages, a year column in Experience, six curated Selected work pins and six new Lab entries.

**Architecture:** Content stays typed data in `content/work/<slug>.ts`, read through `lib/work/`.
- The model gains a `then` block, an optional `links` list on text blocks and on pages, and a per-org link policy enforced by `validateWork`.
- Experience rows read their year from the linked page's `Years` fact through a new resolver, `lib/work/experience.ts`.

**Tech Stack:** Next.js 16 (App Router, `cacheComponents`), React 19, Tailwind v4 tokens, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-04-sprint-6-work-orkestra-design.md`.

**Copy sources:** in the main checkout (gitignored), `.superpowers/research/orkestra-projects.md` (the fact sheet) and `.superpowers/research/orkestra-answers.md` (Onur's answers). Every line of copy below comes from those two files. Do not add claims.

## Global Constraints

- Work in the worktree `/Users/w00f/Documents/GitHub/onursenture.github.com-sprint-6` on branch `sprint-6`. Never commit to `v2` or `master`.
- Every commit message ends with a blank line and then `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. No "Task N" prefixes in subjects.
- **Honest numbers:** publish only the numbers in this plan, each with its period. Never "500,000", "#7", "100k" or "1 million".
- **Links:** PrimeTek pages (`org: "primetek"`) carry no external links. Orkestra pages may carry `links`, `then.sources` and text `links`, all `https://`.
- **Type:** only the six type classes (`type-name`, `type-lead`, `type-body`, `type-meta`, `type-label`, `type-boot`). No Tailwind text sizes. The Then year uses `type-name`.
- **Colours:** token utilities only (`text-fg-muted`, `text-accent`, `border-line`…).
- **Trailing slashes:** internal links end with `/`.
- **Ids:** block and image ids are kebab-case and permanent once published.
- **Verification:**
  - `npm run typecheck && npm run lint && npm test` must pass at the end of every task.
  - Tasks that touch e2e also run `npm run build`, then the named Playwright spec files.
  - Delete a stale `.next/dev/types` with `rm -rf .next` if typecheck complains about removed routes.
- **English only.**

---

### Task 1: Questionnaire (controller) — DONE 2026-10-04

- [x] Ask Onur the spec §7 questions (three AskUserQuestion rounds).
- [x] Save the answers to the main checkout's `.superpowers/research/orkestra-answers.md`.

The copy in Tasks 5 and 6 is already written from those answers.

---

### Task 2: Model and validator: `then` block, links and the PrimeTek link policy

**Files:**
- Modify: `content/work/types.ts`
- Modify: `lib/work/derive.ts` (the `BlockView` union)
- Modify: `lib/work/validate.ts`
- Test: `tests/work/validate.test.ts`

**Interfaces:**
- Produces:
  - `Link { label: string; href: string }`, exported from `content/work/types.ts`;
  - `Block` gains `{ kind: "then"; id; year; body; sources?: Link[] }`;
  - the text block gains `links?: Link[]`;
  - `ProductPage` gains `links?: Link[]`;
  - `WorkSlug` gains 11 slugs;
  - `BlockView` includes the `then` block unchanged.
  - Later tasks import `Link` and the `then` block type through `Extract<Block, { kind: "then" }>`.

- [ ] **Step 1: Write the failing tests.** Append inside the `describe("validateWork", ...)` block of `tests/work/validate.test.ts`, before its closing `});`:

```ts
  const orkestra = (overrides: Partial<ProductPage> = {}) => page({ slug: "nebuu", org: "orkestra", ...overrides });
  const then = (extra: Partial<Extract<Block, { kind: "then" }>> = {}): Block => ({
    kind: "then",
    id: "then",
    year: "2013",
    body: ["Context."],
    ...extra,
  });

  it("accepts an Orkestra page with Live links, a sourced then block first and text links", () => {
    const blocks: Block[] = [
      then({ sources: [{ label: "Source", href: "https://example.com/a" }] }),
      { kind: "text", id: "what-i-did", heading: "What I did", body: ["Did it."], links: [{ label: "Post", href: "https://example.com/b" }] },
    ];
    expect(validateWork([orkestra({ links: [{ label: "App Store", href: "https://apps.apple.com/x" }], blocks })])).toEqual([]);
  });

  it("rejects external links of any kind on a PrimeTek page", () => {
    expect(validateWork([page({ links: [{ label: "Live", href: "https://example.com" }] })])).toEqual([
      expect.stringContaining("PrimeTek pages carry no external links"),
    ]);
    expect(validateWork([page({ blocks: [then({ sources: [{ label: "S", href: "https://example.com" }] })] })])).toEqual([
      expect.stringContaining("PrimeTek pages carry no external links"),
    ]);
    const text: Block = { kind: "text", id: "what-i-did", heading: "What I did", body: ["x"], links: [{ label: "L", href: "https://example.com" }] };
    expect(validateWork([page({ blocks: [text] })])).toEqual([expect.stringContaining("PrimeTek pages carry no external links")]);
  });

  it("rejects a link that is not https", () => {
    expect(validateWork([orkestra({ links: [{ label: "Old", href: "http://example.com" }] })])).toEqual([
      expect.stringContaining('link "http://example.com" must be https'),
    ]);
  });

  it("allows a then block only as the first block, so at most once", () => {
    const text: Block = { kind: "text", id: "what-i-did", heading: "What I did", body: ["x"] };
    expect(validateWork([orkestra({ blocks: [text, then()] })])).toEqual([expect.stringContaining("a then block must be the first block")]);
    expect(validateWork([orkestra({ blocks: [then(), then({ id: "then-2" })] })])).toEqual([
      expect.stringContaining("a then block must be the first block"),
    ]);
  });

  it("rejects a then block without a year or a body", () => {
    expect(validateWork([orkestra({ blocks: [then({ year: " " })] })])).toEqual([expect.stringContaining("a then block needs a year and a body")]);
    expect(validateWork([orkestra({ blocks: [then({ body: [] })] })])).toEqual([expect.stringContaining("a then block needs a year and a body")]);
  });
```

- [ ] **Step 2: Run the tests and see them fail.**

Run: `npx vitest run tests/work/validate.test.ts`
Expected: a type or assertion failure (the `then` kind, `links` and `"nebuu"` don't exist yet).

- [ ] **Step 3: Extend the types.** In `content/work/types.ts`:

Replace the `WorkSlug` line with:

```ts
export type WorkSlug =
  | "primeone"
  | "primeblocks"
  | "primeicons"
  | "templates"
  | "primestore"
  | "theme-designer"
  | "nebuu"
  | "rebound-line"
  | "hi-jump"
  | "imparator"
  | "harf-marf"
  | "beatografi"
  | "countdo"
  | "mac-kacta"
  | "gonna";
```

Replace the `Credit` comment and interface with:

```ts
// Only designers are credited. href is kept as provenance and NOT rendered
// (PrimeTek pages carry no external links; credits never link anywhere).
export interface Credit { name: string; role?: string; href?: string }

// An external link (https). Orkestra pages only: validateWork rejects links on
// PrimeTek pages.
export interface Link { label: string; href: string }
```

Replace the `Block` union with:

```ts
export type Block =
  | { kind: "text"; id: string; heading: string; body: string[]; links?: Link[] }
  | { kind: "images"; id: string; heading?: string; columns?: 1 | 2 | 3; images: WorkImage[] }
  // PrimeIcons only: the live icon set.
  | { kind: "icons"; id: string; heading?: string }
  // Places an old project in its moment: "Then" and the year in the label
  // column, sourced sentences in the 480px column. Always the first block.
  | { kind: "then"; id: string; year: string; body: string[]; sources?: Link[] };
```

In `ProductPage`, add after `facts: Fact[];`:

```ts
  // Rendered as a "Live" row after the facts while the product still runs.
  links?: Link[];
```

- [ ] **Step 4: Pass `then` through `BlockView`.** In `lib/work/derive.ts`, replace the `BlockView` type with:

```ts
export type BlockView =
  | Extract<Block, { kind: "text" }>
  | (Omit<Extract<Block, { kind: "images" }>, "images"> & { images: ImageView[] })
  | Extract<Block, { kind: "icons" }>
  | Extract<Block, { kind: "then" }>;
```

`buildProductPage` already returns non-image blocks unchanged.

- [ ] **Step 5: Add the validator rules.** In `lib/work/validate.ts`:

Change the import to `import type { Credit, Link, ProductPage } from "@/content/work/types";`.

Inside `validateWork`, after the `credits` helper, add:

```ts
  const links = (where: string, list: Link[]) => {
    for (const link of list) {
      if (!link.href.startsWith("https://")) errors.push(`${where}: link "${link.href}" must be https`);
    }
  };
```

In the page loop, after the `if (page.blocks.length === 0) ...` line, add:

```ts
    // Every external link on the page: Live links, then sources and text links.
    const pageLinks = [
      ...(page.links ?? []),
      ...page.blocks.flatMap((block) => (block.kind === "then" ? (block.sources ?? []) : block.kind === "text" ? (block.links ?? []) : [])),
    ];
    if (page.org === "primetek" && pageLinks.length > 0) errors.push(`${at}: PrimeTek pages carry no external links`);
    links(at, pageLinks);
```

Change the block loop header from `for (const block of page.blocks) {` to `for (const [index, block] of page.blocks.entries()) {`. After the `icons` check, add:

```ts
      if (block.kind === "then") {
        if (index !== 0) errors.push(`${where}: a then block must be the first block`);
        if (!block.year.trim() || block.body.length === 0) errors.push(`${where}: a then block needs a year and a body`);
      }
```

Extend the comment block at the top of the file with one line: `// Links: none on PrimeTek pages; https everywhere; a then block only first.`

- [ ] **Step 6: Run the tests and see them pass.**

Run: `npx vitest run tests/work/validate.test.ts`
Expected: PASS, with all old and new cases green.

- [ ] **Step 7: Run the full checks.**

Run: `npm run typecheck && npm run lint && npm test`
Expected: PASS. The `renderBlock` switch in `components/work/blocks.tsx` has no `then` case yet. TypeScript allows that, because the function returns `ReactNode` and an unhandled case returns `undefined`. Task 3 adds the case.

- [ ] **Step 8: Commit.**

```bash
git add content/work/types.ts lib/work/derive.ts lib/work/validate.ts tests/work/validate.test.ts
git commit -m "Add the then block, Orkestra links and the PrimeTek no-links rule to the work model

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Renderers for the Then block, link lines and the Live row

**Files:**
- Create: `components/work/link-line.tsx`
- Modify: `components/work/blocks.tsx`
- Modify: `components/work/product-header.tsx`
- Modify: `CLAUDE.md` (the "Work (product pages)" section)
- Test: `tests/ui/work.test.tsx`

**Interfaces:**
- Consumes: `Link` and `Extract<Block, { kind: "then" }>` (Task 2).
- Produces:
  - `LinkLine({ links }: { links: Link[] })`: an inline `<span>` of external `TextLink`s separated by " · ".
  - `ThenBlock({ block })`, exported from `components/work/blocks.tsx`.
  - `ProductHeader` renders a `Live` `dt`/`dd` pair when `page.links` is non-empty.

- [ ] **Step 1: Write the failing tests.** In `tests/ui/work.test.tsx`, change the blocks import to `import { ImagesBlock, ProductBlocks, TextBlock, ThenBlock, imageGridSizes } from "@/components/work/blocks";`. Add `import { LinkLine } from "@/components/work/link-line";`. Then append at the end of the file:

```tsx
const thenBlock: Extract<BlockView, { kind: "then" }> = {
  kind: "then",
  id: "then",
  year: "2013",
  body: ["First context.", "Second context."],
  sources: [
    { label: "Release tweet", href: "https://x.com/w00f/status/1" },
    { label: "Archive", href: "https://web.archive.org/web/1/x" },
  ],
};

describe("LinkLine", () => {
  it("renders external links with ↗, separated by a middle dot", () => {
    const markup = html(<LinkLine links={thenBlock.sources!} />);
    expect(markup.match(/<a /g)).toHaveLength(2);
    expect(markup).toContain('href="https://x.com/w00f/status/1"');
    expect(markup).toContain('rel="noopener noreferrer"');
    expect(markup).toContain(" ↗");
    expect(markup).toContain(" · ");
  });
});

describe("ThenBlock", () => {
  const markup = html(<ThenBlock block={thenBlock} />);

  it("is a row anchored at its id, with Then and the Doto year as the heading in the label column", () => {
    expect(markup).toContain('id="then"');
    expect(markup).toMatch(/<h2[^>]*><span[^>]*>Then<\/span> <span class="[^"]*type-name[^"]*text-accent[^"]*">2013<\/span><\/h2>/);
    expect(markup).not.toContain("lg:col-span-2");
  });

  it("puts the body in the 480px column and the sources line under it", () => {
    expect(markup.match(/type-body text-fg-soft/g)).toHaveLength(2);
    expect(markup).toContain("Sources: ");
    expect(markup.match(/<a /g)).toHaveLength(2);
  });

  it("drops the sources line when there are none", () => {
    expect(html(<ThenBlock block={{ ...thenBlock, sources: undefined }} />)).not.toContain("Sources");
  });
});

describe("TextBlock links", () => {
  it("adds a link line under the body only when the block has links", () => {
    const base = page.blocks[0] as Extract<BlockView, { kind: "text" }>;
    expect(html(<TextBlock block={base} />)).not.toContain("<a ");
    const markup = html(<TextBlock block={{ ...base, links: [{ label: "How we failed?", href: "https://medium.com/p/1" }] }} />);
    expect(markup).toContain('href="https://medium.com/p/1"');
    expect(markup).toContain("How we failed?");
  });
});

describe("ProductHeader Live row", () => {
  it("adds Live after the facts when the page has links, and nothing otherwise", () => {
    expect(html(<ProductHeader page={view} />)).not.toContain("Live");
    const markup = html(<ProductHeader page={{ ...view, links: [{ label: "App Store", href: "https://apps.apple.com/x" }] }} />);
    expect(markup).toMatch(/<dt[^>]*>Live<\/dt><dd>/);
    expect(markup).toContain('href="https://apps.apple.com/x"');
  });
});

describe("ProductBlocks with a then block", () => {
  it("renders the then block first, before the other blocks", () => {
    const withThen = { ...view, blocks: [thenBlock, ...view.blocks] };
    const markup = html(<ProductBlocks page={withThen} />);
    expect(markup.indexOf('id="then"')).toBeLessThan(markup.indexOf('id="what-i-did"'));
  });
});
```

- [ ] **Step 2: Run the tests and see them fail.**

Run: `npx vitest run tests/ui/work.test.tsx`
Expected: FAIL, because `ThenBlock` and `link-line` don't exist.

- [ ] **Step 3: Create `components/work/link-line.tsx`.**

```tsx
import { Fragment } from "react";
import { TextLink } from "@/components/ui/text-link";
import type { Link } from "@/content/work/types";

// External links in one line ("App Store ↗ · nebuu.com ↗"): the Live row, a
// then block's sources and a text block's links. Orkestra pages only.
export function LinkLine({ links }: { links: Link[] }) {
  return (
    <span>
      {links.map((link, index) => (
        <Fragment key={link.href}>
          {index > 0 ? " · " : null}
          <TextLink href={link.href}>{link.label}</TextLink>
        </Fragment>
      ))}
    </span>
  );
}
```

- [ ] **Step 4: Render the Then block and text links.** In `components/work/blocks.tsx`:

Add `import { LinkLine } from "./link-line";` with the other local imports.

Add a type next to the others: `type ThenBlockView = Extract<Block, { kind: "then" }>;`

Replace `TextBlock` with:

```tsx
// A text block: the heading in the label column, the body in the 480px column,
// and its links (Orkestra pages only) in a muted line under the body.
export function TextBlock({ block }: { block: TextBlockView }) {
  return (
    <SectionRow id={block.id} label={block.heading}>
      <div className="flex flex-col gap-2.5">
        {block.body.map((paragraph, index) => (
          <p key={index} className="type-body text-fg-soft">
            {paragraph}
          </p>
        ))}
        {block.links?.length ? (
          <p className="type-meta text-fg-muted">
            <LinkLine links={block.links} />
          </p>
        ) : null}
      </div>
    </SectionRow>
  );
}

// The project in its moment: "Then" and the year (Doto, accent) as the label
// column's heading, the sourced sentences in the 480px column, then the
// sources. validateWork keeps it the first block.
export function ThenBlock({ block }: { block: ThenBlockView }) {
  return (
    <SectionRow
      id={block.id}
      label={
        <>
          <span className="block text-fg-muted">Then</span> <span className="mt-1.5 block type-name text-accent">{block.year}</span>
        </>
      }
    >
      <div className="flex flex-col gap-2.5">
        {block.body.map((paragraph, index) => (
          <p key={index} className="type-body text-fg-soft">
            {paragraph}
          </p>
        ))}
        {block.sources?.length ? (
          <p className="type-meta text-fg-muted">
            Sources: <LinkLine links={block.sources} />
          </p>
        ) : null}
      </div>
    </SectionRow>
  );
}
```

The test regex expects `<span class="block text-fg-muted">Then</span> <span class="mt-1.5 block type-name text-accent">2013</span>`. The `[^"]*` parts allow the extra classes, so keep both spans on one JSX line with the literal space between them.

In `renderBlock`, add before the closing brace of the `switch`:

```tsx
    case "then":
      return <ThenBlock block={block} />;
```

- [ ] **Step 5: Render the Live row.** In `components/work/product-header.tsx`:

Add `import { LinkLine } from "./link-line";`.

Inside the `<dl>`, after the `page.facts.map(...)`, add:

```tsx
        {page.links?.length ? (
          <>
            <dt className="text-fg-muted">Live</dt>
            <dd>
              <LinkLine links={page.links} />
            </dd>
          </>
        ) : null}
```

Update the header comment to `// the intro, the facts (Role, Years, At, and Platform on Orkestra pages) and, while the product runs, its Live links in the wide content.`

- [ ] **Step 6: Run the tests and see them pass.**

Run: `npx vitest run tests/ui/work.test.tsx`
Expected: PASS.

- [ ] **Step 7: Update `CLAUDE.md`** ("Work (product pages)" section). Make these replacements:

- Replace the bullet starting `- Blocks: \`text\` (heading + body paragraphs)` with:
  `  - Blocks: \`text\` (heading + body paragraphs, optional \`links\`), \`images\` (optional heading, \`columns\` 1, 2 or 3, \`images: WorkImage[]\`), \`icons\` (PrimeIcons only: the live set) and \`then\` (Sprint 6: "Then" and the year in Doto in the label column, sourced sentences in the 480px column, an optional \`sources\` line; always the first block, and only where a source backs every claim). A page may carry \`links\`, rendered as a "Live" row after the facts.`
- In the `validateWork` bullet, before `\`lib/work/index.ts\` throws`, insert: `no external links (\`links\`, \`then.sources\`, text \`links\`) on \`org: "primetek"\` pages; every link https; a \`then\` block only as the first block, with a year and a body;`
- Replace the whole `- **Links.**` bullet with:
  `- **Links.** PrimeTek pages carry no external links (\`validateWork\` enforces it). Orkestra pages link wherever it helps: Live links (App Store, the product's site), then sources and text links, all through \`LinkLine\` (\`components/work/link-line.tsx\`) as external \`TextLink\`s. A credit's \`href\` is provenance and never rendered.`

- [ ] **Step 8: Run the full checks, then commit.**

Run: `npm run typecheck && npm run lint && npm test`
Expected: PASS.

```bash
git add components/work/link-line.tsx components/work/blocks.tsx components/work/product-header.tsx tests/ui/work.test.tsx CLAUDE.md
git commit -m "Render the Then block, link lines and the Live row on product pages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Experience rows with a year column read from the product pages

**Files:**
- Create: `lib/work/experience.ts`
- Modify: `lib/work/index.ts` (add `getExperience`)
- Modify: `content/experience.ts` (`years?` on `ExperienceChild`; Nebuu gets `years: "2013–now"` until its page exists)
- Modify: `components/home/experience-list.tsx`
- Modify: `components/home/home-site.tsx`
- Modify: `CLAUDE.md` (the Experience sentence in "Design system")
- Test: `tests/work/experience.test.ts` (new), `tests/ui/home.test.tsx`

**Interfaces:**
- Consumes: `ProductPage` (`facts` with a `"Years"` label) and `ExperienceEntry`.
- Produces:
  - `ExperienceChildView { title: string; note: string; href?: string; years: string }`;
  - `ExperienceView` (an `ExperienceEntry` with `children: ExperienceChildView[]`);
  - `resolveExperience(entries, pages): ExperienceView[]`, which throws on a link to an unknown page or a row without a year;
  - `getExperience(): ExperienceView[]`, from `@/lib/work`;
  - `ExperienceList({ entries }: { entries: ExperienceView[] })`.

- [ ] **Step 1: Write the failing resolver tests.** Create `tests/work/experience.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { ExperienceEntry } from "@/content/experience";
import type { ProductPage } from "@/content/work/types";
import { resolveExperience } from "@/lib/work/experience";

const page: ProductPage = {
  slug: "primeone",
  org: "primetek",
  title: "PrimeOne",
  kind: "design system",
  lead: { strong: "PrimeOne.", rest: "A kit." },
  intro: "A kit.",
  facts: [
    { label: "Role", value: "Design lead" },
    { label: "Years", value: "2022–2026" },
  ],
  blocks: [{ kind: "text", id: "what-i-did", heading: "What I did", body: ["x"] }],
};
const entry = (children: ExperienceEntry["children"]): ExperienceEntry => ({
  org: "primetek",
  role: "Design lead",
  start: "2016-05",
  end: "2026-04",
  children,
});

describe("resolveExperience", () => {
  it("reads a linked product's year from its page's Years fact", () => {
    const [resolved] = resolveExperience([entry([{ title: "PrimeOne", note: "design system", href: "/work/primeone/" }])], [page]);
    expect(resolved.children).toEqual([{ title: "PrimeOne", note: "design system", href: "/work/primeone/", years: "2022–2026" }]);
    expect(resolved.role).toBe("Design lead");
  });

  it("uses a row's own years when it has no page", () => {
    const [resolved] = resolveExperience([entry([{ title: "Nebuu", note: "word game", years: "2013–now" }])], [page]);
    expect(resolved.children[0].years).toBe("2013–now");
    expect(resolved.children[0].href).toBeUndefined();
  });

  it("throws on a link to a page that does not exist, and on a row without a year", () => {
    expect(() => resolveExperience([entry([{ title: "Gone", note: "x", href: "/work/gone/" }])], [page])).toThrow(/not a product page/);
    expect(() => resolveExperience([entry([{ title: "Bare", note: "x" }])], [page])).toThrow(/has no years/);
  });
});
```

- [ ] **Step 2: Run the tests and see them fail.**

Run: `npx vitest run tests/work/experience.test.ts`
Expected: FAIL (`lib/work/experience` is missing).

- [ ] **Step 3: Add `years?` to the content type.** In `content/experience.ts`, replace the `ExperienceChild` interface with:

```ts
export interface ExperienceChild {
  title: string;
  note: string;
  href?: string;
  // Only for a row without a product page; a linked row reads its page's Years fact.
  years?: string;
}
```

Change the Nebuu child to `{ title: "Nebuu", note: "word game, iOS", years: "2013–now" }`.

- [ ] **Step 4: Create `lib/work/experience.ts`.**

```ts
import type { ExperienceEntry } from "@/content/experience";
import type { ProductPage } from "@/content/work/types";

// The home's Experience rows with their year column. A linked product reads
// its year from its page's Years fact, so the row and the page never drift;
// a row without a page carries its own `years`.

export interface ExperienceChildView {
  title: string;
  note: string;
  href?: string;
  years: string;
}

export interface ExperienceView extends Omit<ExperienceEntry, "children"> {
  children: ExperienceChildView[];
}

export function resolveExperience(entries: ExperienceEntry[], pages: ProductPage[]): ExperienceView[] {
  return entries.map((entry) => ({
    ...entry,
    children: entry.children.map((child): ExperienceChildView => {
      const page = child.href ? pages.find((item) => `/work/${item.slug}/` === child.href) : undefined;
      if (child.href && !page) throw new Error(`experience: ${child.title} links ${child.href}, which is not a product page`);
      const years = page ? page.facts.find((fact) => fact.label === "Years")?.value : child.years;
      if (!years) throw new Error(`experience: ${child.title} has no years`);
      return { title: child.title, note: child.note, href: child.href, years };
    }),
  }));
}
```

- [ ] **Step 5: Expose `getExperience`.** In `lib/work/index.ts`:

Add the imports `import { experience } from "@/content/experience";` and `import { type ExperienceView, resolveExperience } from "./experience";`.

Append:

```ts
// The home's Experience rows, each product with its year (resolveExperience).
export function getExperience(): ExperienceView[] {
  return resolveExperience(experience, productPages);
}
```

- [ ] **Step 6: Update the ExperienceList unit test (it fails first).** In `tests/ui/home.test.tsx`, replace the whole `describe("ExperienceList", ...)` block with:

```tsx
describe("ExperienceList", () => {
  const markup = html(
    <ExperienceList
      entries={[
        {
          org: "primetek",
          role: "Design lead",
          start: "2016-05",
          end: "2026-04",
          children: [
            { title: "PrimeOne", note: "design system", href: "/work/primeone/", years: "2022–2026" },
            { title: "Nebuu", note: "word game", years: "2013–now" },
          ],
        },
        { org: "etiya", role: "Design specialist", start: "2014-04", end: "2016-03", children: [] },
      ]}
    />,
  );

  it("renders each role's products as rows, linked only when they have a page, with no tree glyphs", () => {
    expect(markup).toContain('href="/work/primeone/"');
    expect(markup).toContain("Nebuu");
    expect(markup.match(/<a /g)).toHaveLength(1);
    expect(markup).not.toMatch(/[├└]/);
    expect(markup).toContain("May 2016–Apr 2026");
  });

  it("gives every product row a third, right-aligned year column", () => {
    expect(markup).toContain("grid-cols-[minmax(0,140px)_minmax(0,1fr)_auto]");
    expect(markup).toMatch(/<span class="[^"]*tabular-nums[^"]*">2022–2026<\/span>/);
    expect(markup).toMatch(/<span class="[^"]*tabular-nums[^"]*">2013–now<\/span>/);
  });
});
```

Run: `npx vitest run tests/ui/home.test.tsx`
Expected: FAIL. The years are missing from the markup, and TypeScript in the editor flags the `years` field; Vitest still runs.

- [ ] **Step 7: Render the year column.** Replace `components/home/experience-list.tsx` with:

```tsx
import { ItemLink } from "@/components/sections/item-link";
import { OrgMark } from "@/components/ui/org-mark";
import { formatSpan } from "@/content/experience";
import { ORGS } from "@/content/orgs";
import type { ExperienceView } from "@/lib/work/experience";

// Each role is a header line; its products are hairline rows underneath:
// title, muted note (truncates on narrow screens) and the year, read from
// the product page. A product links only when it has a page of its own.
export function ExperienceList({ entries }: { entries: ExperienceView[] }) {
  return (
    <ul className="flex flex-col gap-6 type-body">
      {entries.map((entry) => (
        <li key={entry.org}>
          <div className="flex items-baseline justify-between gap-4">
            <span>
              <OrgMark org={entry.org} /> <span className="text-fg">{ORGS[entry.org].name}</span>{" "}
              <span className="whitespace-nowrap text-fg-muted">· {entry.role}</span>
            </span>
            <span className="shrink-0 type-meta text-fg-muted">{formatSpan(entry.start, entry.end)}</span>
          </div>
          {entry.children.length > 0 ? (
            <ul
              aria-label={`${ORGS[entry.org].name} work`}
              className="mt-2 grid grid-cols-[minmax(0,140px)_minmax(0,1fr)_auto] gap-x-4"
            >
              {entry.children.map((child) => (
                <li key={child.title} className="col-span-3 grid grid-cols-subgrid items-baseline border-t border-line py-1.5">
                  <span className="truncate">
                    {child.href ? (
                      <ItemLink href={child.href} className="text-accent">
                        {child.title}
                      </ItemLink>
                    ) : (
                      <span className="text-fg">{child.title}</span>
                    )}
                  </span>
                  <span className="truncate text-fg-muted">{child.note}</span>
                  <span className="text-right type-meta tabular-nums text-fg-muted">{child.years}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 8: Wire the home.** In `components/home/home-site.tsx`:
  - remove `import { experience } from "@/content/experience";`;
  - change `import { getPins } from "@/lib/work";` to `import { getExperience, getPins } from "@/lib/work";`;
  - replace `<ExperienceList entries={experience} />` with `<ExperienceList entries={getExperience()} />`.

- [ ] **Step 9: Update `CLAUDE.md`.** In the "Design system" bullet about the Work home, replace `its products as hairline rows (title, muted note) under it` with `its products as hairline rows (title, muted note, and the year read from the product page's Years fact through \`getExperience()\` / \`lib/work/experience.ts\`; a row without a page sets \`years\` itself) under it`.

- [ ] **Step 10: Run all the checks.**

Run: `npm run typecheck && npm run lint && npm test`
Expected: PASS. `tests/content/experience.test.ts` is unchanged and still passes.

- [ ] **Step 11: Commit.**

```bash
git add lib/work/experience.ts lib/work/index.ts content/experience.ts components/home/experience-list.tsx components/home/home-site.tsx tests/work/experience.test.ts tests/ui/home.test.tsx CLAUDE.md
git commit -m "Give Experience rows a year column read from each product page

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: PrimeStore and Theme Designer pages, the PrimeTek rows and the pin order

**Files:**
- Create: `content/work/primestore.ts`, `content/work/theme-designer.ts`
- Modify: `content/work/index.ts`, `content/work/primeicons.ts` (drop the pin), `content/work/templates.ts` (pin order 4 → 3)
- Modify: `content/experience.ts` (two PrimeTek rows)
- Test: `tests/content/work.test.ts`, `tests/content/experience.test.ts`, `e2e/home.spec.ts`

**Interfaces:**
- Consumes: `ProductPage` (Task 2), `getExperience` (Task 4).
- Produces: registry order `primeone, primeblocks, primeicons, templates, primestore, theme-designer`; pins 1–4 = `primeone, primeblocks, templates, primestore`.

- [ ] **Step 1: Update the content tests first.** In `tests/content/work.test.ts`, make these replacements.

Replace the test `"lists the four PrimeTek product pages in order"` with:

```ts
  it("lists the PrimeTek product pages first, in order", () => {
    expect(getProductSlugs().slice(0, 6)).toEqual(["primeone", "primeblocks", "primeicons", "templates", "primestore", "theme-designer"]);
    for (const page of productPages.slice(0, 6)) expect(page.org).toBe("primetek");
  });
```

Replace `"states Role, Years and At on every page, with Onur's role"` with:

```ts
  it("states Role, Years and At on every PrimeTek page, with Onur's role", () => {
    for (const page of productPages.filter((p) => p.org === "primetek")) {
      expect(page.facts.map((fact) => fact.label), page.slug).toEqual(["Role", "Years", "At"]);
      expect(page.facts[0].value).toBe("Design lead");
      expect(page.facts[2].value).toBe("PrimeTek");
    }
  });
```

Replace `"gives every page a What I did text block, then a three-column highlights block"` with:

```ts
  it("gives every page What I did as its first block after Then, and a three-column highlights block", () => {
    for (const page of productPages) {
      const [first] = page.blocks.filter((block) => block.kind !== "then");
      expect(first, page.slug).toMatchObject({ kind: "text", id: "what-i-did", heading: "What I did" });
      expect(page.blocks.find((block) => block.id === "highlights"), page.slug).toMatchObject({ kind: "images", columns: 3 });
    }
  });
```

Replace the test `"pins the first highlight of each page, in registry order"` with:

```ts
  it("pins the curated Selected work, each the first highlight of its page", () => {
    const pins = getPins();
    expect(pins.map((pin) => [pin.pin.order, pin.slug, pin.blockId])).toEqual([
      [1, "primeone", "highlights"],
      [2, "primeblocks", "highlights"],
      [3, "templates", "highlights"],
      [4, "primestore", "highlights"],
    ]);
    for (const pin of pins) {
      const page = productPages.find((p) => p.slug === pin.slug)!;
      const highlights = page.blocks.find((block) => block.id === "highlights");
      expect(highlights?.kind === "images" && highlights.images[0].id).toBe(pin.image.id);
      expect(pin.pin.title.split(" ").length).toBeLessThanOrEqual(4);
    }
  });
```

Replace `"never states an unconfirmed headline number"` with:

```ts
  it("never states an unconfirmed headline number", () => {
    const text = JSON.stringify(productPages);
    for (const claim of ["80+", "500 blocks", "25+", "80 components", "500,000", "#7", "100k", "1 million"]) expect(text).not.toContain(claim);
  });
```

Replace `"keeps URLs only as credit provenance (Credit.href, https), never anywhere else"` with:

```ts
  it("keeps PrimeTek pages free of URLs except credit provenance", () => {
    for (const page of productPages.filter((p) => p.org === "primetek")) {
      const withoutCredits = JSON.stringify(page, (key, value) => (key === "credits" ? undefined : value));
      expect(withoutCredits, page.slug).not.toMatch(/https?:\/\//);
      for (const image of pageImages(page)) {
        for (const credit of image.credits ?? []) if (credit.href) expect(credit.href).toMatch(/^https:\/\//);
      }
    }
  });
```

Append a new test inside the `describe`:

```ts
  it("tells Theme Designer's pivot from PrimeDesigner", () => {
    const page = getProductPage("theme-designer")!;
    expect(page.blocks.map((block) => block.id)).toEqual(["what-i-did", "pivot", "highlights"]);
    expect(JSON.stringify(page)).toContain("PrimeDesigner");
    expect(page.facts.find((fact) => fact.label === "Years")?.value).toBe("2023–2025");
  });
```

In `tests/content/experience.test.ts`, replace the `"nests PrimeTek's products under it"` test with:

```ts
  it("nests PrimeTek's products under it, each linked to its page with the page's title and kind", () => {
    const primetek = experience.find((e) => e.org === "primetek")!;
    expect(primetek.children.map((c) => c.title)).toEqual(["PrimeOne", "PrimeBlocks", "PrimeIcons", "Templates", "PrimeStore", "Theme Designer"]);
    for (const child of primetek.children) {
      const page = productPages.find((p) => `/work/${p.slug}/` === child.href);
      expect(page, child.title).toBeDefined();
      expect(child.title).toBe(page!.title);
      expect(child.note).toBe(page!.kind);
    }
  });

  it("resolves every row's year for the home", () => {
    for (const entry of getExperience()) for (const child of entry.children) expect(child.years, child.title).toMatch(/^\d{4}(–(\d{4}|now))?$/);
  });
```

Add these imports to that file: `import { productPages } from "@/content/work";` and `import { getExperience } from "@/lib/work";`.

Run: `npx vitest run tests/content`
Expected: FAIL, because the new pages, pins and rows don't exist yet.

- [ ] **Step 2: Create `content/work/primestore.ts`.**

```ts
import type { ProductPage } from "./types";

// Onur, 2026-10-04: the 2025 redesign shipped; he led it. The screen list
// comes from the PrimeStore Figma survey (.superpowers/research/figma-survey.md).
export const primestore: ProductPage = {
  slug: "primestore",
  org: "primetek",
  title: "PrimeStore",
  kind: "template store",
  lead: {
    strong: "PrimeStore.",
    rest: "The store for PrimeTek's templates, themes and tools.",
  },
  intro: "The 2025 redesign: browsing, template pages, licensing, and a dashboard for everything a customer owns.",
  facts: [
    { label: "Role", value: "Design lead" },
    { label: "Years", value: "2025" },
    { label: "At", value: "PrimeTek" },
  ],
  blocks: [
    {
      kind: "text",
      id: "what-i-did",
      heading: "What I did",
      body: [
        "I led the 2025 redesign of PrimeStore end to end: the store and template pages, the licence flow, sign-in and sign-up, PayLink, a Command K search for templates, and a dashboard for versions, server files, payment history and subscriptions.",
      ],
    },
    {
      kind: "images",
      id: "highlights",
      heading: "Highlights",
      columns: 3,
      images: [
        {
          id: "store",
          caption: "Store",
          pin: { order: 4, title: "PrimeStore 2025", note: "The template store, redesigned end to end" },
        },
        { id: "template-detail", caption: "Template detail" },
        { id: "dashboard", caption: "Dashboard" },
      ],
    },
  ],
};
```

- [ ] **Step 3: Create `content/work/theme-designer.ts`.**

```ts
import type { ProductPage } from "./types";

// Onur, 2026-10-04: designed in 2023 as PrimeDesigner, a standalone app; after
// a pivot it shipped in 2025 as Theme Designer. Not "unreleased". The screen
// list comes from the PrimeDesigner Figma survey.
export const themeDesigner: ProductPage = {
  slug: "theme-designer",
  org: "primetek",
  title: "Theme Designer",
  kind: "theme editor",
  lead: {
    strong: "Theme Designer.",
    rest: "A visual theme editor for the Prime libraries.",
  },
  intro: "It began in 2023 as PrimeDesigner, a standalone app, and shipped in 2025 as Theme Designer.",
  facts: [
    { label: "Role", value: "Design lead" },
    { label: "Years", value: "2023–2025" },
    { label: "At", value: "PrimeTek" },
  ],
  blocks: [
    {
      kind: "text",
      id: "what-i-did",
      heading: "What I did",
      body: ["I led the design from the first PrimeDesigner screens to the Theme Designer that shipped."],
    },
    {
      kind: "text",
      id: "pivot",
      heading: "From PrimeDesigner to Theme Designer",
      body: [
        "PrimeDesigner was designed as a standalone app: themes and components to edit, sign-in, plans and billing, payment history and add-ons.",
        "The product changed course, and the design shipped in 2025 as Theme Designer.",
      ],
    },
    {
      kind: "images",
      id: "highlights",
      heading: "Highlights",
      columns: 3,
      images: [
        { id: "create-theme", caption: "Create a theme" },
        { id: "components", caption: "Components" },
        { id: "billing", caption: "Billing" },
      ],
    },
  ],
};
```

- [ ] **Step 4: Register both pages and re-order the pins.**

In `content/work/index.ts`, add `import { primestore } from "./primestore";` and `import { themeDesigner } from "./theme-designer";`. Replace the comment and array with:

```ts
// Product pages, in registry order: PrimeTek (PrimeOne, PrimeBlocks,
// PrimeIcons, Templates, PrimeStore, Theme Designer), then Orkestra in
// Experience order. The home's Selected work orders its pins by `pin.order`.
export const productPages: ProductPage[] = [primeone, primeblocks, primeicons, templates, primestore, themeDesigner];
```

In `content/work/primeicons.ts`, replace the pinned image object

```ts
        {
          id: "icon-sheet",
          caption: "Icon sheet",
          pin: { order: 3, title: "Icon sheet", note: "Drawn to replace Font Awesome" },
        },
```

with `        { id: "icon-sheet", caption: "Icon sheet" },`.

In `content/work/templates.ts`, change `pin: { order: 4, title: "Apollo", ...` to `pin: { order: 3, title: "Apollo", ...`, keeping the title and note.

- [ ] **Step 5: Add the PrimeTek Experience rows.** In `content/experience.ts`, append after the Templates child:

```ts
      { title: "PrimeStore", note: "template store", href: "/work/primestore/" },
      { title: "Theme Designer", note: "theme editor", href: "/work/theme-designer/" },
```

Check that the existing four notes equal their pages' `kind` ("design system", "UI blocks", "icon set", "app templates"). If one differs, change the note to the page's `kind`.

- [ ] **Step 6: Run the unit tests and see them pass.**

Run: `npm run typecheck && npm run lint && npm test`
Expected: PASS.

- [ ] **Step 7: Update the home e2e.** In `e2e/home.spec.ts`:

Replace the test `"Selected work shows the four pins in order, each linking to its images block"` with:

```ts
test("Selected work shows the curated pins in order, each linking to its images block", async ({ page }) => {
  await page.goto("/");
  const work = page.locator("#selected-work");
  const items = work.getByRole("listitem");
  await expect(items).toHaveCount(pins.length);
  for (const [index, pin] of pins.entries()) {
    const item = items.nth(index);
    await expect(item).toContainText(pin.pin.title);
    await expect(item).toContainText(pin.pin.note);
    await expect(item).toContainText(`FIG. ${String(pin.pin.order).padStart(2, "0")} · ${pin.pin.title}`);
    // One link per item for assistive tech: the source link. The frame links
    // to the same place, hidden and out of the tab order.
    const source = item.getByRole("link");
    await expect(source).toHaveCount(1);
    await expect(source).toHaveAccessibleName(pin.pageTitle);
    await expect(source).toHaveAttribute("href", `/work/${pin.slug}/#highlights`);
    await expect(item.locator('a[aria-hidden="true"][tabindex="-1"]')).toHaveAttribute("href", `/work/${pin.slug}/#highlights`);
  }
  await expect(work.getByRole("link", { name: "All work" })).toHaveCount(0);
});
```

In `"a Selected work source link lands on its product page's images block"`, change `{ name: "PrimeIcons" }` to `{ name: "Templates" }` and the URL regex to `/\/work\/templates\/#highlights$/`.

In the `"Experience shows product rows with confirmed dates"` test:
- change both `toHaveCount(4)` to `toHaveCount(6)`;
- add `await expect(products.getByRole("listitem").first()).toContainText("2022–2026");` after them.

In the 390px test, change `expect(lefts).toHaveLength(4);` to `expect(lefts).toHaveLength(pins.length);`.

- [ ] **Step 8: Run the home and work e2e.**

Run: `npm run build && npx playwright test e2e/home.spec.ts e2e/work-product.spec.ts e2e/work-viewer.spec.ts`
Expected: PASS. `work-product.spec.ts` loops over every registered page, so it now covers `/work/primestore/` and `/work/theme-designer/`.

- [ ] **Step 9: Commit.**

```bash
git add content/work tests/content e2e/home.spec.ts content/experience.ts
git commit -m "Add the PrimeStore and Theme Designer pages and curate the first four pins

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: The nine Orkestra pages

**Files:**
- Create: `content/work/nebuu.ts`, `rebound-line.ts`, `hi-jump.ts`, `imparator.ts`, `harf-marf.ts`, `beatografi.ts`, `countdo.ts`, `mac-kacta.ts`, `gonna.ts` (all in `content/work/`)
- Modify: `content/work/index.ts`
- Test: `tests/content/work.test.ts`, `e2e/work-product.spec.ts`

**Interfaces:**
- Consumes: `Link`, the `then` block and `links` (Task 2); the renderers (Task 3).
- Produces: registry order (15 pages): `primeone, primeblocks, primeicons, templates, primestore, theme-designer, nebuu, rebound-line, hi-jump, imparator, harf-marf, beatografi, countdo, mac-kacta, gonna`; pins 5 (Nebuu) and 6 (Beatografi). Task 7 links the Experience rows to these slugs, titles and `kind`s.

**Copy rules for the implementer.** Use the text below verbatim. Every sentence maps to a [X] or [web] fact in the fact sheet, or to an answer in `orkestra-answers.md`. Don't add or "improve" claims; wording fixes are fine.

- [ ] **Step 1: Write the failing content tests.** In `tests/content/work.test.ts`:

Append inside the `describe`:

```ts
  const orkestra = () => productPages.filter((p) => p.org === "orkestra");

  it("lists the nine Orkestra pages after PrimeTek, newest first", () => {
    expect(getProductSlugs().slice(6)).toEqual([
      "nebuu",
      "rebound-line",
      "hi-jump",
      "imparator",
      "harf-marf",
      "beatografi",
      "countdo",
      "mac-kacta",
      "gonna",
    ]);
    expect(orkestra()).toHaveLength(9);
  });

  it("states Role, Years, At and Platform on every Orkestra page", () => {
    for (const page of orkestra()) {
      expect(page.facts.map((fact) => fact.label), page.slug).toEqual(["Role", "Years", "At", "Platform"]);
      expect(page.facts[2].value).toBe("Orkestra Studios");
    }
  });

  it("puts a sourced then block only on the pages a source backs", () => {
    const withThen = productPages.filter((p) => p.blocks[0].kind === "then").map((p) => p.slug);
    expect(withThen).toEqual(["nebuu", "beatografi", "countdo", "gonna"]);
    for (const page of productPages) {
      const [first] = page.blocks;
      if (first.kind === "then") expect(first.sources?.length, page.slug).toBeGreaterThan(0);
    }
  });

  it("links Live only for products that still run", () => {
    const live = Object.fromEntries(orkestra().map((p) => [p.slug, (p.links ?? []).map((l) => l.label)]));
    expect(live).toEqual({
      nebuu: ["App Store", "Google Play", "nebuu.com"],
      "rebound-line": ["App Store"],
      "hi-jump": ["App Store"],
      imparator: ["App Store"],
      "harf-marf": ["App Store"],
      beatografi: [],
      countdo: ["count.do Remastered"],
      "mac-kacta": [],
      gonna: [],
    });
  });

  it("publishes only the numbers Onur confirmed, each with its period", () => {
    const text = (slug: string) => JSON.stringify(getProductPage(slug));
    expect(text("nebuu")).toContain("#1 in Turkey's word-game category in 2014");
    expect(text("countdo")).toContain("more than 300,000 users by December 2014");
    expect(text("harf-marf")).toContain("15,000 players by June 2017");
    expect(text("gonna")).toContain("#1 in New Social Networking on the Turkish App Store in March 2013");
  });
```

In the pins test from Task 5, extend the expected array with `[5, "nebuu", "highlights"]` and `[6, "beatografi", "highlights"]`.

Run: `npx vitest run tests/content/work.test.ts`
Expected: FAIL.

- [ ] **Step 2: Create `content/work/nebuu.ts`.**

```ts
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
```

- [ ] **Step 3: Create `content/work/countdo.ts`.**

```ts
import type { ProductPage } from "./types";

// Facts: orkestra-projects.md §3 and orkestra-answers.md. "300,000+ users" is
// orkestra.co, Dec 2014 (Onur chose it over the 100k figure). The 640 KB size
// is from Can Bülbül's page (Oct 2014).
export const countdo: ProductPage = {
  slug: "countdo",
  org: "orkestra",
  title: "count.do",
  kind: "countdown app",
  lead: {
    strong: "count.do.",
    rest: "A countdown app: set a date, watch it count down, get a nudge when it ends.",
  },
  intro:
    "Orkestra's third app and, in 2014, its most downloaded, with more than 300,000 users by December 2014. I remastered it for the web in 2026.",
  facts: [
    { label: "Role", value: "Product, design" },
    { label: "Years", value: "2013–2016" },
    { label: "At", value: "Orkestra Studios" },
    { label: "Platform", value: "iOS" },
  ],
  links: [{ label: "count.do Remastered", href: "https://countdo.orkestra.co/" }],
  blocks: [
    {
      kind: "then",
      id: "then",
      year: "2013",
      body: [
        "count.do shipped on 23 June 2013, a 640 KB app for iOS 6. On iOS 7's release day that September it already ran on the new design, and in November it went free, with no ads.",
      ],
      sources: [
        { label: "Release tweet", href: "https://x.com/w00f/status/348832940899315713" },
        { label: "iOS 7 tweet", href: "https://x.com/w00f/status/380393852739137536" },
        { label: "Free, no ads", href: "https://x.com/w00f/status/404206994212814848" },
        { label: "640 KB", href: "https://web.archive.org/web/20141018090049/http://countdo.co/" },
      ],
    },
    {
      kind: "text",
      id: "what-i-did",
      heading: "What I did",
      body: ["Product and design: the idea, the interface, the icon and the store art. Can Bülbül built it."],
    },
    {
      kind: "images",
      id: "highlights",
      heading: "Highlights",
      columns: 3,
      images: [
        { id: "countdowns", caption: "Countdowns" },
        { id: "themes", caption: "Themes" },
        { id: "icon", caption: "App icon" },
      ],
    },
  ],
};
```

- [ ] **Step 4: Create `content/work/mac-kacta.ts`.**

```ts
import type { ProductPage } from "./types";

// Facts: orkestra-projects.md §4. No sourced context for a then block.
export const macKacta: ProductPage = {
  slug: "mac-kacta",
  org: "orkestra",
  title: "Maç Kaçta",
  kind: "football fixtures",
  lead: {
    strong: "Maç Kaçta.",
    rest: "The easiest way to follow your team: where, when and against whom it plays next.",
  },
  intro: "An iPhone app for football fans, with standings, past matches and a theme in your team's colours.",
  facts: [
    { label: "Role", value: "Product, design" },
    { label: "Years", value: "2013–2014" },
    { label: "At", value: "Orkestra Studios" },
    { label: "Platform", value: "iOS" },
  ],
  blocks: [
    {
      kind: "text",
      id: "what-i-did",
      heading: "What I did",
      body: ["Product and design: the idea, the interface, the icon and the store art."],
    },
    {
      kind: "images",
      id: "highlights",
      heading: "Highlights",
      columns: 3,
      images: [
        { id: "next-match", caption: "Next match" },
        { id: "standings", caption: "Standings" },
        { id: "team-theme", caption: "Team theme" },
      ],
    },
  ],
};
```

- [ ] **Step 5: Create `content/work/gonna.ts`.**

```ts
import type { ProductPage } from "./types";

// Facts: orkestra-projects.md §5 and orkestra-answers.md. Onur: Orkestra was
// founded in 2013 when the Gonnasphere team went on; Gonna is its first
// product. The lessons summarise his 2014 post-mortem "How we failed?".
export const gonna: ProductPage = {
  slug: "gonna",
  org: "orkestra",
  title: "Gonna",
  kind: "social agenda",
  lead: {
    strong: "Gonna.",
    rest: "A social agenda: write what you're going to do, and see what your friends, musicians and teams plan.",
  },
  intro:
    "It started in 2012 as Gonnasphere on the web and came to the iPhone as Gonna in March 2013, the first product of the team that became Orkestra.",
  facts: [
    { label: "Role", value: "Co-founder, CPO" },
    { label: "Years", value: "2012–2014" },
    { label: "At", value: "Orkestra Studios" },
    { label: "Platform", value: "Web, iOS" },
  ],
  blocks: [
    {
      kind: "then",
      id: "then",
      year: "2012",
      body: [
        "Three Bilkent computer science students put to-do lists on a social network, a year before the iPhone app. Blogs abroad called it the Twitter of to-do lists, and in September 2012 it had visitors from 100 countries.",
      ],
      sources: [
        { label: "How we failed?", href: "https://web.archive.org/web/2014/https://medium.com/p/facc7841ad86" },
        { label: "Press", href: "https://web.archive.org/web/2014/http://blog.getgonna.com/press" },
        { label: "100 countries", href: "https://x.com/w00f/status/252851507391766528" },
      ],
    },
    {
      kind: "text",
      id: "what-i-did",
      heading: "What I did",
      body: [
        "As co-founder and CPO I led the product and designed it: the Gonnasphere web app in 2012, then Gonna for iPhone and getgonna.com in 2013.",
      ],
    },
    {
      kind: "text",
      id: "recognition",
      heading: "Recognition",
      body: [
        "Second place among more than 2,800 projects in the MIT Enterprise Forum Turkey Business Plan Competition 2012, with a $15,000 prize and a 16-day US trip that December: Stanford, MIT, Harvard and The World Bank.",
        "The iPhone app reached #1 in New Social Networking on the Turkish App Store in March 2013.",
      ],
      links: [
        {
          label: "MIT EF Turkey result",
          href: "https://web.archive.org/web/2014/http://blog.gonnasphere.com/2012/05/mit-ef-turkey-business-plan-competition/",
        },
      ],
    },
    {
      kind: "text",
      id: "lessons",
      heading: "What I learned",
      body: [
        "In 2014 I wrote down why Gonna failed. The short version:",
        "No revenue model, and little marketing or sales experience.",
        "No viral loop, and a value most people didn't see: almost 90% of users didn't understand what to do.",
        "Web first. We went mobile too late.",
      ],
      links: [{ label: "How we failed?", href: "https://web.archive.org/web/2014/https://medium.com/p/facc7841ad86" }],
    },
    {
      kind: "images",
      id: "highlights",
      heading: "Highlights",
      columns: 3,
      images: [
        { id: "gonnasphere-web", caption: "Gonnasphere, web" },
        { id: "gonna-iphone", caption: "Gonna for iPhone" },
        { id: "getgonna", caption: "getgonna.com" },
      ],
    },
  ],
};
```

- [ ] **Step 6: Create `content/work/beatografi.ts`.**

```ts
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
          pin: { order: 6, title: "Beatografi", note: "A marketplace for Turkish beatmakers" },
        },
        { id: "beat-page", caption: "Beat page" },
        { id: "campaigns", caption: "Campaigns" },
      ],
    },
  ],
};
```

- [ ] **Step 7: Create `content/work/harf-marf.ts`.**

```ts
import type { ProductPage } from "./types";

// Facts: orkestra-projects.md §6. "15,000 players" is from the v1.3 release
// notes (2017-06-29).
export const harfMarf: ProductPage = {
  slug: "harf-marf",
  org: "orkestra",
  title: "Harf Marf",
  kind: "word puzzle",
  lead: {
    strong: "Harf Marf.",
    rest: "A word puzzle where most letters are wrong: you solve it by reading words as a whole.",
  },
  intro: "A calm iOS puzzle with relaxing music. It had 15,000 players by June 2017.",
  facts: [
    { label: "Role", value: "Product, design" },
    { label: "Years", value: "2016–2017" },
    { label: "At", value: "Orkestra Studios" },
    { label: "Platform", value: "iOS" },
  ],
  links: [{ label: "App Store", href: "https://apps.apple.com/tr/app/harf-marf/id1073072194" }],
  blocks: [
    {
      kind: "text",
      id: "what-i-did",
      heading: "What I did",
      body: ["Product and design: the idea, the interface, the icon and the store art."],
    },
    {
      kind: "images",
      id: "highlights",
      heading: "Highlights",
      columns: 3,
      images: [
        { id: "puzzle", caption: "Puzzle" },
        { id: "levels", caption: "Levels" },
        { id: "icon", caption: "App icon" },
      ],
    },
  ],
};
```

- [ ] **Step 8: Create `content/work/imparator.ts`.**

```ts
import type { ProductPage } from "./types";

// Facts: orkestra-projects.md §9 (App Store text and version history).
export const imparator: ProductPage = {
  slug: "imparator",
  org: "orkestra",
  title: "İmparator",
  kind: "football card game",
  lead: {
    strong: "İmparator.",
    rest: "A Turkish football card game: build a squad from two decades of Turkish football.",
  },
  intro:
    "Collect players, legends included, set your tactics, and play friendlies and league matches to win more cards. Its last update brought the 2018/19 Süper Lig season.",
  facts: [
    { label: "Role", value: "Product, design" },
    { label: "Years", value: "2017–2018" },
    { label: "At", value: "Orkestra Studios" },
    { label: "Platform", value: "iOS" },
  ],
  links: [{ label: "App Store", href: "https://apps.apple.com/tr/app/i-mparator-futbol-menajer-19/id1201188587" }],
  blocks: [
    {
      kind: "text",
      id: "what-i-did",
      heading: "What I did",
      body: ["Product and design: the idea, the interface, the icon and the store art."],
    },
    {
      kind: "images",
      id: "highlights",
      heading: "Highlights",
      columns: 3,
      images: [
        { id: "cards", caption: "Cards" },
        { id: "squad", caption: "Squad" },
        { id: "match", caption: "Match" },
      ],
    },
  ],
};
```

- [ ] **Step 9: Create `content/work/hi-jump.ts`.**

```ts
import type { ProductPage } from "./types";

// Facts: orkestra-projects.md §7 (App Store record only).
export const hiJump: ProductPage = {
  slug: "hi-jump",
  org: "orkestra",
  title: "Hi Jump",
  kind: "arcade game",
  lead: {
    strong: "Hi Jump.",
    rest: "An arcade climber: drag the ball and help Hi climb as many floors as you can.",
  },
  intro: "A small iOS game in English, German and Turkish, with scores to share on Instagram.",
  facts: [
    { label: "Role", value: "Product, design" },
    { label: "Years", value: "2018" },
    { label: "At", value: "Orkestra Studios" },
    { label: "Platform", value: "iOS" },
  ],
  links: [{ label: "App Store", href: "https://apps.apple.com/us/app/hi-jump-rescue-him/id1361521201" }],
  blocks: [
    {
      kind: "text",
      id: "what-i-did",
      heading: "What I did",
      body: ["Product and design: the idea, the interface, the icon and the store art."],
    },
    {
      kind: "images",
      id: "highlights",
      heading: "Highlights",
      columns: 3,
      images: [
        { id: "climb", caption: "Climb" },
        { id: "hi", caption: "Hi" },
        { id: "score", caption: "Score" },
      ],
    },
  ],
};
```

- [ ] **Step 10: Create `content/work/rebound-line.ts`.**

```ts
import type { ProductPage } from "./types";

// Facts: orkestra-projects.md §8 (App Store record only).
export const reboundLine: ProductPage = {
  slug: "rebound-line",
  org: "orkestra",
  title: "Rebound Line",
  kind: "arcade game",
  lead: {
    strong: "Rebound Line.",
    rest: "Draw lines to bounce the ball: the bigger the line, the higher the jump.",
  },
  intro: "An iOS arcade game with obstacles, online play and a leaderboard, and scores to share on Instagram Stories.",
  facts: [
    { label: "Role", value: "Product, design" },
    { label: "Years", value: "2019" },
    { label: "At", value: "Orkestra Studios" },
    { label: "Platform", value: "iOS" },
  ],
  links: [{ label: "App Store", href: "https://apps.apple.com/tr/app/rebound-line/id1446630383" }],
  blocks: [
    {
      kind: "text",
      id: "what-i-did",
      heading: "What I did",
      body: ["Product and design: the idea, the interface, the icon and the store art."],
    },
    {
      kind: "images",
      id: "highlights",
      heading: "Highlights",
      columns: 3,
      images: [
        { id: "draw", caption: "Draw a line" },
        { id: "obstacles", caption: "Obstacles" },
        { id: "leaderboard", caption: "Leaderboard" },
      ],
    },
  ],
};
```

- [ ] **Step 11: Register the nine pages.** In `content/work/index.ts`, import each page (`nebuu`, `reboundLine`, `hiJump`, `imparator`, `harfMarf`, `beatografi`, `countdo`, `macKacta`, `gonna`) and replace the array with:

```ts
export const productPages: ProductPage[] = [
  primeone,
  primeblocks,
  primeicons,
  templates,
  primestore,
  themeDesigner,
  nebuu,
  reboundLine,
  hiJump,
  imparator,
  harfMarf,
  beatografi,
  countdo,
  macKacta,
  gonna,
];
```

- [ ] **Step 12: Run the unit tests and see them pass.**

Run: `npm run typecheck && npm run lint && npm test`
Expected: PASS.

- [ ] **Step 13: Update the product-page e2e.** In `e2e/work-product.spec.ts`, replace the test `"the product pages link out only to @w00f posts (there are none today)"` with:

```ts
test("PrimeTek product pages carry no external links", async ({ page }) => {
  for (const { slug } of productPages.filter((p) => p.org === "primetek")) {
    await page.goto(`/work/${slug}/`);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator('main a[href^="http"]'), slug).toHaveCount(0);
  }
});

test("an Orkestra page shows its Then block first and its Live links", async ({ page }) => {
  await page.goto("/work/nebuu/");
  const main = page.locator("main");
  const ids = await main.locator("section[id]").evaluateAll((sections) => sections.map((s) => s.id));
  expect(ids[0]).toBe("then");
  await expect(main.locator("#then h2")).toHaveText("Then 2013");
  await expect(main.locator("#then")).toContainText("Sources:");
  const live = main.locator("dl dd").last();
  await expect(main.locator("dl dt").last()).toHaveText("Live");
  for (const name of ["App Store", "Google Play", "nebuu.com"]) {
    const link = live.getByRole("link", { name });
    await expect(link).toHaveAttribute("href", /^https:\/\//);
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }
});

test("an ended Orkestra product has no Live row", async ({ page }) => {
  await page.goto("/work/beatografi/");
  await expect(page.locator("main dl dt", { hasText: "Live" })).toHaveCount(0);
});
```

- [ ] **Step 14: Run the e2e.**

Run: `npm run build && npx playwright test e2e/work-product.spec.ts e2e/home.spec.ts`
Expected: PASS. The per-page loop now covers all 15 pages, and `ids` equals `page.blocks.map((b) => b.id)` because the Then row has `id="then"`.

- [ ] **Step 15: Commit.**

```bash
git add content/work tests/content/work.test.ts e2e/work-product.spec.ts
git commit -m "Add the nine Orkestra product pages with sourced Then blocks and Live links

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Home: Orkestra Experience rows and the Lab entries

**Files:**
- Modify: `content/experience.ts` (Orkestra children), `content/lab-index.ts`
- Modify: `CLAUDE.md` (the pins sentence)
- Test: `tests/content/experience.test.ts`, `tests/ui/home.test.tsx` (labIndex), `e2e/home.spec.ts`

**Interfaces:**
- Consumes: the Orkestra slugs, titles and `kind`s (Task 6), and `getExperience` (Task 4).

- [ ] **Step 1: Write the failing tests.** In `tests/content/experience.test.ts`, append inside `describe("experience", ...)`:

```ts
  it("nests the nine Orkestra products, newest first, each linked to its page with the page's title and kind", () => {
    const orkestra = experience.find((e) => e.org === "orkestra")!;
    expect(orkestra.children.map((c) => c.title)).toEqual([
      "Nebuu",
      "Rebound Line",
      "Hi Jump",
      "İmparator",
      "Harf Marf",
      "Beatografi",
      "count.do",
      "Maç Kaçta",
      "Gonna",
    ]);
    for (const child of orkestra.children) {
      const page = productPages.find((p) => `/work/${p.slug}/` === child.href);
      expect(page, child.title).toBeDefined();
      expect(child.title).toBe(page!.title);
      expect(child.note).toBe(page!.kind);
      expect(child.years, child.title).toBeUndefined();
    }
  });
```

In `tests/ui/home.test.tsx`, append inside `describe("labIndex", ...)`:

```ts
  it("lists this site, then Onur's six 2026 projects in his order, each linked over https", () => {
    expect(labIndex.map((entry) => entry.title)).toEqual([
      "onursenture.com",
      "Cehennem Rebirth",
      "count.do Remastered",
      "Motif",
      "tanerman.com",
      "Dönerverse",
      "Nebuu Deck Studio",
    ]);
    for (const entry of labIndex) expect(entry.href, entry.title).toMatch(/^https:\/\//);
  });
```

Run: `npx vitest run tests/content/experience.test.ts tests/ui/home.test.tsx`
Expected: FAIL.

- [ ] **Step 2: Replace the Orkestra children.** In `content/experience.ts`, set the Orkestra entry's `children` to:

```ts
    children: [
      { title: "Nebuu", note: "word game", href: "/work/nebuu/" },
      { title: "Rebound Line", note: "arcade game", href: "/work/rebound-line/" },
      { title: "Hi Jump", note: "arcade game", href: "/work/hi-jump/" },
      { title: "İmparator", note: "football card game", href: "/work/imparator/" },
      { title: "Harf Marf", note: "word puzzle", href: "/work/harf-marf/" },
      { title: "Beatografi", note: "beat marketplace", href: "/work/beatografi/" },
      { title: "count.do", note: "countdown app", href: "/work/countdo/" },
      { title: "Maç Kaçta", note: "football fixtures", href: "/work/mac-kacta/" },
      { title: "Gonna", note: "social agenda", href: "/work/gonna/" },
    ],
```

Update the file's top comment to: `// Roles and dates as on Onur's LinkedIn (read 2026-10-03). Only confirmed facts. Every product links its page; the row's year comes from that page (lib/work/experience.ts).`

- [ ] **Step 3: Add the Lab entries.** In `content/lab-index.ts`, append after the existing entry (Onur's order, 2026-10-04; copy drafted from each project's own page or README):

```ts
  {
    title: "Cehennem Rebirth",
    description:
      "An unofficial revival of Cehennem Online, the Turkish internet community started in December 1998, rebuilt as a modern forum with editor-reviewed news and docs.",
    year: "2026",
    href: "https://cehennem-rebirth.vercel.app/",
  },
  {
    title: "count.do Remastered",
    description: "Orkestra's 2013 countdown app, remastered.",
    year: "2026",
    href: "https://countdo.orkestra.co/",
  },
  {
    title: "Motif",
    description: "A carpet-pattern generator for Tanerman's stage visuals.",
    year: "2026",
    href: "https://motif.tanerman.com/",
  },
  {
    title: "tanerman.com",
    description: "Homepage for the producer and DJ Tanerman: dates, bio, booking.",
    year: "2026",
    href: "https://tanerman.com/",
  },
  {
    title: "Dönerverse",
    description: "A clicker game, inspired by Clicking Bad, that grows one knife and one skewer into a global, then orbital, döner empire.",
    year: "2026",
    href: "https://donerverse.vercel.app/",
  },
  {
    title: "Nebuu Deck Studio",
    description: "An internal tool for improving Nebuu's word-card decks.",
    year: "2026",
    href: "https://studio.nebuu.com/",
  },
```

- [ ] **Step 4: Run the unit tests and see them pass.**

Run: `npm run typecheck && npm run lint && npm test`
Expected: PASS.

- [ ] **Step 5: Update the home e2e.** In `e2e/home.spec.ts`, replace the test `"Experience shows product rows with confirmed dates"` with:

```ts
test("Experience shows every product as a linked row with its year", async ({ page }) => {
  await page.goto("/");
  const tree = page.locator("#experience");
  await expect(tree).toContainText("Jun 2013–now");
  await expect(tree).toContainText("May 2016–Apr 2026");
  await expect(tree).toContainText("Apr 2014–Mar 2016");
  const primetek = tree.getByRole("list", { name: "PrimeTek work" });
  await expect(primetek.getByRole("listitem")).toHaveCount(6);
  await expect(primetek.getByRole("link")).toHaveCount(6);
  const orkestra = tree.getByRole("list", { name: "Orkestra Studios work" });
  await expect(orkestra.getByRole("listitem")).toHaveCount(9);
  await expect(orkestra.getByRole("link")).toHaveCount(9);
  await expect(orkestra.getByRole("listitem").first()).toContainText("2013–now");
  await expect(orkestra.getByRole("listitem").last()).toContainText("2012–2014");
  await expect(tree.getByRole("link", { name: "PrimeIcons" })).toHaveAttribute("href", "/work/primeicons/");
  await expect(tree.getByRole("link", { name: "Nebuu" })).toHaveAttribute("href", "/work/nebuu/");
  const text = (await tree.textContent()) ?? "";
  expect(text).not.toMatch(/[├└]/);
});
```

In `"Lab lists text rows without glyphs or avatars; only linked entries link"`, change `await expect(lab.getByRole("link")).toHaveCount(1);` to `await expect(lab.getByRole("link")).toHaveCount(7);`.

Inside `test.describe("at 390px", ...)`, add:

```ts
  test("Experience keeps the year visible and truncates the note", async ({ page }) => {
    await page.goto("/");
    const row = page.getByRole("list", { name: "Orkestra Studios work" }).getByRole("listitem").nth(3);
    await expect(row).toContainText("2017–2018");
    const year = row.locator("span").last();
    await expect(year).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  });
```

- [ ] **Step 6: Update the `CLAUDE.md` pins sentence.** Replace `Today each page pins the first image of its \`highlights\` block (orders 1–4: PrimeOne, PrimeBlocks, PrimeIcons, Templates).` with `Six curated pins (Sprint 6, Onur): PrimeOne, PrimeBlocks, Templates, PrimeStore, Nebuu, Beatografi, each the first image of its page's \`highlights\` block (orders 1–6). Other pages carry no pin.`

- [ ] **Step 7: Run the e2e.**

Run: `npm run build && npx playwright test e2e/home.spec.ts`
Expected: PASS.

- [ ] **Step 8: Commit.**

```bash
git add content/experience.ts content/lab-index.ts tests/content/experience.test.ts tests/ui/home.test.tsx e2e/home.spec.ts CLAUDE.md
git commit -m "Link every Orkestra product from Experience and add Onur's 2026 Lab projects

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Verification, follow-ups and the PR (controller)

- [ ] **Step 1: Full CI parity.**

Run: `npm run typecheck && npm run lint && npm test && npm run build && npm run e2e`, then `SOURCE_FIXTURES=1 npm run build && npm run e2e:fixtures`, then `npm run build` again, so the local `.next` isn't left in fixture mode.
Expected: all PASS.

- [ ] **Step 2: Screenshots.**

Run: `npm run screenshots -- /tmp/sprint-6 / /work/nebuu/ /work/theme-designer/ /work/gonna/`

Then check:
- the Then block on Nebuu and Gonna against `docs/superpowers/specs/2026-10-04-sprint-6-mockups/orkestra-page.html` (option A): "Then" muted, the year in Doto accent under it, the text in the 480px column, the sources line;
- the Live row's alignment in the facts;
- Experience at 390: the notes truncate, the years stay visible, and there is no horizontal scroll;
- Selected work at 1440: two full rows of 3.

- [ ] **Step 3: Write `docs/superpowers/plans/2026-10-04-sprint-6-followups.md`.** It holds the pre-merge checks for Onur on the Vercel preview:
  - **Copy approval** for the 11 pages and the Lab lines. In particular:
    - Nebuu's "What I did" ("and every update since 2013");
    - Gonna's lessons, worded from the post-mortem;
    - the count.do remaster line in the intro ("I remastered it for the web in 2026").
  - **The image list per page:** 3 per page; 16:10, 2560×1600 into `images-src/work/<slug>/<image id>.(png|jpg)`. The ids are in each `content/work/<slug>.ts`.
  - **The CDN check** (the same curl loop as in Sprint 5), adding `/work/nebuu/` and `/work/gonna/`.
  - **Notes for later sprints:**
    - "Orkestra reached more than 1 million people (2016)" is approved but has no home yet: an Orkestra bio line or a future Orkestra page.
    - The Orkestra Live links depend on the App Store listings staying up; check them yearly.

- [ ] **Step 4: Commit the follow-ups and push the branch** (after asking Onur, per the workflow).

```bash
git add docs/superpowers/plans/2026-10-04-sprint-6-followups.md
git commit -m "Note the Sprint 6 pre-merge checks

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -u origin sprint-6
```

- [ ] **Step 5: Open the PR into `v2`** (after asking Onur): title "Sprint 6: Orkestra and two PrimeTek pages". The body summarises the pages, the Then block, the link policy, Experience, the pins and Lab, and links the follow-ups file. End it with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
