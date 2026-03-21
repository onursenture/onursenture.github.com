# Photo Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a photo section to the homepage with a masonry grid widget and dedicated detail pages per photo, using markdown files for content management.

**Architecture:** Photos are markdown files in `src/photos/` with frontmatter (title, date, image, optional camera). Eleventy auto-creates a `photos` collection via the `tags` field in directory data. Images live at `images/photos/` (project root) and are passthrough-copied by the existing rule. A new layout template renders detail pages, a new widget template renders the homepage grid.

**Tech Stack:** Eleventy 3 (Nunjucks), SCSS (BEM), CSS columns masonry with `grid-template-rows: masonry` progressive enhancement.

**Spec:** `docs/superpowers/specs/2026-03-21-photo-section-design.md`

---

### Task 1: Create photo directory data and sample photo

**Files:**
- Create: `src/photos/photos.json`
- Create: `src/photos/sample-photo.md`
- Create: `images/photos/` directory (with `.gitkeep`)

- [ ] **Step 1: Create the images/photos directory**

```bash
mkdir -p images/photos
touch images/photos/.gitkeep
```

- [ ] **Step 2: Create directory data file**

Create `src/photos/photos.json`:

```json
{
  "layout": "photo.njk",
  "tags": "photos",
  "permalink": "/photos/{{ page.fileSlug }}/"
}
```

This tells Eleventy: use `photo.njk` layout for all markdown files in this directory, tag them as `photos` (creating `collections.photos`), and generate URLs at `/photos/[slug]/`.

- [ ] **Step 3: Create a sample photo markdown file**

Create `src/photos/sample-photo.md`:

```markdown
---
title: Sample Photo
date: 2026-03-21
image: sample.jpg
camera: Test Camera
---

This is a sample photo for testing the photo section layout and functionality.
```

Note: We don't need a real image yet. The templates will reference it, and we'll verify the build works. A placeholder image can be added to `images/photos/sample.jpg` later for visual testing.

- [ ] **Step 4: Verify Eleventy picks up the collection**

Skip verification here — the `photo.njk` layout doesn't exist yet, so Eleventy will error. We'll verify after Task 2.

- [ ] **Step 5: Commit**

```bash
git add src/photos/photos.json src/photos/sample-photo.md images/photos/.gitkeep
git commit -m "Add photo collection directory data and sample photo"
```

---

### Task 2: Create the photo detail page layout

**Files:**
- Create: `src/_layouts/photo.njk`

Reference files for patterns:
- `src/_layouts/post.njk` — existing detail page layout (article pattern)
- `src/_layouts/page.njk` — parent layout
- `src/_includes/header.njk` — bio header

- [ ] **Step 1: Create the photo layout template**

Create `src/_layouts/photo.njk`:

```nunjucks
---
layout: page.njk
---
<article class="c-photo">
    <img class="c-photo__image" src="/images/photos/{{ image }}" alt="{{ title }}" loading="lazy">
    <div class="c-photo__meta">
        <div class="c-photo__meta-left">
            <h1 class="c-photo__title">{{ title }}</h1>
            <time class="c-photo__date" datetime="{{ date | dateDisplay('iso') }}">{{ date | dateDisplay }}</time>
        </div>
        {% if camera %}
        <div class="c-photo__meta-right">
            <p class="c-photo__camera">Camera: <strong>{{ camera }}</strong></p>
        </div>
        {% endif %}
    </div>
    {% if content | trim %}
    <div class="c-photo__body">
        {{ content | safe }}
    </div>
    {% endif %}
    {# Nunjucks 3.x: set inside for propagates to outer scope #}
    {% set allPhotos = collections.photos %}
    {% set currentIndex = -1 %}
    {% for photo in allPhotos %}
        {% if photo.url == page.url %}
            {% set currentIndex = loop.index0 %}
        {% endif %}
    {% endfor %}
    <nav class="c-photo__nav">
        {% if currentIndex > 0 %}
            <a href="{{ allPhotos[currentIndex - 1].url }}">← Previous</a>
        {% else %}
            <span></span>
        {% endif %}
        <a href="/#photos">All Photos</a>
        {% if currentIndex < allPhotos.length - 1 %}
            <a href="{{ allPhotos[currentIndex + 1].url }}">Next →</a>
        {% else %}
            <span></span>
        {% endif %}
    </nav>
</article>
```

Note: `collections.photos` is sorted ascending by date (Eleventy default). Previous/Next follow chronological order. The homepage widget will use `| reverse` to show newest first.

- [ ] **Step 2: Verify the build succeeds**

Run: `npx @11ty/eleventy --dryrun 2>&1 | grep photos`

Expected: Should show `/photos/sample-photo/` being generated with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/_layouts/photo.njk
git commit -m "Add photo detail page layout template"
```

---

### Task 3: Create the homepage widget

**Files:**
- Create: `src/_includes/widgets/photos.njk`
- Modify: `src/pages/index.njk`

Reference files for patterns:
- `src/_includes/widgets/lab.njk` — conditional rendering pattern
- `src/_includes/widgets/letterboxd.njk` — image grid pattern

- [ ] **Step 1: Create the photos widget template**

Create `src/_includes/widgets/photos.njk`:

```nunjucks
{% set photos = collections.photos | reverse %}
{% if photos.length > 0 %}
<section class="c-widget" id="photos">
    <h2 class="c-widget__header">
        Photos
    </h2>
    <div class="c-photos__grid">
        {% for photo in photos %}
        <a href="{{ photo.url }}" class="c-photos__item">
            <img class="c-photos__image" src="/images/photos/{{ photo.data.image }}" alt="{{ photo.data.title }}" loading="lazy">
        </a>
        {% endfor %}
    </div>
</section>
{% endif %}
```

Key details:
- `| reverse` shows newest first (Eleventy tag collections are ascending by default)
- `id="photos"` enables the `/#photos` anchor link from detail page nav
- Entire section hidden when no photos exist (matching lab widget pattern)

- [ ] **Step 2: Add widget to homepage**

Modify `src/pages/index.njk` — add the photos widget include after the lab widget:

Current file ends with:
```nunjucks
{% include "widgets/lab.njk" %}
```

Add after that line:
```nunjucks
{% include "widgets/photos.njk" %}
```

The full modified section should read:
```nunjucks
{% include "widgets/lab.njk" %}
{% include "widgets/photos.njk" %}
```

- [ ] **Step 3: Verify the build succeeds**

Run: `npx @11ty/eleventy --dryrun 2>&1 | grep -E "(photos|error)" -i`

Expected: Should show the homepage and `/photos/sample-photo/` being generated with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/_includes/widgets/photos.njk src/pages/index.njk
git commit -m "Add photos widget to homepage after lab section"
```

---

### Task 4: Create the photo section styles

**Files:**
- Create: `src/css/components/_photos.scss`
- Modify: `src/css/main.scss`

Reference files for patterns:
- `src/css/components/_movies.scss` — hover transitions, image sizing
- `src/css/components/_widgets.scss` — shared widget styles
- `src/css/components/_article.scss` — detail page styling
- `src/css/helpers/_variables.scss` — theme colors, breakpoints
- `src/css/helpers/_mixins.scss` — font sizing mixins

- [ ] **Step 1: Create the photo styles**

Create `src/css/components/_photos.scss`:

```scss
/* ==========================================================================
   Photos
   ========================================================================== */

// Homepage masonry grid (c-photos)

.c-photos__grid {
    columns: 2;
    column-gap: 1.2rem;

    @media screen and (min-width: $bp__sm) {
        columns: 3;
    }

    @supports (grid-template-rows: masonry) {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: masonry;
        gap: 1.2rem;

        @media screen and (min-width: $bp__sm) {
            grid-template-columns: repeat(3, 1fr);
        }
    }
}

.c-photos__item {
    display: block;
    break-inside: avoid;
    margin-bottom: 1.2rem;
    overflow: hidden;
    border-radius: 0.3rem;

    @supports (grid-template-rows: masonry) {
        margin-bottom: 0;
    }

    &:hover .c-photos__image,
    &:active .c-photos__image {
        transform: scale(1.03);
    }
}

.c-photos__image {
    display: block;
    width: 100%;
    height: auto;
    transition: transform 0.3s ease;
}

// Detail page (c-photo)

.c-photo {
    margin-bottom: 6rem;
}

.c-photo__image {
    display: block;
    width: 100%;
    height: auto;
    margin-bottom: 3rem;
}

.c-photo__meta {
    margin-bottom: 2.4rem;

    @media screen and (min-width: $bp__sm) {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
    }
}

.c-photo__title {
    @include fs--heading-2;
    color: $c-base__02;
    margin-bottom: 0.4rem;
}

.c-photo__date {
    @include fs--caption;
    color: $c-base__01;
}

.c-photo__camera {
    @include fs--caption;
    color: $c-base__01;
    margin-top: 0.8rem;

    @media screen and (min-width: $bp__sm) {
        margin-top: 0;
        text-align: right;
    }

    strong {
        color: $c-base__02;
    }
}

.c-photo__body {
    padding-top: 2.4rem;
    border-top: $m-border;
    @include fs--body;
    color: $c-base__01;

    > * {
        margin-bottom: 1.8rem;
    }
}

.c-photo__nav {
    margin-top: 3.2rem;
    padding-top: 1.6rem;
    border-top: $m-border;
    display: flex;
    justify-content: space-between;
    @include fs--caption;

    a {
        color: $c-accent__blue;
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }
    }

    span {
        // Empty placeholder for flex spacing when prev/next doesn't exist
    }
}
```

- [ ] **Step 2: Import the new styles in main.scss**

Modify `src/css/main.scss` — add `'components/photos'` to the Components import block.

Current Components block:
```scss
// Components
@import
    'components/page',
    'components/article',
    'components/tag',
    'components/archives',
    'components/widgets',
    'components/github',
    'components/books',
    'components/movies';
```

Change to:
```scss
// Components
@import
    'components/page',
    'components/article',
    'components/tag',
    'components/archives',
    'components/widgets',
    'components/github',
    'components/books',
    'components/movies',
    'components/photos';
```

- [ ] **Step 3: Verify SCSS compiles**

Run: `npx sass src/css/main.scss:/dev/null --style=compressed --load-path=src/css --no-source-map 2>&1`

Expected: No errors. Clean compilation.

- [ ] **Step 4: Commit**

```bash
git add src/css/components/_photos.scss src/css/main.scss
git commit -m "Add photo section styles with masonry grid and detail page"
```

---

### Task 5: Full build verification and visual test

**Files:**
- Possibly modify: any file from previous tasks if issues are found

- [ ] **Step 1: Add a placeholder test image**

Download or create a simple placeholder image for visual testing:

This step is optional — the build works without a real image file (the browser will show a broken image icon). If a real test image is available, copy it to `images/photos/sample.jpg` for visual verification.

- [ ] **Step 2: Run full build**

Run: `npm run build 2>&1`

Expected: Build completes successfully. `_site/photos/sample-photo/index.html` should exist. `_site/images/photos/` directory should exist.

- [ ] **Step 3: Verify generated HTML**

Run: `cat _site/photos/sample-photo/index.html | head -40`

Expected: Should contain:
- `<img class="c-photo__image" src="/images/photos/sample.jpg"`
- `<h1 class="c-photo__title">Sample Photo</h1>`
- `<nav class="c-photo__nav">`
- The body text about sample photo

Run: `grep -o 'c-photos__grid' _site/index.html`

Expected: Should find `c-photos__grid` in the homepage HTML, confirming the widget is rendered.

- [ ] **Step 4: Start dev server for visual verification**

Run: `npm run dev`

Open `http://localhost:8080` in browser and verify:
- Photos section appears after Lab on homepage
- Masonry grid renders (even with just one photo)
- Clicking the photo goes to `/photos/sample-photo/`
- Detail page shows image, title, date, camera, body text
- Navigation shows "All Photos" link (no prev/next since only one photo)
- CSS is applied correctly — spacing, typography, responsive layout

- [ ] **Step 5: Remove sample photo and commit**

Once verified, remove the sample content (or keep it as a template for the user):

```bash
# If removing:
git rm src/photos/sample-photo.md images/photos/sample.jpg 2>/dev/null; git rm images/photos/.gitkeep 2>/dev/null
git commit -m "Remove sample photo content after verification"

# If keeping as example:
git add src/photos/sample-photo.md images/photos/
git commit -m "Verify photo section build with sample content"
```

---

### Task 6: Add real photos (user-driven)

This task is for the user to populate the section with real content. No code changes needed.

- [ ] **Step 1: Add photo images**

Place `.jpg` (or `.png`, `.webp`) files in `images/photos/`.

- [ ] **Step 2: Create markdown files**

For each photo, create a `.md` file in `src/photos/`:

```markdown
---
title: Your Photo Title
date: 2026-03-21
image: your-photo-filename.jpg
camera: Your Camera Model
---

Optional story or description.
```

- [ ] **Step 3: Build and verify**

Run: `npm run build && npm run dev`

Verify the masonry grid displays multiple photos with varying aspect ratios, and each detail page works correctly with prev/next navigation.
