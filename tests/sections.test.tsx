import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SectionBlock } from "@/components/sections/section-block";
import type { AnySectionDefinition } from "@/components/sections/types";

const section: AnySectionDefinition = {
  id: "films",
  title: "Films",
  source: "Letterboxd",
  href: "https://letterboxd.com/onur/",
  load: async () => ({ data: ["a", "b"], lastSuccessAt: null }),
  Render: ({ data }: { data: string[] }) => <p>{data.join(",")}</p>,
};

describe("SectionBlock", () => {
  it("renders the section as a band with its label, source, link and content", async () => {
    const html = renderToStaticMarkup(await SectionBlock({ section }));
    expect(html).toContain('data-section="films"');
    expect(html).toContain('id="films"');
    expect(html).toContain("Films");
    expect(html).toContain("Letterboxd");
    expect(html).toContain('href="https://letterboxd.com/onur/"');
    expect(html).toContain("<p>a,b</p>");
  });
});
