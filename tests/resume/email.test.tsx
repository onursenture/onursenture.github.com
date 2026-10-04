import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EmailLink } from "@/components/resume/email-link";
import { decodeEmail, emailPieces, encodeEmail } from "@/lib/resume/email";

describe("resume email", () => {
  it("round-trips through the encoded prop", () => {
    expect(decodeEmail(encodeEmail("hello@onursenture.com"))).toBe("hello@onursenture.com");
    expect(encodeEmail("hello@onursenture.com")).not.toContain("@");
    expect(decodeEmail(encodeEmail("öner@örnek.com"))).toBe("öner@örnek.com");
  });

  // EmailLink is a client component: the encoder can't rely on Node's Buffer.
  it("encodes without Buffer, the same as Buffer does", () => {
    const expected = Buffer.from("öner@örnek.com", "utf8").toString("base64");
    vi.stubGlobal("Buffer", undefined);
    try {
      expect(encodeEmail("öner@örnek.com")).toBe(expected);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("splits the address so '@' and each '.' are their own pieces", () => {
    expect(emailPieces("hello@onur.co")).toEqual(["hello", "@", "onur", ".", "co"]);
  });

  it("renders text without the address as one string and without a link before hydration", () => {
    const html = renderToStaticMarkup(<EmailLink code={encodeEmail("hello@onur.co")} />);
    expect(html).not.toContain("hello@onur.co");
    expect(html).not.toContain("mailto:");
    expect(html.replace(/<[^>]+>/g, "")).toBe("hello@onur.co");
  });
});
