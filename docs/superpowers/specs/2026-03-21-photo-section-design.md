# Photo Section — Design Spec

## Overview

Add a photo section to the homepage of onursenture.github.com. Photos are hosted in the repo as static images, managed via markdown files with frontmatter, and displayed as an Eleventy collection. The section consists of two parts: a masonry grid widget on the homepage and dedicated detail pages per photo.

## Requirements

- Mix of artistic photography and personal/life moments
- Collection grows over time — design must scale
- Flat stream, newest first, no categories or albums
- Each photo gets a dedicated detail page with optional rich metadata
- Metadata (title, date, camera, description) is optional except title, date, and image filename
- Homepage widget placed after the Lab section
- Use modern CSS (native masonry with fallback)
- No grayscale filter — photos shown in full color
- Consistent with existing site patterns (BEM naming, widget structure, responsive breakpoints)

## Photo Detail Page

URL pattern: `/photos/[slug]/`

Layout (top to bottom):
1. **Full-width photo** — displayed at natural aspect ratio, no crop
2. **Metadata row** — title + date on the left, camera info (optional) on the right
3. **Body text** (optional) — markdown content rendered below a separator
4. **Navigation** — Previous / All Photos / Next links. "All Photos" links back to the homepage photos section (`/#photos`).

Template: `src/_layouts/photo.njk` extending `page.njk` → `base.njk`

Images use `alt="{{ title }}"` for accessibility.

## Homepage Widget

Placement: after Lab widget, before Archives

Structure:
- Section header: "Photos" (matching `c-widget__header` pattern)
- Masonry grid of photo thumbnails
- Each thumbnail links to its detail page
- Full color display, subtle scale (1.03) on hover
- 3 columns on desktop (above 45rem), 2 columns on mobile
- All photos shown, no pagination. If the collection grows very large in the future, this can be revisited with a cap + dedicated index page.
- Image-only grid — no titles or metadata in the grid
- Images use `alt="{{ photo.data.title }}"` for accessibility
- Lazy loading via `loading="lazy"`
- When there are no photos, the entire section is hidden (matching lab widget pattern)

Template: `src/_includes/widgets/photos.njk`

## CSS Approach

New file: `src/css/components/_photos.scss`, imported in `main.scss`

Masonry implementation:
- **Base**: CSS `columns` property — works in all browsers
- **Progressive enhancement**: `@supports (grid-template-rows: masonry)` upgrades to native CSS masonry in supporting browsers
- Responsive: 3 columns above `$bp__sm` (45rem), 2 columns below

Two BEM blocks: `c-photos` (grid widget on homepage) and `c-photo` (detail page). This is intentional — they are separate components.

BEM class names:
- `c-photos__grid` — masonry container
- `c-photos__item` — individual photo link in the grid
- `c-photos__image` — image element in the grid
- `c-photo__image` — full-width image on detail page
- `c-photo__meta` — metadata row on detail page
- `c-photo__body` — optional description on detail page
- `c-photo__nav` — previous/next navigation on detail page

Hover: `transition: transform 0.3s ease` matching the existing movies widget pattern.

## File Structure

### New files

| File | Purpose |
|------|---------|
| `src/photos/photos.json` | Directory data: layout, tags, permalink pattern |
| `src/_layouts/photo.njk` | Detail page layout template |
| `src/_includes/widgets/photos.njk` | Homepage masonry grid widget |
| `src/css/components/_photos.scss` | All photo section styles |
| `images/photos/` | Directory for photo image files (project root, alongside existing `images/`) |

### Modified files

| File | Change |
|------|--------|
| `src/pages/index.njk` | Add `{% include "widgets/photos.njk" %}` after lab widget |
| `src/css/main.scss` | Add `@import 'components/photos'` |

Note: `.eleventy.js` does **not** need modification. The existing passthrough rule `{ "images": "images" }` already covers `images/photos/`. The photos collection is created automatically by Eleventy via the `tags: "photos"` in the directory data file.

## Data Model

Each photo is a markdown file in `src/photos/` with this frontmatter:

```yaml
---
title: Along the Canal          # required
date: 2026-03-15                # required
image: along-the-canal.jpg      # required — filename in images/photos/
camera: Fujifilm X100V          # optional
---

Optional body text with the story behind the photo.
```

The `photos.json` directory data file applies shared defaults:

```json
{
  "layout": "photo.njk",
  "tags": "photos",
  "permalink": "/photos/{{ page.fileSlug }}/"
}
```

The tag-based collection (`collections.photos`) is sorted by date ascending by default. The homepage widget and detail page navigation iterate with `| reverse` to show newest first.

## Adding a New Photo

1. Place the image file in `images/photos/` (project root)
2. Create a markdown file in `src/photos/` with frontmatter (title, date, image)
3. Optionally add camera info and body text
4. The photo appears on the homepage and gets its own detail page on next build

## Image Handling

- Images hosted directly in the repo (no external service)
- Stored at `images/photos/` (project root), passthrough copied to `_site/images/photos/` via existing rule
- No build-time image processing (resize, optimize) in initial implementation
- `loading="lazy"` for homepage grid performance
- Full-size images served on detail pages

## Hover Behavior

- Homepage grid: subtle scale transform (1.03) with `transition: transform 0.3s ease`
- No grayscale filter — photos always in full color
- Consistent with existing site hover patterns but distinct from Letterboxd's grayscale treatment
