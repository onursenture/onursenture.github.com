import { describe, expect, it } from "vitest";
import { profile } from "@/content/profile";
import { bioToText, textToBio } from "@/lib/content/bio-tokens";

describe("bio tokens", () => {
  it("writes organisations as {org} tokens and reads them back", () => {
    expect(bioToText(["At ", { org: "primetek" }, " for ten years."])).toBe("At {primetek} for ten years.");
    expect(textToBio("At {primetek} for ten years.")).toEqual(["At ", { org: "primetek" }, " for ten years."]);
    expect(textToBio("{orkestra}{bilkent}")).toEqual([{ org: "orkestra" }, { org: "bilkent" }]);
  });

  it("keeps unknown tokens as text so validation can name them", () => {
    expect(textToBio("At {acme}.")).toEqual(["At {acme}."]);
  });

  it("does not read Object.prototype names as organisations", () => {
    expect(textToBio("{constructor}")).toEqual(["{constructor}"]);
  });

  it("round-trips the repo bio", () => {
    for (const paragraph of profile.bio) expect(textToBio(bioToText(paragraph))).toEqual(paragraph);
  });
});
