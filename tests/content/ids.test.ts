import { describe, expect, it } from "vitest";
import { productPages } from "@/content/work";
import { followId, kebab, lockedIds, uniqueId } from "@/lib/content/ids";

describe("ids", () => {
  it("kebab-cases text, folding Turkish letters", () => {
    expect(kebab("What I did")).toBe("what-i-did");
    expect(kebab("İmparator Kartları")).toBe("imparator-kartlari");
    expect(kebab("nebuu.com")).toBe("nebuu-com");
    expect(kebab("  ")).toBe("");
  });

  it("makes an id unique, with a fallback for blank text", () => {
    expect(uniqueId("highlights", ["highlights"], "block")).toBe("highlights-2");
    expect(uniqueId("", [], "block")).toBe("block");
    expect(uniqueId("", ["block", "block-2"], "block")).toBe("block-3");
  });

  it("lets an unlocked id follow its heading while it still matches it", () => {
    expect(followId("block", "", "Decks", ["then", "block"], "block", false)).toBe("decks");
    expect(followId("decks", "Decks", "Deck list", ["decks"], "block", false)).toBe("deck-list");
    expect(followId("decks-2", "Decks", "Cards", ["decks", "decks-2"], "block", false)).toBe("cards");
    expect(followId("custom", "Decks", "Cards", ["custom"], "block", false)).toBe("custom");
    expect(followId("decks", "Decks", "Cards", ["decks"], "block", true)).toBe("decks");
  });

  it("never yields a reserved id, however the text changes", () => {
    // "decks" was published and then deleted: it stays reserved.
    const reserved = ["then", "what-i-did", "decks", "editions", "highlights"];
    expect(uniqueId("decks", reserved, "block")).toBe("decks-2");
    expect(followId("block", "", "Decks", reserved, "block", false)).toBe("decks-2");
    expect(followId("decks-list", "Decks list", "Decks", reserved, "block", false)).toBe("decks-2");
    expect(followId("block", "", "", reserved, "block", false)).toBe("block");
    for (const text of ["", "Decks", "Editions", "Then", "What I did", "Highlights", "Decks list"]) {
      expect(reserved).not.toContain(followId("block", "", text, reserved, "block", false));
    }
  });

  it("locks every id the live page already has", () => {
    const nebuu = productPages.find((p) => p.slug === "nebuu")!;
    expect(lockedIds(nebuu)).toEqual({ blocks: ["then", "what-i-did", "decks", "editions", "highlights"], images: ["game", "cards", "site"] });
    expect(lockedIds(null)).toEqual({ blocks: [], images: [] });
  });
});
