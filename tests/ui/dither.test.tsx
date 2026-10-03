import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PrimaryButton } from "@/components/ui/primary-button";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import { SectionRow } from "@/components/ui/section-row";
import { parseHex } from "@/components/ui/use-token-color";

describe("parseHex", () => {
  it("reads 6- and 3-digit hex, with or without spaces", () => {
    expect(parseHex("#2F55F5")).toEqual([47, 85, 245]);
    expect(parseHex(" #fff ")).toEqual([255, 255, 255]);
    expect(parseHex("")).toBeNull();
    expect(parseHex("rgb(1,2,3)")).toBeNull();
  });
});

describe("MediaPlaceholder", () => {
  it("renders a labelled, decorative wash while there is no image", () => {
    const html = renderToStaticMarkup(<MediaPlaceholder label="PrimeOne" index={1} />);
    expect(html).toContain("FIG. 01 · PrimeOne");
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("<picture");
  });

  it("renders the image instead once one is set (the Sprint 7 upload hook)", () => {
    const html = renderToStaticMarkup(<MediaPlaceholder label="Stabilo" index={2} image="photos/stabilo" />);
    expect(html).toContain("<picture");
    expect(html).not.toContain("FIG.");
  });
});

describe("PrimaryButton", () => {
  it("switches to the dark ink label in dark mode (white on the dark accent fails AA)", () => {
    const html = renderToStaticMarkup(<PrimaryButton href="/x/">Go</PrimaryButton>);
    expect(html).toContain("text-[#fff]");
    expect(html).toContain("dark:text-bg");
  });
});

describe("SectionRow", () => {
  it("renders label, content and action in one section", () => {
    const html = renderToStaticMarkup(
      <SectionRow id="work" label="Work" action={<span>All</span>}>
        <p>content</p>
      </SectionRow>,
    );
    expect(html).toContain('id="work"');
    expect(html).toContain(">Work<");
    expect(html).toMatch(/<h2[^>]*>Work<\/h2>/);
    expect(html).toContain("<p>content</p>");
    expect(html).toContain("<span>All</span>");
  });

  it("puts the action under the label on a wide row", () => {
    const html = renderToStaticMarkup(
      <SectionRow label="Films" wide action={<span>All</span>}>
        <p>content</p>
      </SectionRow>,
    );
    expect(html).toMatch(/<h2[^>]*>Films<\/h2><div class="mt-1[^"]*"><span>All<\/span><\/div>/);
    expect(html).not.toContain("lg:text-right");
  });

  it("repeats a wide row's action after the content below lg, and hides it from the label cell there", () => {
    const html = renderToStaticMarkup(
      <SectionRow label="Films" wide action={<span>All</span>}>
        <p>content</p>
      </SectionRow>,
    );
    expect(html).toMatch(/<div class="mt-1[^"]*hidden[^"]*lg:block[^"]*"><span>All<\/span><\/div>/);
    expect(html).toMatch(/<p>content<\/p><\/div><div class="[^"]*lg:hidden[^"]*"><span>All<\/span><\/div>/);
  });

  it("renders no action cell without an action", () => {
    const html = renderToStaticMarkup(
      <SectionRow label="Films" wide>
        <p>content</p>
      </SectionRow>,
    );
    expect(html).not.toContain("text-fg-muted");
    expect(html.endsWith("</div></div></section>")).toBe(true);
    expect(html.match(/<div/g)).toHaveLength(2);
  });
});
