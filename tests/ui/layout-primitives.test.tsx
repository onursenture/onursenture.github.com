import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Band } from "@/components/ui/band";
import { Cover } from "@/components/ui/cover";
import { DataTable } from "@/components/ui/data-table";
import { IndexRow } from "@/components/ui/index-row";
import { Panel } from "@/components/ui/panel";
import { Stat } from "@/components/ui/stat";

const html = renderToStaticMarkup;

describe("IndexRow", () => {
  it("renders a plain, non-interactive row without an href", () => {
    const markup = html(<IndexRow entry={{ title: "PrimeOne", meta: "80+ components" }} />);
    expect(markup).toMatch(/^<div /);
    expect(markup).not.toContain("<a");
    expect(markup).not.toContain("→");
    expect(markup).toContain("PrimeOne");
    expect(markup).toContain("80+ components");
  });

  it("renders empty fields as nothing, never as dashes", () => {
    const markup = html(<IndexRow entry={{ title: "nebuu" }} />);
    // Year, role and arrow cells are present but empty.
    expect(markup.match(/<span[^>]*><\/span>/g)).toHaveLength(3);
    expect(markup).not.toMatch(/>[–—-]</);
  });

  it("makes the whole row a link with a trailing → when href is set", () => {
    const markup = html(<IndexRow entry={{ title: "Life", href: "/life/" }} />);
    expect(markup).toMatch(/^<a [^>]*href="\/life\/"/);
    expect(markup).toContain("→");
    expect(markup).toContain("group-hover:underline");
  });

  it("gives external rows rel=noopener noreferrer and shows a status glyph", () => {
    const markup = html(
      <IndexRow entry={{ title: "x", href: "https://example.com/", status: "late", statusLabel: "in progress" }} />,
    );
    expect(markup).toContain('rel="noopener noreferrer"');
    expect(markup).toContain('aria-label="in progress"');
    expect(markup).toContain("◐");
  });
});

describe("DataTable", () => {
  const columns = [
    { header: "Title", cell: (row: { title: string; n: number }) => row.title },
    { header: "Count", cell: (row: { title: string; n: number }) => row.n, mono: true, align: "right" as const },
  ];

  it("uses a real header row with scoped column headers", () => {
    const markup = html(<DataTable columns={columns} rows={[{ title: "a", n: 1 }]} rowKey={(r) => r.title} />);
    expect(markup).toContain("<thead>");
    expect(markup.match(/<th scope="col"/g)).toHaveLength(2);
    expect(markup).toMatch(/type-mono-12[^"]*text-right[^>]*>1</);
  });

  it("renders one empty-state row spanning every column", () => {
    const markup = html(<DataTable columns={columns} rows={[]} rowKey={(r) => r.title} empty="No films yet." />);
    expect(markup).toContain('<td colSpan="2"');
    expect(markup).toContain("No films yet.");
  });
});

describe("Cover", () => {
  it("renders a lazy 2:3 image with explicit dimensions", () => {
    const markup = html(<Cover src="https://example.com/p.jpg" alt="" width={200} />);
    expect(markup).toContain('width="200" height="300"');
    expect(markup).toContain('loading="lazy"');
    expect(markup).toContain("aspect-[2/3]");
  });

  it("renders a --color-line block without a src", () => {
    const markup = html(<Cover src="" alt="" />);
    expect(markup).not.toContain("<img");
    expect(markup).toContain("bg-line");
  });
});

describe("Panel, Band and Stat", () => {
  it("Panel shows its title and count and spans the given columns", () => {
    const markup = html(
      <Panel title="Work" count={5} span={8}>
        body
      </Panel>,
    );
    expect(markup).toContain("md:col-span-8");
    expect(markup).toContain(">Work</h2>");
    expect(markup).toContain("<span>5</span>");
  });

  it("Band shows label · source and an All → link only with an href", () => {
    expect(html(<Band label="Films" source="Letterboxd">x</Band>)).not.toContain("<a");
    const linked = html(
      <Band label="Films" source="Letterboxd" href="https://letterboxd.com/onur/">
        x
      </Band>,
    );
    expect(linked).toContain("· Letterboxd");
    expect(linked).toContain('rel="noopener noreferrer"');
  });

  it("Stat pairs a label with a value", () => {
    const markup = html(<Stat label="Films" value={6} />);
    expect(markup).toContain(">Films</dt>");
    expect(markup).toContain(">6</dd>");
  });
});
