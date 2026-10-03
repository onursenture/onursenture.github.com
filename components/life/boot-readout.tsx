"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LiveClock } from "@/components/ui/live-clock";
import { isExternal } from "@/components/ui/text-link";
import type { ReadoutLine } from "@/lib/life/readout";
import { peekBoot, takeBoot } from "./boot-flag";

const BOOT = ["Booting w00f...", "Human detected."];
const DURATION = 1500;

function lineText(line: ReadoutLine): string {
  return `${line.label}: ${line.value}${line.detail ? ` ${line.detail}` : ""}`;
}

function reducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// The Life boot readout. Server HTML is the complete, static text. After a
// client navigation from the Life switch (boot flag set), the boot and data
// lines type in over ~1.5s, ending on a blinking cursor. Reduced motion:
// static, no blink.
export function BootReadout({ lines }: { lines: ReadoutLine[] }) {
  const texts = useMemo(() => [...BOOT, ...lines.map(lineText)], [lines]);
  const total = texts.reduce((sum, t) => sum + t.length, 0);
  // null = show everything. A client navigation (no hydration) starts at 0
  // when the flag is set, so the full text never flashes first.
  const [shown, setShown] = useState<number | null>(() =>
    typeof window !== "undefined" && peekBoot() && !reducedMotion() ? 0 : null,
  );

  useEffect(() => {
    if (!takeBoot() || shown === null) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / DURATION);
      setShown(progress < 1 ? Math.round(progress * total) : null);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // Runs once on mount; `shown` is only read for its initial value.
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
    <div className="type-boot">
      <p>
        Local time: [<LiveClock timeZone="Europe/Istanbul" place="Ankara" /> GMT+3] Ankara
      </p>
      <div className="mt-6 text-fg-muted">
        {BOOT.map((t, i) => (
          <p key={t}>{t.slice(0, visible[i]) || "\u00a0"}</p>
        ))}
      </div>
      <ul className="mt-6">
        {lines.map((line, i) => {
          const n = visible[BOOT.length + i];
          const full = lineText(line);
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
          if (!typing) return <li key={line.key}>{content}</li>;
          // While typing, the complete line sits invisible in flow so its wrapped
          // height is reserved; the typed text is overlaid on it. No layout jump.
          return (
            <li key={line.key} className="relative">
              <span aria-hidden="true" className="invisible">
                {full}
              </span>
              <span className="absolute inset-0">{content}</span>
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
