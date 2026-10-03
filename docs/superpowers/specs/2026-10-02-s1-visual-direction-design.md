# S1 Visual Direction — Design Spec

## Overview

This spec sets the visual language for onursenture.com v2 in both view modes. It builds on the foundation spec (`2026-10-02-site-v2-foundation-design.md`), which fixed the mechanics: the `site` and `dashboard` views, light and dark themes, and an admin layer on top of the dashboard. Here we fix how all of that looks. S3 implements these decisions as design tokens and primitives. A Figma style tile is the visual reference.

The direction is a hybrid:
- **Site mode** is a "Swiss index": typography-led and editorial, on a grid, with years and eras made visible.
- **Dashboard mode** is a "product surface": an application shell with dense panels and tables.

They are not two designs. They are one token system read at two densities. For a design-system designer, "same system, two densities" is itself part of the message.

## Decisions

| Topic | Decision |
|---|---|
| Direction | Hybrid. Site = Swiss index (refs: Aino, Locomotive, A24, Nite Riot, Collins). Dashboard = product surface (refs: Linear, Tailscale case study, StackAI, Exa, Dub changelog). |
| Typography | **One Swiss neo-grotesk family:** **Neue Haas Grotesk Display** for headlines and **Neue Haas Grotesk Text** for body and UI, both via Adobe Fonts. **Fragment Mono** (a Helvetica-derived mono) for metadata, tables and numbers. Editorial drama comes from scale contrast (huge display against tiny labels), not from a second typeface. *Revised 2026-10-02: the first pass, Instrument Serif + Geist, was rejected because those faces now read as AI/startup defaults.* |
| Color | **Pure monochrome**, with no brand accent. |
| Status color | Color is used **only for functional warnings**. `danger` (red) appears when something is broken: a failed sync, or a failed admin action. Everything else is expressed with glyphs. |
| Icons | **No icon set.** Typographic glyphs only. |
| Dashboard shell | **Application shell:** sidebar navigation plus a panel grid. The site uses a top bar. |

## Tokens

### Color

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-bg` | `#FFFFFF` | `#000000` | Page background |
| `--color-surface` | `#FAFAFA` | `#0A0A0A` | Dashboard panels, sidebar |
| `--color-fg` | `#000000` | `#F2F2F2` | Primary text, inverted fills |
| `--color-fg-muted` | `#737373` | `#8A8A8A` | Secondary text, metadata |
| `--color-line` | `#E5E5E5` | `#262626` | 1px rules and borders |
| `--color-line-strong` | `#D4D4D4` | `#404040` | Control borders, emphasized dividers |
| `--color-danger` | `#D92D20` | `#F97066` | Errors only |
| `--color-danger-bg` | `#FEF3F2` | `#2A0F0C` | Background of an error chip |

Inversion is the emphasis device: `fg` on `bg` becomes `bg` on `fg`. Active navigation, the selected state, and "live" chips all use it.

### Type

| Token | Family | Sizes (px) | Notes |
|---|---|---|---|
| `--font-display` | Neue Haas Grotesk Display (`neue-haas-grotesk-display`; 500 Medium, 400 Roman) | 40 / 64 / 96 / 160 (fluid `clamp`) | Headlines, the home statement, case-study openers. Mostly site mode; the dashboard uses it only for page titles. |
| `--font-sans` | Neue Haas Grotesk Text (`neue-haas-grotesk-text`; 400 Roman, 500 Medium) | 13 / 14 / 16 / 20 / 28 | Body, UI, small headings |
| `--font-mono` | Fragment Mono (400) | 11 / 12 / 13 | Years, roles, companies, table cells, all numbers, era stamps, uppercase labels |

- All numerals use `font-variant-numeric: tabular-nums`.
- Site body text is 16–17px with line-height 1.6.
- Dashboard body text is 13–14px with line-height 1.4.
- Display tracking tightens with size: −0.02em at 40, −0.03em at 64, −0.035em at 96 and above. Display line-height is 0.92–1.0.
- Uppercase mono labels use +0.02em tracking.
- **Adobe Fonts kit:** project "onursenture.com", ID `jgu1ygn` (`https://use.typekit.net/jgu1ygn.css`). It contains Display 55 Roman and 65 Medium, plus Text 55 Roman, 56 Italic and 65 Medium. **Adobe's CSS weights for Display are shifted:**
  - `neue-haas-grotesk-display` 55 Roman = `font-weight: 500`, and 65 Medium = `600`.
  - `neue-haas-grotesk-text` 55 Roman = `400`, 56 Italic = `400 italic`, and 65 Medium = `500`.

  So display headlines use `font-weight: 600`.
- **Loading:** Neue Haas Grotesk comes from an Adobe Fonts web project (the `use.typekit.net/<kit>.css` stylesheet, `font-display: swap`). Its domains must include `onursenture.com`, the Vercel preview domain and `localhost`. Fragment Mono loads through `next/font/google`. Fallback stack: `"Helvetica Neue", Helvetica, Arial, sans-serif`.
- **Dependency note:** Adobe Fonts is tied to Onur's Creative Cloud subscription. If the subscription lapses, the site falls back to the Helvetica stack. That is an accepted risk, chosen over a paid self-hosted license.
- **Faces to avoid** in all future work, because they now signal AI/startup templates:
  - Inter, Geist, Instrument Serif/Sans
  - Söhne, Tiempos, Styrene
  - Space Grotesk, DM Sans, Manrope, Satoshi, Fraunces
  - PP Neue Montreal, PP Editorial New
  - JetBrains Mono

### Space, shape, grid

- **Spacing scale (4px base):** 4, 8, 12, 16, 24, 32, 48, 64, 96, 128. Site sections sit 64–128 apart. Dashboard gaps are 8–24.
- **Shape:** no shadows anywhere. Structure comes from 1px rules (`--color-line`). Corner radius is **0** everywhere except form controls (buttons, inputs, toggles), which take **4px** to signal they are interactive. Images are square-cornered and unframed.
- **Site grid:** 12 columns, max width 1200px, 24px gutters. Long-form text sits in a ~680px measure.
- **Dashboard grid:** full width. A 240px sidebar, then panels on a 12-column grid with 16px gutters.

### Glyphs

| Glyph | Meaning |
|---|---|
| `→` | Link, internal or external; call to action |
| `●` | Active, live, synced |
| `○` | Empty, inactive |
| `◐` | Late or partial (e.g. sync overdue) |
| `×` | Close, remove |

Hovered links are underlined. The active navigation item is inverted.

## Shells

- **Site:** a top bar with the name on the left, then **Work · Lab · Resume · Notes · Life**, then "Book a call" and the two toggles (theme, view). The content sits in the 12-column grid below.
- **Dashboard:** a 240px sidebar holding the same navigation as a vertical list, with the toggles at the bottom. A slim top bar carries the page title and context, such as the source sync line. Content is laid out as a panel grid. When Onur is signed in, an admin section (Compose, Drafts, Sources) appears in the sidebar below the navigation. Its contents are defined in S7.
- **Mobile:** on the site, the top bar collapses to the name plus a "Menu" text button. In the dashboard, the sidebar becomes a top bar with "Menu", which opens a slide-over containing the same list. Panels stack into one column.

## Motion

There are only two moments of motion:
1. **View switch:** the whole page cross-fades from one shell to the other. 250ms, ease-out. *Revised 2026-10-03: the first pass also morphed the top-bar nav into the sidebar nav. The two navs differ in shape, so the morph stretched the nav snapshot while the rest of the page swapped instantly. The morph was dropped.*
2. **The paddle-spin easter egg:** S9, footer by default.

Theme switches are instant. Hover feedback is the only other motion, with no transforms. With `prefers-reduced-motion`, the view switch also becomes instant.

## Era stamp

A monospace stamp shown next to older work. It places the project in its time, for example `2013 · iOS 6 · pre-flat`. It is a system element (Fragment Mono 11–12, muted, optionally preceded by `●`). This spec only defines the element. S4 decides what each stamp says, and how the portfolio narrative uses stamps to show that work was ahead of its time.

## Deliverable: Figma style tile

A Figma file in Onur's account contains:
1. **Variables:** the color tokens above as a variable collection with Light and Dark modes. Spacing and radius are number variables.
2. **Text styles:** the type tokens above.
3. **Specimen frame:** the three families at their sizes, the glyph table, and the status rows (synced / late / error).
4. **Mode comparison:** the same small slice of content (a work index of three projects plus a sync-status block) as a site-mode frame and a dashboard-mode frame, each in light and dark (four frames).
5. **Shell sketch:** the site top bar and the dashboard sidebar shell at desktop width, plus both at mobile width.

The style tile is a reference, not a page design. S3 implements from this spec. If the spec and the tile disagree, the spec wins until it is updated.

**File:** https://www.figma.com/design/GJAOUY4DJdPgvPgfNZRsst. Rebuilt with the revised typography. It holds variables with web code names (`var(--color-bg)` and so on), 19 text styles, and local components (chip, era-stamp, nav-item, button, toggle, status-row, work-row).

### Notes from building the tile (binding for S3)

- **Error glyph:** an error status uses `●` in `--color-danger`. `×` stays reserved for the close/remove action.
- **Era stamp inside the work index:** omit the year when a year column already shows it. Elsewhere use the full `2013 · iOS 6 · pre-flat` form.
- **Line-heights the spec left open:**
  - display: 0.95 (revised with Neue Haas Grotesk; the first Instrument Serif tile used 1.05)
  - sans 20: 1.3
  - sans 28: 1.2
  - mono: 1.4
- **Glyph coverage:**
  - Neue Haas Grotesk has no `↗`; it falls back to an emoji. `↗` is therefore dropped, and external links use `→` too.
  - `● ○ ◐` render at matching size in Neue Haas Grotesk Text, so set status glyphs there.

## Out of scope

- Page layouts beyond the shells (S3 onward).
- Case-study templates and the content of era stamps (S4).
- Admin UI details (S7).
- Instapaper card and theatre log designs (S8).
- The paddle-spin effect (S9).
