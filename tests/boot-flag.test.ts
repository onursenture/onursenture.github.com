import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { markBoot, peekBoot, takeBoot } from "@/components/life/boot-flag";

describe("boot flag", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    });
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("is set after markBoot, peek keeps it, take clears it", () => {
    markBoot();
    expect(peekBoot()).toBe(true);
    expect(peekBoot()).toBe(true);
    expect(takeBoot()).toBe(true);
    expect(peekBoot()).toBe(false);
  });

  it("expires, so a leftover flag cannot type on a later direct load", () => {
    markBoot();
    vi.setSystemTime(1_000_000 + 3001);
    expect(peekBoot()).toBe(false);
    expect(takeBoot()).toBe(false);
  });

  it("ignores a legacy non-timestamp value", () => {
    sessionStorage.setItem("life-boot", "1");
    expect(peekBoot()).toBe(false);
  });
});
