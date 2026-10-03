import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Cover } from "@/components/ui/cover";
import { DataTable } from "@/components/ui/data-table";

const html = renderToStaticMarkup;

describe("DataTable", () => {
  const columns = [
    { header: "Title", cell: (row: { title: string; n: number }) => row.title },
    { header: "Count", cell: (row: { title: string; n: number }) => row.n, mono: true, align: "right" as const },
  ];

  it("uses a real header row with scoped column headers", () => {
    const markup = html(<DataTable columns={columns} rows={[{ title: "a", n: 1 }]} rowKey={(r) => r.title} />);
    expect(markup).toContain("<thead>");
    expect(markup.match(/<th scope="col"/g)).toHaveLength(2);
    expect(markup).toMatch(/type-meta[^"]*text-right[^>]*>1</);
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
