import { describe, expect, it } from "vitest";
import { TITLE_TEMPLATE, fullTitle, pageMetadata } from "@/lib/metadata";

describe("pageMetadata", () => {
  it("keeps the shared Open Graph and Twitter defaults, without an image", () => {
    expect(pageMetadata("Life")).toEqual({
      title: "Life",
      openGraph: { siteName: "Onur Senture", locale: "en_US", type: "website", title: "Life · Onur Senture" },
      twitter: { card: "summary", title: "Life · Onur Senture" },
    });
  });

  it("lets a page override fields on top of the defaults", () => {
    const metadata = pageMetadata("Stabilo", {
      description: "Stabilo",
      openGraph: { type: "article", images: ["/x.jpg"] },
      twitter: { card: "summary_large_image", images: ["/x.jpg"] },
    });
    expect(metadata.description).toBe("Stabilo");
    expect(metadata.openGraph).toMatchObject({ siteName: "Onur Senture", type: "article", images: ["/x.jpg"] });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image", title: "Stabilo · Onur Senture" });
  });
});

describe("title format", () => {
  it("has one source for the root template and page metadata", () => {
    expect(TITLE_TEMPLATE).toBe("%s · Onur Senture");
    expect(fullTitle("Life")).toBe("Life · Onur Senture");
    expect(pageMetadata("Life").openGraph).toMatchObject({ title: fullTitle("Life") });
  });
});
