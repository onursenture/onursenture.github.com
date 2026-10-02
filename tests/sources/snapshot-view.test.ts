import { describe, expect, it, vi } from "vitest";
import { letterboxd } from "@/lib/sources/letterboxd";
import { toSourceView } from "@/lib/sources/snapshot-view";

const at = new Date("2026-10-02T12:00:00.000Z");
const film = {
  title: "A",
  year: 2020,
  link: "https://letterboxd.com/onur/film/a/",
  poster: "",
  rating: "★★★",
  ratingValue: 3,
  watchedDate: "2026-10-01",
  date: "2026-10-01T10:00:00.000Z",
};
const snapshot = (payload: unknown) => ({
  source: "letterboxd" as const,
  payload,
  lastSuccessAt: at,
  lastAttemptAt: at,
  lastError: null,
  itemCount: 1,
});

describe("toSourceView", () => {
  it("returns the empty shape when there is no snapshot", () => {
    expect(toSourceView(letterboxd, null)).toEqual({ data: [], lastSuccessAt: null });
  });

  it("returns validated data with an ISO sync time", () => {
    expect(toSourceView(letterboxd, snapshot([film]))).toEqual({
      data: [film],
      lastSuccessAt: "2026-10-02T12:00:00.000Z",
    });
  });

  it("fails soft when the payload no longer matches the schema", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(toSourceView(letterboxd, snapshot([{ title: 1 }]))).toEqual({
      data: [],
      lastSuccessAt: null,
    });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
