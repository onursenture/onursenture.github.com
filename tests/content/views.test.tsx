import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PictureView } from "@/components/picture-view";
import { lookupWith, hasImageWith, toMediaEntry } from "@/lib/images/lookup";
import { renditionUrl } from "@/lib/images/plan";
import { repoSite } from "@/lib/content/site";
import { experienceViews, homeContent, pinViews, productPageView, productSlugs } from "@/lib/work/views";

const record = {
  key: "media/work/nebuu/game-ab12cd34",
  baseUrl: "https://x.public.blob.vercel-storage.com/media/work/nebuu/game-ab12cd34",
  width: 2560,
  height: 1600,
  widths: [640, 1280, 2560],
  sourceHash: "ab12cd34",
  settings: "v1",
  createdAt: new Date("2026-10-04T10:00:00.000Z"),
};

describe("uploaded images", () => {
  it("build rendition URLs from their base URL", () => {
    expect(renditionUrl("photos/stabilo", 640, "avif")).toBe("/images/photos/stabilo-640.avif");
    expect(renditionUrl(record.key, 640, "jpg", record.baseUrl)).toBe(`${record.baseUrl}-640.jpg`);
  });

  it("are found by key ahead of the manifest", () => {
    const media = [toMediaEntry(record)];
    expect(lookupWith(media)(record.key)).toEqual({ width: 2560, height: 1600, widths: [640, 1280, 2560], baseUrl: record.baseUrl });
    expect(lookupWith(media)("work/nebuu/nothing")).toBeUndefined();
    expect(hasImageWith(media)(record.key)).toBe(true);
  });

  it("render through PictureView with their base URL", () => {
    const markup = renderToStaticMarkup(<PictureView image={record.key} entry={lookupWith([toMediaEntry(record)])(record.key)!} alt="" />);
    expect(markup).toContain(`${record.baseUrl}-2560.jpg`);
    expect(markup).not.toContain("/images/media/");
  });
});

describe("site views", () => {
  const site = repoSite();
  const none = () => undefined;

  it("lists slugs in registry order and builds a page", () => {
    expect(productSlugs(site)[0]).toBe("primeone");
    expect(productPageView(site, "nebuu", none)?.title).toBe("Nebuu");
    expect(productPageView(site, "ghost", none)).toBeNull();
  });

  it("builds the home content from one site", () => {
    const content = homeContent(site, none);
    expect(content.pins.map((pin) => pin.slug)).toEqual(pinViews(site, none).map((pin) => pin.slug));
    expect(content.experience).toEqual(experienceViews(site));
    expect(content.lab).toBe(site.lab);
    expect(content.profile).toBe(site.profile);
  });
});
