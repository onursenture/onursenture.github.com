import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ArchiveLog } from "@/components/work/archive-log";
import { CreditLine } from "@/components/work/credit-line";
import { GridView } from "@/components/work/grid-view";
import { IndexView } from "@/components/work/index-view";
import { LogView } from "@/components/work/log-view";
import { MediaFigure } from "@/components/work/media-figure";
import { PostsView } from "@/components/work/posts-view";
import { StudyBody } from "@/components/work/study-body";
import { ViewBar } from "@/components/work/view-bar";
import type { CaseStudy } from "@/content/work/types";
import { buildArchiveView, buildStudyView } from "@/lib/work/derive";
import { DEFAULT_VIEW_STATE } from "@/lib/work/url-state";

const html = renderToStaticMarkup;

const study: CaseStudy = {
  slug: "primeone",
  org: "primetek",
  title: "PrimeOne",
  kind: "design system",
  years: "2023–2026",
  lead: { strong: "PrimeOne.", rest: "A kit." },
  intro: [],
  facts: [],
  links: [],
  hero: { id: "cover", caption: "Cover" },
  entries: [
    {
      id: "3-0",
      date: "2024-11",
      version: "3.0",
      note: "Rebuilt.",
      source: "https://x.com/w00f/status/1",
      credits: [{ name: "Ada", href: "https://ada.example" }],
      media: [
        { id: "overview", caption: "Overview" },
        { id: "tokens", caption: "Tokens" },
      ],
    },
    { id: "4-0", date: "2026-01", version: "4.0", note: "Variables.", media: [] },
  ],
};
const view = buildStudyView(study, (key) => (key === "work/primeone/cover" ? { width: 1600, height: 1000, widths: [640, 1280, 1600] } : undefined));

describe("MediaFigure", () => {
  it("renders the image when one exists", () => {
    const markup = html(<MediaFigure media={view.hero} sizes="100vw" />);
    expect(markup).toContain("/images/work/primeone/cover-1600.jpg");
    expect(markup).toContain('alt="Cover"');
  });

  it("renders a labelled placeholder otherwise, and drops the label when bare", () => {
    const placeholder = view.media.find((m) => m.id === "tokens")!;
    expect(html(<MediaFigure media={placeholder} sizes="100vw" />)).toContain("FIG. 02.2 · Tokens");
    expect(html(<MediaFigure media={placeholder} sizes="100vw" bare />)).not.toContain("FIG.");
  });
});

describe("CreditLine", () => {
  it("renders nothing without credits, and role-grouped linked names otherwise", () => {
    expect(html(<CreditLine credits={[]} />)).toBe("");
    const markup = html(<CreditLine credits={[{ name: "Ada", href: "https://ada.example" }, { name: "Bo", role: "implementation" }]} />);
    expect(markup).toContain("Design: ");
    expect(markup).toContain('href="https://ada.example"');
    expect(markup).toContain(" · Implementation: ");
    expect(markup).toContain("Bo");
  });
});

describe("LogView", () => {
  const markup = html(<LogView study={view} />);

  it("groups by year, newest first", () => {
    expect(markup.indexOf(">2026<")).toBeLessThan(markup.indexOf(">2024<"));
  });

  it("shows the heading with its month, the note, the credit and the source", () => {
    expect(markup).toContain("3.0");
    expect(markup).toContain("· Nov");
    expect(markup).toContain("Rebuilt.");
    expect(markup).toContain("Design: ");
    expect(markup).toContain('href="https://x.com/w00f/status/1"');
  });

  it("shows the first figure and a link to the rest", () => {
    expect(markup).toContain('data-media="overview"');
    expect(markup).not.toContain('data-media="tokens"');
    expect(markup).toContain("+1 in Grid →");
  });
});

describe("ViewBar", () => {
  it("presses the current view, and shows chips and density only where they apply", () => {
    const log = html(<ViewBar chips={view.chips} state={DEFAULT_VIEW_STATE} />);
    expect(log).toMatch(/aria-pressed="true"[^>]*>Log</);
    expect(log).not.toContain('aria-label="Filter"');
    expect(log).not.toContain('aria-label="Density"');
    const grid = html(<ViewBar chips={view.chips} state={{ ...DEFAULT_VIEW_STATE, view: "grid", tag: "3-0" }} />);
    expect(grid).toContain('aria-label="Filter"');
    expect(grid).toContain('aria-label="Density"');
    expect(grid).toMatch(/aria-pressed="true"[^>]*>3\.0 <span[^>]*>2<\/span>/);
    const index = html(<ViewBar chips={view.chips} state={{ ...DEFAULT_VIEW_STATE, view: "index" }} />);
    expect(index).toContain('aria-label="Filter"');
    expect(index).not.toContain('aria-label="Density"');
  });
});

describe("GridView and IndexView", () => {
  it("renders a file-like card per figure with caption and group", () => {
    const markup = html(<GridView media={view.media} density="2" />);
    expect(markup).toContain('data-density="2"');
    expect(markup.match(/data-media="/g)).toHaveLength(3);
    expect(markup).toContain("Tokens");
    expect(markup).toContain("3.0");
  });

  it("lists figures with their FIG number", () => {
    const markup = html(<IndexView media={view.media} />);
    expect(markup).toContain(">02.1<");
    expect(markup).toContain(">01<");
  });
});

describe("StudyBody", () => {
  it("renders the view the state asks for", () => {
    expect(html(<StudyBody study={view} state={DEFAULT_VIEW_STATE} />)).toContain('data-view="log"');
    expect(html(<StudyBody study={view} state={{ ...DEFAULT_VIEW_STATE, view: "grid" }} />)).toContain('data-view="grid"');
    expect(html(<StudyBody study={view} state={{ ...DEFAULT_VIEW_STATE, view: "index", tag: "3-0" }} />)).not.toContain(">01<");
  });
});

describe("Posts", () => {
  const withPosts = buildStudyView(
    {
      ...study,
      posts: [
        { date: "2024-11-07", account: "primereact", id: "100", summary: "Launch.", entryId: "3-0" },
        { date: "2026-01-19", account: "primevue", id: "200", summary: "Variables.", entryId: "4-0" },
      ],
    },
    () => undefined,
  );

  it("renders rows newest first, with the day, account, summary and an external post link", () => {
    const markup = html(<PostsView groups={withPosts.posts} />);
    expect(markup).toContain('data-view="posts"');
    expect(markup.indexOf(">2026<")).toBeLessThan(markup.indexOf(">2024<"));
    expect(markup).toContain('id="post-100"');
    expect(markup).toContain(">7 Nov<");
    expect(markup).toContain(">@primereact<");
    expect(markup).toContain("Launch.");
    expect(markup).toContain('href="https://x.com/primereact/status/100"');
    expect(markup).toContain("\u00a0\u2197");
    expect(markup).toContain('aria-label="Post on X, 7 Nov 2024, @primereact"');
  });

  it("renders an empty list when the filter leaves nothing", () => {
    expect(html(<PostsView groups={[]} />)).toContain('data-view="posts"');
  });

  it("shows Posts in the view bar only when asked, with post chips instead of media chips", () => {
    const state = { ...DEFAULT_VIEW_STATE, view: "posts" as const, tag: "3-0" };
    const bar = html(<ViewBar chips={withPosts.chips} postChips={withPosts.postChips} views={["log", "grid", "index", "posts"]} state={state} />);
    expect(bar).toMatch(/aria-pressed="true"[^>]*>Posts</);
    expect(bar).toContain('aria-label="Filter"');
    expect(bar).toMatch(/aria-pressed="true"[^>]*>3\.0 <span[^>]*>1<\/span>/);
    expect(bar).not.toContain("Tokens");
    expect(bar).not.toContain('aria-label="Density"');
    expect(html(<ViewBar chips={withPosts.chips} state={DEFAULT_VIEW_STATE} />)).not.toContain(">Posts<");
  });

  it("StudyBody renders the filtered Posts view, and no Posts button without posts", () => {
    const body = html(<StudyBody study={withPosts} state={{ ...DEFAULT_VIEW_STATE, view: "posts", tag: "4-0" }} />);
    expect(body).toContain('data-view="posts"');
    expect(body).toContain('id="post-200"');
    expect(body).not.toContain('id="post-100"');
    expect(body).toContain(">Posts<");
    expect(html(<StudyBody study={view} state={DEFAULT_VIEW_STATE} />)).not.toContain(">Posts<");
  });
});

describe("ArchiveLog", () => {
  const archive = buildArchiveView(
    [
      { id: "aura", org: "primetek", date: "2024-01", title: "Aura", note: "A theme.", source: "https://x.com/primevue/status/1", credits: [{ name: "Bo" }], media: { id: "aura", caption: "Aura" } },
      { id: "gallery", org: "primetek", date: "2023-09", title: "Gallery", note: "A gallery.", source: "https://x.com/w00f/status/2" },
    ],
    () => undefined,
  );
  const markup = html(<ArchiveLog view={archive} />);

  it("renders year groups, newest first, with month, title, note and post link", () => {
    expect(markup.indexOf(">2024<")).toBeLessThan(markup.indexOf(">2023<"));
    expect(markup).toContain("Jan 2024");
    expect(markup).toContain("Aura");
    expect(markup).toContain('href="https://x.com/primevue/status/1"');
    expect(markup).toContain("Design: ");
  });

  it("shows a figure only for rows that have one", () => {
    expect(markup.match(/data-media="/g)).toHaveLength(1);
  });
});
