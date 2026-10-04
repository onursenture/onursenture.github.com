# Sprint 8: Resume and Book a call — Design Spec

## Overview

Sprint 8 adds the two professional pieces the foundation spec reserved (`2026-10-02-site-v2-foundation-design.md`: "Resume" and "Book a call"):
- **`/resume/`**: a web resume on the site grid;
- **`/resume.pdf`**: a real PDF from the same data;
- **`/book/`**: three call types with the cal.com calendar inline.

Onur edits the resume in the admin, like the rest of the professional content (Sprint 7). The Bio editor also gains two switches: Open to work, and Book a call on the home.

The decisions come from a brainstorm with Onur on 2026-10-04. The mockups are in `2026-10-04-sprint-8-mockups/`:
- `resume-layout.html`: option A is chosen;
- `resume-pdf.html`: option A is chosen;
- `book-layout.html`: option A is chosen, with the change that the calendar stays in the content column.

The copy in the mockups is a draft.

## Decisions

| Topic | Decision |
|---|---|
| Resume data | **An admin-edited `resume` document** on the Sprint 7 overlay. The org, role and dates come from the Experience document, so there is one source. The resume adds a summary, bullets per role, projects, skills, education and contact. |
| Sections | Header (name, role, place, contact), Summary, Experience, Projects, Skills, Education. **No Awards.** |
| Contact | Email, onursenture.com and LinkedIn, plus Book a call on the web. No phone. |
| Web layout | **Mockup A: on the site grid**, label \| content \| action, with dither rules between rows. |
| PDF | **Generated on the server** with `@react-pdf/renderer` (no Chromium) at `/resume.pdf`. **Paper A: "the site on paper"**, A4, one page as the goal and two at most. |
| Booking tool | **cal.com.** Onur has an account; the event types are created in Task 1. |
| Booking UX | **A `/book/` page with rows that open in place.** The cal.com inline embed opens under the chosen row, **within the 480px content column** (not stretched across the wide row). The choice is kept in the hash. |
| Entry points | **Resume →** only as the home Experience row's action. **Book a call →** as a plain text link under the home bio (switchable in the admin), and in the resume header. **No header nav, and no accent buttons**: every entry point is a `TextLink`. |
| Admin | The `/admin/resume/` editor. The Bio editor gains **Open to work** and **Book a call on home** switches. The booking config stays in the repo. |

## 1. Data

### 1.1 The `resume` document

A new `content_docs` key, `resume`. It has the same draft, preview and publish cycle as every Sprint 7 document. Its repo fallback is `content/resume.ts`.

```ts
interface Resume {
  contact: {
    email: string;        // shown on the web (see 3.1) and in the PDF
    linkedin: string;     // handle; the URL is built as https://www.linkedin.com/in/<handle>/
  };
  summary: string;        // 2–3 sentences; empty means the row is hidden
  roles: { org: OrgId; bullets: string[] }[];
  projects: { title: string; line: string; href?: string }[];
  skills: { group: string; items: string }[];   // one row per group: "Design" → "Design systems, Figma, icons"
  education: { degree: string; school: string; years?: string }[];
}
```

The zod schema goes in `lib/content/schemas.ts` (strict and loose variants, like the others) and is pinned to the type by `tests/content/schemas.test.ts`.

**Roles join Experience.** The Experience document stays the only source for an org's name, role, dates and products. A resume role holds only `{ org, bullets }`:
- **Order.** The resume's Experience section follows the Experience document's order.
- **Org without a resume role.** It still renders, with its header line and products and no bullets.
- **Resume role whose org is not in Experience.** This is a validation error (1.3).

The derived view (`lib/resume/view.ts`, pure, tested) gives each role:
- the org name and mark;
- the role and span (`formatSpan`);
- the bullets;
- the products, from `ExperienceChild` (`title`, `href`).

**Projects.** A project is free text, with an optional `href`. In the admin, "Add from…" lists the product pages and the Lab entries, and fills `title` and `href` from the chosen one. The `line` is always Onur's own text. The `title` is not kept in sync with the product page afterwards: a project is a resume line, not a reference.

### 1.2 Profile switches

The `profile` document gains two booleans:
- `available`: renders "Open to work ●" in the home identity row's action column.
- `bookOnHome`: renders "Book a call →" under the bio.

Both fields are optional in the schema, so published `profile` rows written before Sprint 8 still parse. A missing field falls back to the repo value from `content/profile.ts`, where `available: true` and `bookOnHome: true`. `ProfileCopy` becomes `Pick<Profile, "lead" | "bio" | "available" | "bookOnHome">`. The home reads both values from `getHomeContent().profile`, no longer from the static `profile` import.

`Profile.bookingUrl` is removed. Booking now has its own config (1.4).

### 1.3 Validation

`validateSite` gains these resume rules. Publish is strict, and a public read warns and falls back to the repo resume (the same fail-soft as the Experience rows):
- every `roles[].org` exists in the Experience document, with no duplicate org;
- `contact.email` is a plausible email address (`x@y.z`), and `contact.linkedin` is a handle, not a URL;
- a project `href` is either `/work/<slug>/` for an existing product page, or https;
- bullets, project lines, skill items and degree fields are non-empty after trimming.

`validateSite` checks the whole would-be site on every publish, so publishing **Experience** also runs the resume rules: removing an org that the resume uses is refused, and the issue names the resume.

### 1.4 Booking config (repo)

The booking config lives in `content/booking.ts`:

```ts
export const booking: {
  calUsername: string;     // "" until Task 1; empty disables booking everywhere
  types: { id: "role" | "project" | "mentoring"; slug: string; title: string; minutes: number; description: string }[];
};
```

The draft types are:
- **Role / hiring**, 30 min: "You're hiring for a design or design-engineering role."
- **Project / freelance**, 30 min: "A product, design system or app you want built."
- **Mentoring / intro**, 20 min: "Portfolio feedback, design systems, a first hello."

The suggested cal.com slugs are `role`, `project` and `mentoring`. The minutes must match the cal.com event type. A unit test checks the shape: three unique ids and slugs, minutes greater than 0.

`bookingEnabled()` returns true when `calUsername` is set. When it is false:
- `/book/` 404s inside the Work shell;
- both Book a call links are not rendered;
- the `bookOnHome` switch still saves, and the home ignores it.

### 1.5 Initial draft

The controller writes `content/resume.ts` from confirmed facts only: LinkedIn (read 2026-10-03), `.superpowers/research/` and the approved numbers in the Sprint 6 notes. Nothing new is invented. Fields with no confirmed source are left empty, and an empty section is hidden:
- `contact.email`;
- `contact.linkedin`;
- the education `years`.

Onur rewrites the copy in the admin. The honest-numbers rule applies: every figure is literally true and names its period.

## 2. Entry points

- **Home, identity row.** The action column shows "Open to work ●" when `available` is on. "Book a call →" appears under the bio as a plain `TextLink` to `/book/` when `bookOnHome` is on and booking is enabled. It replaces the old `PrimaryButton` path, which is removed.
- **Home, Experience row.** The action is "Resume →" (`TextLink` to `/resume/`). Today `sectionLink()` ties this action to the nav item's `ready` flag, which would also put a nav into the header. Split the two ideas: `NavItem` gets `inHeader: boolean`. Resume is `ready: true, inHeader: false`, and Lab stays `ready: false`. The header shows only items that are `ready && inHeader`. So the header stays without a nav and without the Menu button.
- **Resume header.** "Download PDF ↓" and, under it, "Book a call →" (when booking is enabled), both `TextLink`s in the action column.
- **Nowhere else.** No footer links and no header nav.

## 3. Pages

### 3.1 `/resume/` (mockup A)

`app/(work)/resume/page.tsx` is static. It reads `getPublishedContent()` through a new `getResume()` in `lib/resume/`. Everything sits on `ROW_GRID`, with a `DitherRule` between rows.

1. **Header** (`SectionRow`, `labelAs="div"`):
   - Label column: `← Home`.
   - Content: the `h1` with `type-lead` (name, then the muted role line from `profile.role`), then `profile.location.place` with "remote / hybrid" in `type-meta`, then the contact line: email · onursenture.com · LinkedIn ↗.
   - Action: "Download PDF ↓" (`/resume.pdf`), then "Book a call →".
2. **Summary**: `type-body text-fg-soft`.
3. **Experience**: for each role, a header line in the same style as the home Experience (org mark, name, `· role`, span right-aligned), its bullets as a list, and then its products as one muted line of links (`PrimeOne · PrimeBlocks · …`). A product with no `href` is plain text.
4. **Projects**: one row per project, with the title (linked when `href` is set, `↗` when external), then ` — ` and the line.
5. **Skills**: one line per group, with the muted group name followed by the items.
6. **Education**: the degree and school, with the years right-aligned when set.

Each section is left out when it is empty. The email is not plain text in the static HTML. The server renders the address with its `@` and dots swapped for spans (`onur<span>@</span>…`), and a small client component turns it into a `mailto:` link after hydration. This is basic protection against scrapers, and the visible text reads the same.

Metadata comes from `pageMetadata()`: the title is "Resume", the description is the summary's first sentence, and there is no `og:image`. The page is in the sitemap and indexable.

### 3.2 `/resume.pdf` (paper A)

- **Route.** `app/resume.pdf/route.ts` is a GET handler. Next skips the trailing-slash redirect for paths with a file extension, so `/resume.pdf` is served as it is; e2e asserts that. The handler is in the Node runtime and uses `"use cache"` with `cacheTag("content")`, so a publish regenerates the PDF. The response carries:
  - `Content-Type: application/pdf`;
  - `Content-Disposition: inline; filename="onur-senture-resume.pdf"`;
  - the same `Cache-Control` the proxy sets for pages.
- **Renderer.** The renderer is `@react-pdf/renderer`, pinned exactly. The document component is `lib/resume/pdf/resume-document.tsx` and takes the same derived view as the web page. If the bundler chokes on the package, add it to `serverExternalPackages`; the plan verifies this with a production build.
- **Fonts.** IBM Plex Sans (600) and IBM Plex Mono (400, 500) are TTF files vendored in `lib/resume/pdf/fonts/`, under the OFL with its licence file, and registered with `Font.register`. Hyphenation is off.
- **Layout (A4).**
  - Margins are 40pt.
  - The header row has the name in Plex Sans 600 at about 18pt, with the role line, place and remote / hybrid under it, and the contact block right-aligned (email, onursenture.com, LinkedIn URL).
  - The sections are rows with a label column of about 70pt in muted ink and a content column, with 0.5pt hairline rules between rows.
  - Body text is Plex Mono at about 8.5pt.
  - Ink is black, the muted ink is the light `fg-muted` token value, and links use the accent colour. Every link is a real PDF link: email, site, LinkedIn, product pages (absolute `https://onursenture.com/work/<slug>/`) and projects.
  - Experience shows the full months (`May 2016–Apr 2026`).
- **Length.** The target is one page and two pages is the maximum. A role's block never splits across pages (`wrap={false}`). An e2e test fails if the repo draft renders more than two pages.
- **Failure.** If rendering throws, the handler logs the error and returns 500 with a plain-text body. `/resume/` still renders and its link still points to `/resume.pdf`.
- **Admin preview.** `/admin/preview/resume.pdf` renders the draft (loose) behind the admin session, and the editor's toolbar has a "Preview PDF ↗" link to it.

### 3.3 `/book/` (mockup A, narrow)

`app/(work)/book/page.tsx` is static and 404s when booking is disabled.

1. **Header**: in the label column `← Home`. The content is the `h1` "Book a call." with the muted line "Pick what it's about; times show in your time zone."
2. **Call type**: one hairline row per type, in the 480px content column. Each row has the title, a muted `· N min`, the description on the next line, and on the right "Choose →", a link to `#<id>`. The selected row shows a muted "Selected" instead, and the title in the accent colour.

**Selection.** The choice lives only in the hash (`#role`, `#project`, `#mentoring`). The page never reads `searchParams`, so there is one HTML per path and the CDN cache holds.
- A client component (`BookingPicker`) reads the hash after hydration and listens to `hashchange`.
- Choosing a row sets the hash with `history.replaceState`, so Back leaves the page instead of stepping through the choices, and moves focus to the opened calendar's region.
- An unknown hash means no row is selected.

**Embed.**
- **Placement.** The calendar opens directly under the selected row, inside the 480px content column. It is not stretched across the wide row, and the other rows stay visible under it.
- **Script.** `embed.js` (cal.com's official inline embed, loaded from `app.cal.com`) is injected only on the first selection, so the page makes no cal.com request until then.
- **Config.** `calLink: "<calUsername>/<slug>"`, `layout: "month_view"`, `theme: "light"`, `hideEventTypeDetails: true`. The brand colour is the accent token, read with `useTokenColor`.
- **Switching type.** Choosing another row re-inits the embed in that row.
- **Fallback.** Under the calendar, the selected row always shows a muted "Trouble loading? Open on cal.com ↗" link to `https://cal.com/<username>/<slug>`. Without JavaScript, every row's "Choose →" is that cal.com link instead of the hash link (the client swaps it in after hydration).
- **Narrow column.** At 480px, cal.com may stack the calendar above the times. That is accepted; the screenshots in 5 check that it reads well.

Metadata: the title is "Book a call", there is no `og:image`, and the page is indexable.

## 4. Admin

### 4.1 `/admin/resume/`

The `/admin/resume/` editor uses the Sprint 7 two-pane pattern: `EditorFrame`, `DocToolbar`, a manual Save draft and Cmd/Ctrl+S, Publish, Discard and Reset to repo version, the leave warning, and the issue banner with `labelIssue`. The preview iframe is `/admin/preview/resume/` (the web page from the draft, loose). The toolbar adds "Preview PDF ↗".

The form has one card per section:
- **Contact**: email, LinkedIn handle.
- **Summary**: a textarea.
- **Roles**: one card per org in the Experience document, in that order, titled `Org · role · span`. Inside it, bullets can be added, removed and dragged (`SortableList`). A Roles card cannot be added or removed here, because the orgs come from Experience. An org with no bullets simply has an empty list.
- **Projects**: a sortable list of `{ title, line, href }`, with "Add from…" (a select of product pages and Lab entries) and "Add blank".
- **Skills**: a sortable list of `{ group, items }`.
- **Education**: a sortable list of `{ degree, school, years }`.

`labelIssue` learns the resume paths: "Resume › Roles › PrimeTek › Bullet 2: is required".

### 4.2 Bio editor

The Bio editor gains two checkboxes above the lead: **Open to work** and **Book a call on home**. The second is disabled, with the note "Booking isn't set up", while `bookingEnabled()` is false. They save and publish with the rest of the `profile` document.

### 4.3 Admin home

`resume` joins the documents list and the drafts summary, as "Resume".

## 5. Testing

- **Unit (vitest):**
  - the resume zod schema, and the type pin;
  - the `validateSite` resume rules (1.3), including an Experience publish that would remove an org the resume uses;
  - `lib/resume/view.ts`: the join with Experience, order, orgs without a role, and products;
  - the profile fallback for missing `available` / `bookOnHome`;
  - the booking config shape and `bookingEnabled()`;
  - the email obfuscation markup;
  - `labelIssue` for resume paths;
  - `NavItem.inHeader` filtering.
- **e2e (`npm run e2e`):**
  - `/resume/` renders every section of the repo draft, the product links resolve, and there is no header nav.
  - `/resume.pdf` returns 200 `application/pdf`, the body starts with `%PDF`, the page count is 1 or 2 (count `/Type /Page` objects), and there is no trailing-slash redirect.
  - The home Experience row has "Resume →", and the identity row has "Book a call →" as a link (not a button).
  - `/book/`:
    - the three rows render;
    - `#project` selects that row;
    - the stubbed cal.com script is requested only after the first choice (`page.route` on `app.cal.com`);
    - the fallback link is present when the script is blocked, and with JavaScript disabled the rows link to cal.com;
    - Back after choosing leaves the page.
  - With booking disabled (fixture config), `/book/` 404s and both Book a call links are gone.
- **e2e:admin:**
  - editing a bullet and publishing shows on `/resume/`, and `/resume.pdf` changes (the size or the text differs);
  - turning off Open to work removes it from the home;
  - turning off Book a call on home removes the home link but keeps the resume header link.
- **Visual (controller):** `npm run screenshots` at 1440 and 390 for `/resume/` and `/book/` (with a type open, using the real embed against Onur's account once Task 1 is done), and a rendered page of the PDF. Check that the embed in the 480px column reads well, and that the PDF fits one page.

## 6. Setup (Onur, Task 1)

1. In cal.com, create three event types: slugs `role`, `project` and `mentoring`, at 30, 30 and 20 minutes (or tell me other values). Send the cal.com username.
2. Send a work email address and the LinkedIn handle for the resume.
3. Optional: the Bilkent years.
4. After the sprint: rewrite the resume copy in `/admin/resume/` and publish.

## 7. Out of scope

- Header nav (`/lab/` page, Notes): later sprints.
- A cal.com webhook into the admin, or listing bookings in the admin.
- Awards and recognition on the resume.
- Phone number, photo or QR code on the resume.
- PDF variants (Letter size, other languages): English A4 only.
- Admin editing of the booking config (titles, durations, visibility).

## Errata (planning)

- §3.1: there is no sitemap in v2, so "in the sitemap" does not apply; the page is indexable.
- §3.2: the PDF route uses Next's own cache headers for a prerendered route (there is no proxy setting `Cache-Control` in v2). The fonts are WOFF (the IBM Plex npm packages ship no TTF), which `@react-pdf/renderer` reads fine.
- §1.3: a published resume that breaks the rules fails soft per item (a role for an org not in Experience is left out, a project link to a missing page renders without the link), the same as Experience, rather than falling back to the whole repo resume. Required fields are non-empty (`min(1)`), as everywhere else in the overlay.
- §3.1: the email is passed to the client base64-encoded and rendered in pieces; a plain prop would put the address into the RSC payload of the static HTML.
- §5: the "booking disabled" e2e runs only while `calUsername` is empty (`test.skip`), and the "booking enabled" e2e only while it is set; a unit test covers the picker's server HTML with an explicit config.
- §1.3 / §4.1 (execution): a resume role only uses its org when it has at least one bullet. `validateSite` flags "‹Org› is not in Experience" only then, and the view ignores an empty orphan role. To drop an org from Experience, clear its bullets on the resume and publish that first.
- §4.1 (execution): when the editor aligns the stored roles to the live Experience, it opens with that change as an unsaved edit (`DocEditorInit.dirty`), so Save draft / Publish write what the editor shows.
- §3.2 (execution): the repo resume renders to one A4 page.
