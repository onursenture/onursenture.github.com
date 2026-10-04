// Book a call (Sprint 8 spec §1.4): the cal.com account and its event types,
// in the order /book/ lists them. An empty calUsername turns booking off
// everywhere: /book/ 404s and no "Book a call" link renders.
export type BookingTypeId = "role" | "project" | "mentoring";

export interface BookingType {
  id: BookingTypeId;
  // The cal.com event type slug: cal.com/<calUsername>/<slug>.
  slug: string;
  title: string;
  // Must match the event type's length on cal.com.
  minutes: number;
  description: string;
}

export interface Booking {
  calUsername: string;
  types: BookingType[];
}

export const booking: Booking = {
  calUsername: "onursenture",
  types: [
    { id: "role", slug: "role", title: "Role / hiring", minutes: 30, description: "You're hiring for a design or design-engineering role." },
    { id: "project", slug: "project", title: "Project / freelance", minutes: 30, description: "A product, design system or app you want built." },
    { id: "mentoring", slug: "mentoring", title: "Mentoring / intro", minutes: 20, description: "Portfolio feedback, design systems, a first hello." },
  ],
};

export function bookingEnabled(config: Booking = booking): boolean {
  return config.calUsername.trim() !== "";
}

// "<username>/<slug>": the embed's calLink.
export function calLink(type: BookingType, config: Booking = booking): string {
  return `${config.calUsername.trim()}/${type.slug}`;
}

export function calUrl(type: BookingType, config: Booking = booking): string {
  return `https://cal.com/${calLink(type, config)}`;
}

// The call type a /book/ hash names ("#project"), or null.
export function typeFromHash(hash: string, config: Booking = booking): BookingType | null {
  const id = hash.replace(/^#/, "");
  return config.types.find((type) => type.id === id) ?? null;
}
