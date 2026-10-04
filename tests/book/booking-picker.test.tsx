import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { BookingPicker } from "@/components/book/booking-picker";
import { type Booking, booking, calUrl } from "@/content/booking";

const config: Booking = { ...booking, calUsername: "someone" };

// React escapes text in markup ("You're" becomes "You&#x27;re").
const escaped = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#x27;");

describe("BookingPicker (server HTML)", () => {
  it("lists every type with its length and description, each linking to cal.com until hydration", () => {
    const html = renderToStaticMarkup(<BookingPicker config={config} />);
    for (const type of config.types) {
      expect(html).toContain(type.title);
      expect(html).toContain(`· ${type.minutes} min`);
      expect(html).toContain(escaped(type.description));
      expect(html).toContain(`href="${calUrl(type, config)}"`);
      expect(html).toContain(`aria-label="Choose ${type.title}"`);
    }
  });

  it("selects nothing and loads no calendar in the server HTML", () => {
    const html = renderToStaticMarkup(<BookingPicker config={config} />);
    expect(html).not.toContain("Selected");
    expect(html).not.toContain('role="region"');
  });
});
