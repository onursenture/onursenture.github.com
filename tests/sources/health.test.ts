import { describe, expect, it } from "vitest";
import { type SourceStatus, sourceHealth, summarizeHealth } from "@/lib/sources/health";

const now = Date.parse("2026-10-03T12:00:00.000Z");
const ago = (minutes: number) => new Date(now - minutes * 60_000).toISOString();

describe("sourceHealth", () => {
  it("is ok up to and including twice the interval", () => {
    expect(sourceHealth(ago(0), 60, now)).toBe("ok");
    expect(sourceHealth(ago(120), 60, now)).toBe("ok");
  });

  it("is late past twice the interval", () => {
    expect(sourceHealth(new Date(now - 120 * 60_000 - 1).toISOString(), 60, now)).toBe("late");
    expect(sourceHealth(ago(361), 180, now)).toBe("late");
  });

  it("is never without a usable sync time", () => {
    expect(sourceHealth(null, 60, now)).toBe("never");
    expect(sourceHealth("nope", 60, now)).toBe("never");
  });

  it("counts any past sync as ok before the client knows the time", () => {
    expect(sourceHealth(ago(10_000), 60, null)).toBe("ok");
    expect(sourceHealth(null, 60, null)).toBe("never");
  });
});

describe("summarizeHealth", () => {
  const status = (id: SourceStatus["id"], lastSuccessAt: string | null): SourceStatus => ({
    id,
    label: id,
    intervalMinutes: 60,
    lastSuccessAt,
  });

  it("counts ok sources and finds the latest sync", () => {
    const summary = summarizeHealth(
      [status("github", ago(5)), status("instapaper", ago(500)), status("writing", null)],
      now,
    );
    expect(summary).toEqual({ ok: 1, total: 3, latest: ago(5), overall: "late" });
  });

  it("is ok when all are ok and never when none ever synced", () => {
    expect(summarizeHealth([status("github", ago(5))], now).overall).toBe("ok");
    expect(summarizeHealth([status("github", null), status("writing", null)], now)).toEqual({
      ok: 0,
      total: 2,
      latest: null,
      overall: "never",
    });
  });
});
