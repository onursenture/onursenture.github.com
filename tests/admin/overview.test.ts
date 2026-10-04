import { describe, expect, it } from "vitest";
import { productPages } from "@/content/work";
import { docRows } from "@/lib/admin/overview";
import type { ContentDoc } from "@/lib/content/store";

const at = new Date("2026-10-04T10:00:00.000Z");
const doc = (key: string, draft: unknown, published: unknown): ContentDoc =>
  ({ key, draft, published, draftUpdatedAt: draft ? at : null, publishedAt: published ? at : null }) as ContentDoc;
const nebuu = productPages.find((p) => p.slug === "nebuu")!;

describe("docRows", () => {
  it("lists every page in registry order as repo when nothing is stored", () => {
    const { pages, home } = docRows([]);
    expect(pages.map((row) => row.title)).toEqual(productPages.map((p) => p.title));
    expect(pages.every((row) => row.state === "repo")).toBe(true);
    expect(pages[0]).toEqual({ key: "work/primeone", title: "PrimeOne", editHref: "/admin/work/primeone/", state: "repo", publishedAt: null });
    expect(home.map((row) => [row.title, row.editHref])).toEqual([
      ["Bio", "/admin/bio/"],
      ["Lab", "/admin/lab/"],
      ["Experience", "/admin/experience/"],
    ]);
  });

  it("marks drafts, published documents and new pages, titled from the draft", () => {
    const { pages, home } = docRows([
      doc("work/nebuu", { ...nebuu, title: "Nebuu 2" }, null),
      doc("work/gonna", null, productPages.find((p) => p.slug === "gonna")),
      doc("work/brand-new", { ...nebuu, slug: "brand-new", title: "Brand New" }, null),
      doc("lab", [], null),
    ]);
    expect(pages.find((row) => row.key === "work/nebuu")).toMatchObject({ title: "Nebuu 2", state: "draft" });
    expect(pages.find((row) => row.key === "work/gonna")).toMatchObject({ state: "published", publishedAt: at.toISOString() });
    expect(pages.at(-1)).toMatchObject({ key: "work/brand-new", title: "Brand New", state: "new" });
    expect(home.find((row) => row.key === "lab")?.state).toBe("draft");
  });
});
