import { describe, expect, it } from "vitest";
import { pinItems } from "@/lib/admin/pin-items";
import { repoSite } from "@/lib/content/site";
import { buildPins } from "@/lib/work/derive";

describe("pinItems", () => {
  it("describes each pin for the order list", () => {
    const site = repoSite();
    const items = pinItems(buildPins(site.pages, site.pins, () => undefined));
    expect(items.map((item) => `${item.slug}/${item.imageId}`)).toEqual(site.pins.map((ref) => `${ref.slug}/${ref.imageId}`));
    expect(items[0]).toEqual({ slug: "primeone", imageId: "components", title: "Components", pageTitle: "PrimeOne", imageKey: "work/primeone/components", entry: null });
  });
});
