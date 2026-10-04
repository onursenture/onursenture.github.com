import { describe, expect, expectTypeOf, it } from "vitest";
import type { z } from "zod";
import { type ExperienceEntry, experience } from "@/content/experience";
import { type LabEntry, labIndex } from "@/content/lab-index";
import { ORGS } from "@/content/orgs";
import { type PinRef, pinOrder } from "@/content/pins";
import { type ProfileCopy, profile } from "@/content/profile";
import { productPages } from "@/content/work";
import type { ProductPage } from "@/content/work/types";
import { isDocKey, slugOfKey, workKey } from "@/lib/content/keys";
import {
  experienceSchema,
  labSchema,
  orgIdSchema,
  pinsSchema,
  productPageSchema,
  profileSchema,
  schemaFor,
  workIndexSchema,
} from "@/lib/content/schemas";

describe("document keys", () => {
  it("names a product page work/<slug> and recognises every key", () => {
    expect(workKey("nebuu")).toBe("work/nebuu");
    expect(slugOfKey("work/nebuu")).toBe("nebuu");
    expect(slugOfKey("lab")).toBeNull();
    for (const key of ["work/nebuu", "work-index", "pins", "lab", "profile", "experience"]) expect(isDocKey(key), key).toBe(true);
    for (const key of ["work/Nebuu", "work/", "settings", "work/a/b"]) expect(isDocKey(key), key).toBe(false);
  });
});

describe("schemas", () => {
  it("match the content types exactly", () => {
    expectTypeOf<z.infer<typeof productPageSchema>>().toEqualTypeOf<ProductPage>();
    expectTypeOf<z.infer<typeof labSchema>>().toEqualTypeOf<LabEntry[]>();
    expectTypeOf<z.infer<typeof profileSchema>>().toEqualTypeOf<ProfileCopy>();
    expectTypeOf<z.infer<typeof experienceSchema>>().toEqualTypeOf<ExperienceEntry[]>();
    expectTypeOf<z.infer<typeof pinsSchema>["order"]>().toEqualTypeOf<PinRef[]>();
  });

  it("list every organisation", () => {
    expect([...orgIdSchema.options].sort()).toEqual(Object.keys(ORGS).sort());
  });

  it("accept every repo document", () => {
    for (const page of productPages) expect(productPageSchema.safeParse(page).success, page.slug).toBe(true);
    expect(workIndexSchema.safeParse({ slugs: productPages.map((p) => p.slug) }).success).toBe(true);
    expect(pinsSchema.safeParse({ order: pinOrder }).success).toBe(true);
    expect(labSchema.safeParse(labIndex).success).toBe(true);
    expect(profileSchema.safeParse({ lead: profile.lead, bio: profile.bio }).success).toBe(true);
    expect(experienceSchema.safeParse(experience).success).toBe(true);
  });

  it("reject a malformed month, an unknown block kind and an empty title", () => {
    expect(experienceSchema.safeParse([{ ...experience[0], start: "2013-13" }]).success).toBe(false);
    const nebuu = productPages.find((p) => p.slug === "nebuu")!;
    expect(productPageSchema.safeParse({ ...nebuu, blocks: [{ kind: "video", id: "x" }] }).success).toBe(false);
    expect(productPageSchema.safeParse({ ...nebuu, title: "" }).success).toBe(false);
  });

  it("pick the schema for a key", () => {
    expect(schemaFor("work/nebuu")).toBe(productPageSchema);
    expect(schemaFor("lab")).toBe(labSchema);
    expect(schemaFor("experience")).toBe(experienceSchema);
  });
});
