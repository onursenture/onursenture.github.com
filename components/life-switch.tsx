"use client";

import { useRouter } from "next/navigation";
import { type KeyboardEvent, type MouseEvent, addTransitionType, startTransition } from "react";
import { LIFE_ENTER, LIFE_EXIT } from "@/lib/side";
import { cx } from "@/lib/cx";
import { markBoot } from "./life/boot-flag";

// The switch between the Work side (/) and the Life side (/life/). It is a
// real link, so it works without JavaScript and modified clicks open a tab;
// a plain click navigates with the side-change transition.
export function LifeSwitch({ on }: { on: boolean }) {
  const router = useRouter();
  const href = on ? "/" : "/life/";

  function go() {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!on && !reduceMotion) markBoot();
    startTransition(() => {
      if (!reduceMotion) addTransitionType(on ? LIFE_EXIT : LIFE_ENTER);
      router.push(href);
    });
  }

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    go();
  }

  // role="switch" toggles on Space; Enter follows the link (onClick).
  function onKeyDown(event: KeyboardEvent<HTMLAnchorElement>) {
    if (event.key !== " ") return;
    event.preventDefault();
    go();
  }

  return (
    <a
      href={href}
      role="switch"
      aria-checked={on}
      data-testid="life-switch"
      onClick={onClick}
      onKeyDown={onKeyDown}
      className="group inline-flex items-center gap-2 type-meta text-fg-muted hover:text-fg"
    >
      <span>Life</span>
      <span
        aria-hidden="true"
        className={cx("relative h-[22px] w-10 rounded-full border transition-colors", on ? "border-accent bg-accent" : "bg-line")}
      >
        <span
          className={cx(
            "absolute top-px size-[18px] rounded-full border bg-[#fff] transition-[left]",
            on ? "left-[19px]" : "left-px",
          )}
        />
      </span>
    </a>
  );
}
