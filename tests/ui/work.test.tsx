import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ArchiveLog } from "@/components/work/archive-log";
import { CreditLine } from "@/components/work/credit-line";
import { LogView } from "@/components/work/log-view";
import { MediaFigure } from "@/components/work/media-figure";
import { StudyBody } from "@/components/work/study-body";
import type { CaseStudy, EntryColumns } from "@/content/work/types";
import { buildArchiveView, buildStudyView } from "@/lib/work/derive";

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
  it("renders nothing without credits, and role-grouped names (never links) otherwise", () => {
    expect(html(<CreditLine credits={[]} />)).toBe("");
    const markup = html(<CreditLine credits={[{ name: "Ada", href: "https://ada.example" }, { name: "Bo", role: "implementation" }]} />);
    expect(markup).toContain("Design: ");
    expect(markup).toContain("Ada");
    expect(markup).not.toContain("href=");
    expect(markup).toContain(" · Implementation: ");
    expect(markup).toContain("Bo");
  });
});

describe("LogView", () => {
  const markup = html(<LogView study={view} />);

  it("groups by year, newest first", () => {
    expect(markup.indexOf(">2026<")).toBeLessThan(markup.indexOf(">2024<"));
  });

  it("shows the heading with its month, the note, the credit and an @w00f source", () => {
    expect(markup).toContain("3.0");
    expect(markup).toContain("· Nov");
    expect(markup).toContain("Rebuilt.");
    expect(markup).toContain("Design: ");
    expect(markup).toContain('href="https://x.com/w00f/status/1"');
    expect(markup).toContain('aria-label="Post on X, 3.0, Nov 2024"');
  });

  it("renders no link for a source that is not an @w00f post, and none for entry links", () => {
    const other = buildStudyView(
      {
        ...study,
        links: [{ label: "Site", href: "https://primevue.org" }],
        entries: [
          {
            id: "e",
            date: "2024-11",
            version: "1.0",
            note: "N.",
            source: "https://www.primefaces.org/blog/x/",
            links: [{ label: "Demo", href: "https://demo.example" }],
            media: [],
          },
        ],
      },
      () => undefined,
    );
    const out = html(<LogView study={other} />);
    expect(out).not.toContain("href=");
    expect(out).not.toContain("Demo");
  });

  it("shows every figure of an entry, with no link to a Grid", () => {
    expect(markup).toContain('data-media="overview"');
    expect(markup).toContain('data-media="tokens"');
    expect(markup).not.toContain("in Grid");
  });

  describe("columns", () => {
    const media = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `m${i}`, caption: `M${i}` }));
    // Every slot has an image so the rendered `sizes` can be checked.
    const render = (n: number, columns?: EntryColumns) =>
      html(
        <LogView
          study={buildStudyView(
            { ...study, entries: [{ id: "e", date: "2024-11", version: "1.0", note: "N.", columns, media: media(n) }] },
            () => ({ width: 1600, height: 1000, widths: [640, 1280, 1600] }),
          )}
        />,
      );
    const grid = (markup: string) => /<div data-entry-media="\d+" data-columns="(\d)" class="([^"]*)"/.exec(markup)!;

    it("defaults to one column at every width, however many figures", () => {
      for (const n of [1, 2, 3, 7]) {
        const [, columns, classes] = grid(render(n));
        expect(columns).toBe("1");
        expect(classes).not.toContain("grid-cols");
        expect(render(n).match(/data-media="m/g)).toHaveLength(n);
      }
      const one = render(1);
      expect(one).toContain("(min-width: 1024px) calc(100vw - 816px)");
      expect(one).not.toContain("/ 2)");
    });

    it("columns: 2 is two columns from md", () => {
      const [, columns, classes] = grid(render(4, 2));
      expect(columns).toBe("2");
      expect(classes).toContain("md:grid-cols-2");
      expect(classes).not.toContain("lg:grid-cols-3");
      expect(render(4, 2)).toContain("(min-width: 1024px) calc((100vw - 816px) / 2)");
    });

    it("columns: 3 is two columns from md and three from lg", () => {
      const [, columns, classes] = grid(render(4, 3));
      expect(columns).toBe("3");
      expect(classes).toContain("md:grid-cols-2 lg:grid-cols-3");
      expect(render(4, 3)).toContain("(min-width: 1024px) calc((100vw - 816px) / 3)");
    });

    it("keeps a lone figure at the full media-column width in a one-column entry", () => {
      expect(render(1, 1)).not.toContain("md:grid-cols-2");
    });
  });

  describe("posts", () => {
    const withPosts = buildStudyView(
      {
        ...study,
        posts: [
          { date: "2024-11-09", account: "w00f", id: "200", summary: "Onur on the launch.", entryId: "3-0" },
          { date: "2024-11-07", account: "primereact", id: "100", summary: "Launch.", entryId: "3-0" },
          { date: "2026-01-19", account: "primevue", id: "300", summary: "Variables.", entryId: "4-0" },
        ],
      },
      () => undefined,
    );
    const out = html(<LogView study={withPosts} />);
    // One entry's own markup: from its <li> to the end of its <article>.
    const list = (id: string) => {
      const start = out.indexOf(`id="entry-${id}"`);
      return out.slice(start, out.indexOf("</article>", start));
    };

    it("lists an entry's posts after its note, credits and media, oldest first", () => {
      const block = list("3-0");
      expect(block.indexOf("Rebuilt.")).toBeLessThan(block.indexOf('data-media="overview"'));
      expect(block.indexOf('data-media="tokens"')).toBeLessThan(block.indexOf('id="post-100"'));
      expect(block.indexOf('id="post-100"')).toBeLessThan(block.indexOf('id="post-200"'));
      expect(list("4-0")).toContain('id="post-300"');
      expect(list("4-0")).not.toContain('id="post-100"');
      expect(list("3-0")).toContain('aria-label="Posts"');
    });

    it("reads date, account, summary", () => {
      const row = /<li id="post-100">.*?<\/li>/.exec(list("3-0"))![0];
      expect(row).toContain("Nov 7, 2024 · @primereact");
      expect(row).toContain("Launch.");
    });

    it("keeps real whitespace between date, account and summary, even around the hidden separator", () => {
      const row = /<li id="post-100">.*?<\/li>/.exec(list("3-0"))![0];
      expect(row).toContain("</span> <span aria-hidden");
      expect(row).toMatch(/<\/span> <span class="text-fg-soft">Launch\.<\/span>/);
      expect(row.replace(/<[^>]+>/g, "")).toBe("Nov 7, 2024 · @primereact · Launch.");
    });

    it("links an @w00f post to X, named from 'Post on X'", () => {
      const entry = list("3-0");
      expect(entry).toContain('href="https://x.com/w00f/status/200"');
      expect(entry).toContain('aria-label="Post on X, Nov 9, 2024, @w00f: Onur on the launch."');
    });

    it("renders a post from another account as plain text, with no link", () => {
      const row = /<li id="post-100">.*?<\/li>/.exec(out)![0];
      expect(row).toContain("Launch.");
      expect(row).not.toContain("<a");
      expect(row).not.toContain("href");
    });

    it("renders no list for an entry without posts", () => {
      expect(html(<LogView study={view} />)).not.toContain('aria-label="Posts"');
    });
  });
});

describe("StudyBody", () => {
  it("puts the 16/10 hero in the content column, over the Log", () => {
    const markup = html(<StudyBody study={view} />);
    expect(markup).toContain("lg:col-start-2");
    expect(markup).toContain("aspect-[16/10]");
    expect(markup).not.toContain("21/9");
    expect(markup).toContain('data-view="log"');
  });

  it("has no view bar, filter, density control or grid cards", () => {
    const markup = html(<StudyBody study={view} />);
    for (const gone of ['aria-label="View"', 'aria-label="Filter"', 'aria-label="Density"', 'aria-pressed', 'data-view="grid"', 'data-view="index"', 'data-view="posts"', ">Grid<", ">Index<", ">Posts<"]) {
      expect(markup, gone).not.toContain(gone);
    }
  });
});

describe("ArchiveLog", () => {
  const archive = buildArchiveView(
    [
      { id: "aura", org: "primetek", date: "2024-01", title: "Aura", note: "A theme.", source: "https://x.com/primevue/status/1", credits: [{ name: "Bo" }], media: { id: "aura", caption: "Aura" } },
    {
      id: "saga",
      org: "primetek",
      date: "2020-08",
      title: "Saga",
      note: "Themes.",
      source: "https://www.primefaces.org/blog/primeng-10-begins/",
    },
      { id: "gallery", org: "primetek", date: "2023-09", title: "Gallery", note: "A gallery.", source: "https://x.com/w00f/status/2" },
    ],
    () => undefined,
  );
  const markup = html(<ArchiveLog view={archive} />);

  it("renders year groups, newest first, with month, title, note and credit", () => {
    expect(markup.indexOf(">2024<")).toBeLessThan(markup.indexOf(">2023<"));
    expect(markup).toContain("Jan 2024");
    expect(markup).toContain("Aura");
    expect(markup).toContain("Design: ");
  });

  it("links a source only when it is an @w00f post", () => {
    expect(markup.match(/href="/g)).toHaveLength(1);
    expect(markup).toContain('href="https://x.com/w00f/status/2"');
    expect(markup).toContain('aria-label="Post on X, Gallery, Sep 2023"');
    expect(markup).not.toContain("primevue/status");
    expect(markup).not.toContain("primefaces.org");
  });

  it("shows a figure only for rows that have one", () => {
    expect(markup.match(/data-media="/g)).toHaveLength(1);
  });
});
