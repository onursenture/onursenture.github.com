// Drives the boot readout's typewriter: reports a growing character count
// over `duration`, then `null` ("show everything"). Returns a cancel
// function. Restartable: starting again after a cancel begins from zero and
// still completes, which is what React Strict Mode and re-shown routes need.
export interface Scheduler {
  now: () => number;
  request: (cb: (now: number) => void) => number;
  cancel: (id: number) => void;
}

export function runTypewriter(
  total: number,
  duration: number,
  onProgress: (shown: number | null) => void,
  scheduler: Scheduler,
): () => void {
  let frame = 0;
  const start = scheduler.now();
  const tick = (now: number) => {
    const progress = Math.min(1, (now - start) / duration);
    onProgress(progress < 1 ? Math.round(progress * total) : null);
    if (progress < 1) frame = scheduler.request(tick);
  };
  frame = scheduler.request(tick);
  return () => scheduler.cancel(frame);
}
