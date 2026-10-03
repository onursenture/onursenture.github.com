import { describe, expect, it } from "vitest";
import { runTypewriter, type Scheduler } from "@/lib/life/typewriter";

// A manual clock: `advance(ms)` runs the pending frame callback at that time.
function fakeScheduler() {
  let time = 0;
  let nextId = 1;
  const pending = new Map<number, (now: number) => void>();
  const scheduler: Scheduler = {
    now: () => time,
    request: (cb) => {
      pending.set(nextId, cb);
      return nextId++;
    },
    cancel: (id) => {
      pending.delete(id);
    },
  };
  return {
    scheduler,
    advance(ms: number) {
      time += ms;
      for (const [id, cb] of [...pending]) {
        pending.delete(id);
        cb(time);
      }
    },
  };
}

describe("runTypewriter", () => {
  it("grows the count, then reports null when done", () => {
    const clock = fakeScheduler();
    const seen: Array<number | null> = [];
    runTypewriter(100, 1000, (n) => seen.push(n), clock.scheduler);
    clock.advance(500);
    clock.advance(500);
    expect(seen).toEqual([50, null]);
  });

  it("restarts after a cancel and still completes (Strict Mode mount, cleanup, mount)", () => {
    const clock = fakeScheduler();
    const seen: Array<number | null> = [];
    const onProgress = (n: number | null) => seen.push(n);
    // First effect run is cancelled by the cleanup before its first frame...
    runTypewriter(100, 1000, onProgress, clock.scheduler)();
    // ...the second run must not be blocked by anything the first consumed.
    runTypewriter(100, 1000, onProgress, clock.scheduler);
    clock.advance(500);
    clock.advance(500);
    expect(seen.at(-1)).toBeNull();
  });
});
