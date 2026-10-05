import { describe, expect, it } from "vitest";
import { yearFromAgo } from "@/lib/life-log/relative-year";

const oct5 = new Date("2026-10-05T09:00:00Z"); // 12:00 in Istanbul
const jan2 = new Date("2026-01-02T09:00:00Z");

describe("yearFromAgo", () => {
  it("reads every unit tiyatrolar uses", () => {
    expect(yearFromAgo("3 gün önce", oct5)).toBe(2026);
    expect(yearFromAgo("2 hafta önce", oct5)).toBe(2026);
    expect(yearFromAgo("5 ay önce", oct5)).toBe(2026);
    expect(yearFromAgo("11 ay önce", oct5)).toBe(2025);
    expect(yearFromAgo("11 yıl önce", oct5)).toBe(2015);
    expect(yearFromAgo("4 saat önce", oct5)).toBe(2026);
    expect(yearFromAgo("az önce", oct5)).toBe(2026);
  });

  it("crosses the year boundary in Istanbul time", () => {
    expect(yearFromAgo("3 gün önce", jan2)).toBe(2025);
    expect(yearFromAgo("1 hafta önce", jan2)).toBe(2025);
    // 2025-12-31T22:30Z is already 2026-01-01 01:30 in Istanbul.
    expect(yearFromAgo("1 saat önce", new Date("2025-12-31T23:30:00Z"))).toBe(2026);
  });

  it("returns null for anything else", () => {
    expect(yearFromAgo("", oct5)).toBeNull();
    expect(yearFromAgo("yesterday", oct5)).toBeNull();
  });
});
