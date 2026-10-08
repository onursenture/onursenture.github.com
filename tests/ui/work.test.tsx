import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ImagesBlock, ProductBlocks, TextBlock, ThenBlock, imageGridSizes } from "@/components/work/blocks";
import { LinkLine } from "@/components/work/link-line";
import { CreditLine } from "@/components/work/credit-line";
import { MediaFigure } from "@/components/work/media-figure";
import { ProductHeader } from "@/components/work/product-header";
import type { ProductPage } from "@/content/work/types";
import { type BlockView, buildProductPage } from "@/lib/work/derive";
import type { IconSet } from "@/lib/work/icons";

const html = renderToStaticMarkup;

const page: ProductPage = {
  slug: "primeone",
  org: "primetek",
  title: "PrimeOne",
  kind: "design system",
  lead: { strong: "PrimeOne.", rest: "A kit." },
  intro: "One paragraph.",
  facts: [
    { label: "Role", value: "Design lead" },
    { label: "Years", value: "2022–2026" },
    { label: "At", value: "PrimeTek" },
  ],
  blocks: [
    { kind: "text", id: "what-i-did", heading: "What I did", body: ["First.", "Second."] },
    {
      kind: "images",
      id: "highlights",
      heading: "Highlights",
      columns: 3,
      images: [
        { id: "cover", caption: "Cover" },
        { id: "tokens", caption: "Tokens", credits: [{ name: "Ada", href: "https://ada.example" }] },
        { id: "bare" },
      ],
    },
    { kind: "icons", id: "icon-set", heading: "Icon set" },
  ],
};
const view = buildProductPage(page, (key) => (key === "work/primeone/cover" ? { width: 2560, height: 1600, widths: [640, 1280, 2560] } : undefined));
const images = (columns?: 1 | 2 | 3) => ({ ...(view.blocks[1] as Extract<BlockView, { kind: "images" }>), columns });
const icons: IconSet = { version: "7.0.0", icons: [{ name: "check", svg: "<svg></svg>" }] };

describe("MediaFigure", () => {
  it("renders the image when one exists", () => {
    const markup = html(<MediaFigure media={view.images[0]} sizes="100vw" />);
    expect(markup).toContain("/images/work/primeone/cover-2560.jpg");
    expect(markup).toContain('alt="Cover"');
    expect(markup).toContain("aspect-[16/10]");
  });

  it("renders a labelled 16:10 placeholder otherwise, drops the label when bare, and takes a label override", () => {
    const tokens = view.images[1];
    expect(html(<MediaFigure media={tokens} sizes="100vw" />)).toContain("FIG. 02 · Tokens");
    expect(html(<MediaFigure media={view.images[2]} sizes="100vw" />)).toContain(">FIG. 03<");
    expect(html(<MediaFigure media={tokens} sizes="100vw" bare />)).not.toContain("FIG.");
    expect(html(<MediaFigure media={tokens} sizes="100vw" label="FIG. 01 · Pinned" />)).toContain("FIG. 01 · Pinned");
  });
});

describe("CreditLine", () => {
  it("renders nothing without credits, and role-grouped names (never links) otherwise", () => {
    expect(html(<CreditLine credits={[]} />)).toBe("");
    const markup = html(<CreditLine credits={[{ name: "Ada", href: "https://ada.example" }, { name: "Bo", role: "illustration" }]} />);
    expect(markup).toContain("Design: ");
    expect(markup).toContain("Ada");
    expect(markup).not.toContain("href=");
    expect(markup).toContain(" · Illustration: ");
  });
});

describe("ProductHeader", () => {
  const markup = html(<ProductHeader page={view} />);

  it("links home from the label column and holds the page h1", () => {
    expect(markup).toMatch(/<a [^>]*href="\/"[^>]*>← Home<\/a>/);
    expect(markup).toContain("<h1");
    expect(markup).toContain("PrimeOne.");
    expect(markup).toContain("One paragraph.");
  });

  it("lists the facts as a two-column list", () => {
    for (const value of ["Design lead", "2022–2026", "PrimeTek"]) expect(markup).toContain(`<dd>${value}</dd>`);
    expect(markup).toContain("<dt");
  });
});

describe("TextBlock", () => {
  it("puts the heading in the label column and the body paragraphs in the 480px column", () => {
    const markup = html(<TextBlock block={page.blocks[0] as Extract<BlockView, { kind: "text" }>} />);
    expect(markup).toContain('id="what-i-did"');
    expect(markup).toMatch(/<h2[^>]*>What I did<\/h2>/);
    expect(markup.match(/type-body text-fg-soft/g)).toHaveLength(2);
    expect(markup).not.toContain("lg:col-span-2");
  });
});

describe("ImagesBlock", () => {
  it("is a wide row anchored at its id, with a button per image that opens the viewer", () => {
    const markup = html(<ImagesBlock block={images(3)} />);
    expect(markup).toContain('id="highlights"');
    expect(markup).toContain("lg:col-span-2");
    expect(markup).toMatch(/<h2[^>]*>Highlights<\/h2>/);
    expect(markup.match(/data-media="/g)).toHaveLength(3);
    expect(markup).toContain('aria-label="FIG. 02 · Tokens, open in viewer"');
    expect(markup).toContain('aria-label="FIG. 03, open in viewer"');
  });

  it("captions an image and credits its designer as plain text", () => {
    const markup = html(<ImagesBlock block={images(3)} />);
    expect(markup).toContain("<figcaption");
    expect(markup).toContain("Design: ");
    expect(markup).not.toContain("ada.example");
  });

  it.each([
    [1, "", imageGridSizes(1)],
    [2, "md:grid-cols-2", imageGridSizes(2)],
    [3, "md:grid-cols-2 lg:grid-cols-3", imageGridSizes(3)],
  ] as const)("columns: %s", (columns, classes, sizes) => {
    const markup = html(<ImagesBlock block={images(columns)} />);
    expect(markup).toContain(`data-columns="${columns}"`);
    expect(markup).toContain(`class="grid gap-4${classes ? ` ${classes}` : ""}"`);
    expect(markup).toContain(`sizes="${sizes}"`);
  });

  it("defaults to one column", () => {
    expect(html(<ImagesBlock block={images()} />)).toContain('data-columns="1"');
  });

  it("sizes three columns for the wide row", () => {
    expect(imageGridSizes(3)).toBe(
      "(min-width: 1024px) calc((100vw - 308px - 32px) / 3), (min-width: 768px) calc((100vw - 80px - 16px) / 2), calc(100vw - 32px)",
    );
  });
});

describe("ProductBlocks", () => {
  it("renders every block in order, the icons block only with the PrimeIcons set", () => {
    const withIcons = html(<ProductBlocks page={view} icons={icons} />);
    const ids = ['id="what-i-did"', 'id="highlights"', 'id="icon-set"'];
    for (const id of ids) expect(withIcons).toContain(id);
    expect(withIcons.indexOf(ids[0])).toBeLessThan(withIcons.indexOf(ids[1]));
    expect(withIcons.indexOf(ids[1])).toBeLessThan(withIcons.indexOf(ids[2]));
    expect(withIcons).toContain("PrimeIcons 7.0.0 © PrimeTek, MIT License");

    const without = html(<ProductBlocks page={view} />);
    expect(without).not.toContain('id="icon-set"');
    expect(without).not.toContain("MIT License");
  });
});

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
