import { describe, expect, it } from "vitest";
import { type Booking, booking, bookingEnabled, calLink, calUrl, typeFromHash } from "@/content/booking";

describe("booking config", () => {
  it("lists three call types with unique ids and slugs, copy and a positive length", () => {
    expect(booking.types.map((type) => type.id)).toEqual(["role", "project", "mentoring"]);
    expect(new Set(booking.types.map((type) => type.slug)).size).toBe(3);
    for (const type of booking.types) {
      expect(type.minutes, type.id).toBeGreaterThan(0);
      expect(type.title.trim(), type.id).not.toBe("");
      expect(type.description.trim(), type.id).not.toBe("");
      expect(type.slug, type.id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("is off while the username is blank", () => {
    expect(bookingEnabled({ ...booking, calUsername: " " })).toBe(false);
    expect(bookingEnabled({ ...booking, calUsername: "someone" })).toBe(true);
  });

  it("builds the embed link and the cal.com URL", () => {
    const config: Booking = { ...booking, calUsername: "someone" };
    const project = config.types[1];
    expect(calLink(project, config)).toBe(`someone/${project.slug}`);
    expect(calUrl(project, config)).toBe(`https://cal.com/someone/${project.slug}`);
  });

  it("reads the chosen type from the URL hash", () => {
    expect(typeFromHash("#project")?.id).toBe("project");
    expect(typeFromHash("mentoring")?.id).toBe("mentoring");
    expect(typeFromHash("")).toBeNull();
    expect(typeFromHash("#nope")).toBeNull();
  });
});
