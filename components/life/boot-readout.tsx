"use client";

import Link from "next/link";
import { useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { LiveClock } from "@/components/ui/live-clock";
import { isExternal } from "@/components/ui/text-link";
import { profile } from "@/content/profile";
import { type ReadoutLine, readoutText } from "@/lib/life/readout";
import { runTypewriter } from "@/lib/life/typewriter";
import { peekBoot, takeBoot } from "./boot-flag";

const BOOT = ["Booting w00f...", "Human detected."];
const DURATION = 1500;

function reducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const noopSubscribe = () => () => {};

// Whether a fresh boot flag asks for typing. Hydration uses the server
// snapshot (false), so a flag left over on a direct load is ignored and the
// markup matches the server HTML; only a client render reads sessionStorage.
function useBootPending(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => peekBoot() && !reducedMotion(),
    () => false,
  );
}

// The Life boot readout. Server HTML is the complete, static text. After a
// client navigation from the Life switch (boot flag set), the boot and data
// lines type in over ~1.5s, ending on a blinking cursor. Next keeps a left
// route's tree mounted (hidden), so entering Life again re-runs the effect on
// the same instance: a fresh flag then restarts the typing. Reduced motion:
// static, no blink.
export function BootReadout({ lines }: { lines: ReadoutLine[] }) {
  const texts = useMemo(() => [...BOOT, ...lines.map(readoutText)], [lines]);
  const total = texts.reduce((sum, t) => sum + t.length, 0);
  const bootPending = useBootPending();
  // null = show everything. A client navigation (no hydration) starts at 0
  // when the flag is set, so the full text never flashes first.
  const [shown, setShown] = useState<number | null>(bootPending ? 0 : null);

  const ranBefore = useRef(false);

  // A layout effect, so a re-shown route restarts before it is painted.
  useLayoutEffect(() => {
    // Clear the one-shot flag. Strict Mode re-runs this effect after a cleanup,
    // when the flag is already gone, so a pending typing is decided from state;
    // a re-run restarts the typing and still completes.
    const flagged = takeBoot() && !reducedMotion();
    // Only a later run of the same instance (a re-show) may start typing from
    // the flag; the first run follows the initial state, so a flag that is
    // fresh during hydration stays ignored.
    const reshown = ranBefore.current && flagged;
    ranBefore.current = true;
    if (shown === null) {
      if (!reshown) return;
      // The kept-alive tree was re-shown by the Life switch: type again.
      setShown(0);
    }
    return runTypewriter(total, DURATION, setShown, {
      now: () => performance.now(),
      request: (cb) => requestAnimationFrame(cb),
      cancel: (id) => cancelAnimationFrame(id),
    });
    // `shown` is only read for whether typing is pending; restart on `total`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  // How much of text #index is visible.
  let budget = shown ?? Number.POSITIVE_INFINITY;
  const visible = texts.map((t) => {
    const n = Math.max(0, Math.min(t.length, budget));
    budget -= t.length;
    return n;
  });
  const typing = shown !== null;

  return (
    <div className="min-w-0 type-boot">
      <p>
        Local time: [<LiveClock timeZone={profile.location.timeZone} place={profile.location.place} /> GMT+3]{" "}
        {profile.location.place}
      </p>
      <div className="mt-6 text-fg-muted">
        {BOOT.map((t, i) => (
          <p key={t}>{t.slice(0, visible[i]) || "\u00a0"}</p>
        ))}
      </div>
      <ul className="mt-6">
        {lines.map((line, i) => {
          const n = visible[BOOT.length + i];
          const full = readoutText(line);
          const head = `${line.label}: `;
          const value = full.slice(head.length, n).slice(0, line.value.length);
          const rest = full.slice(head.length + line.value.length, n);
          const linkClass = "underline decoration-fg-muted underline-offset-[3px] hover:decoration-fg";
          const content = (
            <>
              {head.slice(0, n)}
              {n > head.length ? (
                line.href ? (
                  isExternal(line.href) ? (
                    <a href={line.href} rel="noopener noreferrer" className={linkClass}>
                      {value}
                    </a>
                  ) : (
                    <Link href={line.href} className={linkClass}>
                      {value}
                    </Link>
                  )
                ) : (
                  value
                )
              ) : null}
              {rest ? <span className="text-fg-muted">{rest}</span> : null}
            </>
          );
          // One line each: a long line is cut with an ellipsis (`truncate`), visually
          // only; the full text stays in the DOM for screen readers.
          if (!typing) {
            return (
              <li key={line.key} className="truncate">
                {content}
              </li>
            );
          }
          // While typing, the complete line sits invisible in flow so its wrapped
          // height is reserved (one line, like the final text); the typed text is
          // overlaid on it. No layout jump.
          return (
            <li key={line.key} className="relative truncate">
              <span aria-hidden="true" className="invisible">
                {full}
              </span>
              <span className="absolute inset-0 truncate">{content}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-6">
        idle <span aria-hidden="true" className="boot-cursor inline-block h-[15px] w-2 translate-y-[3px] bg-fg" />
      </p>
    </div>
  );
}
