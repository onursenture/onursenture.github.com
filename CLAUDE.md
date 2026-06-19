# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal website for Onur Senture ([onursenture.com](https://onursenture.com)) built with [Eleventy](https://www.11ty.dev/) (11ty v3) and deployed to GitHub Pages via GitHub Actions on every push to `master` and on a 6-hour cron (the schedule exists to refresh external data feeds, not because content changes).

## Commands

```bash
npm run dev        # Eleventy --serve with live reload (Sass is rebuilt by the eleventy.before hook)
npm run build      # Production build: 11ty then standalone Sass compile to _site/css/main.css
npm run build:css  # Sass only (compressed)
npm run dev:css    # Sass watch mode (rarely needed — `npm run dev` covers normal work)
```

There are no tests or linters.

## Architecture

### Eleventy config (`.eleventy.js`)
- `src/` is input, `_site/` is output. Template engines: Nunjucks (`.njk`) and Markdown (rendered through Nunjucks).
- A pre-build hook compiles `src/css/main.scss` → `_site/css/main.css` so the dev server picks up SCSS changes without a separate watcher.
- Pass-through copies: `images/`, `CNAME`, `favicon.ico`, `keybase.txt` (all root-level, not under `src/`).
- Custom filters live here: `dateDisplay` (also supports `"rfc822"` and `"iso"` for the RSS feed), `timeAgo`, `truncate`, `xmlEscape` (for the XML feed only — `.njk` HTML output is already autoescaped by Nunjucks, so do **not** add `xmlEscape` there or values double-escape).
- One collection: `posts`, sourced from `src/posts/**/*.md`, reversed (newest first).

### Data layer (`src/_data/*.js`)
This is the most important file to understand. Each `.js` file becomes a global available in templates by filename. They run at build time and fetch from external services — this is why the GitHub Actions cron rebuilds every 6 hours.

| File | Source | Notes |
|---|---|---|
| `site.json` | static | Site metadata; `social.*` drives footer links |
| `build.js` | static | `build.hash` for cache-busting `main.css` query string in `head.njk` |
| `github.js` | GitHub GraphQL | Needs `GH_PAT` / `GITHUB_PAT` env var (set as a secret in CI); returns empty silently if missing. Maps the 5 known GitHub contribution colors to levels 0–4 |
| `letterboxd.js` | `letterboxd.com/onur/rss/` via rss-parser + cheerio | Last 6 films |
| `goodreads.js` | Goodreads RSS | Needs a numeric user ID — discovered by scraping the profile page unless `GOODREADS_USER_ID` is set. Returns `{ currentlyReading, read }` |
| `instapaper.js` | `instapaper.com/p/w00f` (scraped HTML) | Last 15 articles |
| `writing.js` | `w00f.org/feed/` (Bear Blog) | Last 10 posts |
| `lab.js` | `lab.onursenture.com/api/projects` | Sibling site's JSON API |

Every external fetcher swallows errors with `console.warn` and returns an empty fallback so a flaky upstream never breaks the build. Preserve this behavior when adding new sources.

### Templates
- Layouts: `base.njk` (html shell) → `page.njk` (adds header/footer wrappers) → `post.njk` / `photo.njk` for content types. The home page (`src/pages/index.njk`) uses `page.njk` directly and assembles widgets.
- Widgets in `src/_includes/widgets/` are partials that render each external data source. The home page is essentially a list of widget includes.
- RSS feed is `src/pages/feed.njk` with `permalink: /feed.xml`.

### Photos
Each photo is a markdown file in `src/photos/` with frontmatter (`title`, `date`, `image`, `camera`). `photos.11tydata.js` in that folder applies `layout: photo.njk`, `tags: photos`, and `permalink: /photos/{{ page.fileSlug }}/` to all files, and via `eleventyComputed` derives two social-sharing fields per photo: `socialImage` (absolute JPEG URL) and `socialImageDimensions` (`{ width, height }`, read at build time from `images/photos/` with the `image-size` package, failing soft to `null`). The image file itself lives in `images/photos/<filename>`.

Photos are served via `<picture>` in three templates (`_layouts/photo.njk`, `pages/photos.njk`, `_includes/widgets/photos.njk`) — an AVIF `<source>` plus the JPEG as `<img>` fallback. The AVIF path is derived inline via `image | replace('.jpeg', '.avif')`, so the frontmatter still only names the JPEG.

**Adding a photo** — produce two files (`<slug>.jpeg` and `<slug>.avif`) in `images/photos/`, plus the `.md`. From an original (e.g. on Desktop):

```bash
SRC=/path/to/original.JPG
SLUG=my-photo
DEST=images/photos
TMP=/tmp/$SLUG.tmp.jpg

# Resize to 2560 wide max, high-quality JPEG intermediate
sips -Z 2560 -s formatOptions 100 "$SRC" --out "$TMP" >/dev/null

# AVIF: q60, 4:2:0
/opt/homebrew/bin/avifenc -q 60 -y 420 "$TMP" "$DEST/$SLUG.avif"

# mozjpeg: q82, progressive (decode via djpeg → re-encode via cjpeg)
/opt/homebrew/opt/mozjpeg/bin/djpeg "$TMP" | \
  /opt/homebrew/opt/mozjpeg/bin/cjpeg -quality 82 -progressive -optimize > "$DEST/$SLUG.jpeg"

rm "$TMP"
```

Tools come from `brew install libavif mozjpeg`. If EXIF on the source was stripped (e.g. an already-exported "optimized" JPEG), read camera/date from the untouched original instead.

**Deleting a photo** — remove the `.md` in `src/photos/` and both the `.jpeg` and `.avif` in `images/photos/`.

### Social sharing metadata (Open Graph / Twitter Card)
`head.njk` emits per-page Open Graph and Twitter Card tags so pasted URLs render rich link previews. The block is generic: it reads `title` / `date` / `excerpt` from the page plus `socialImage` / `socialImageDimensions` (set only on photos by `photos.11tydata.js`). So photo pages get a `summary_large_image` card with the photo, its dimensions, and the title as the description; other pages get a text-only `summary`. Adding a photo needs no extra step — the tags are generated from its frontmatter.

Conventions to preserve:
- **The OG image is the JPEG, never the AVIF** — social crawlers (Facebook, X, LinkedIn, WhatsApp, iMessage, Slack) don't reliably render AVIF. Build image/URL values as absolute (`site.url` + path).
- **No default social image** — pages without a photo intentionally omit `og:image` / `twitter:image` and fall back to `twitter:card = summary`.
- See the `xmlEscape` note above: Nunjucks autoescapes these `.njk` tags, so the filter is not used here.
- After changing an *existing* photo's title or image, re-scrape via the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) to bust crawler caches (brand-new URLs fetch fresh on first share).

### CSS
Sass with the modern `@use`/`@forward` module system (migrated from `@import`). Entry point `src/css/main.scss` pulls in helpers, base, utilities, and components in order. Class naming follows a BEM-ish convention: `c-` for components (`c-page`, `c-archives`), `u-` for utilities (`u-container`, `u-seperate`), `has-`/modifiers via `--`. The cache-busting `?v={{ build.hash }}` on the stylesheet link comes from `src/_data/build.js`.

## Conventions

- Dates in frontmatter are written as `YYYY-MM-DD`. The `dateDisplay` filter formats them.
- External-data fetchers must fail soft (warn + return an empty shape). The widget partials assume the data may be empty.
- When removing content (a photo, a post), check both `src/` (markdown) and `images/` (asset) — they are paired but not collocated. For photos, the asset is a pair: `.jpeg` + `.avif`.
