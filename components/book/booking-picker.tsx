"use client";

import { type MouseEvent, useSyncExternalStore } from "react";
import { type Booking, calUrl, typeFromHash } from "@/content/booking";
import { CalEmbed } from "./cal-embed";

// The chosen call type lives only in the URL hash (#role, #project,
// #mentoring), so /book/ stays one static HTML and a link can open a type.
// replaceState doesn't fire hashchange, so choose() notifies the store itself.
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("hashchange", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("hashchange", listener);
  };
}

// Replace, not push: Back leaves /book/ instead of stepping through choices.
function choose(id: string) {
  window.history.replaceState(null, "", `#${id}`);
  for (const listener of listeners) listener();
}

const noop = () => () => {};

export function BookingPicker({ config }: { config: Booking }) {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => "");
  // Before hydration (and without JavaScript) "Choose" links straight to cal.com.
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const selected = typeFromHash(hash, config);

  return (
    <ul className="type-body">
      {config.types.map((type) => {
        const on = selected?.id === type.id;
        const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
          if (!hydrated || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          choose(type.id);
        };
        return (
          <li key={type.id} className="border-t border-line py-3 first:border-t-0 first:pt-0">
            <div className="flex items-baseline justify-between gap-4">
              <div className="min-w-0">
                <span className={on ? "text-accent" : "text-fg"}>{type.title}</span> <span className="text-fg-muted">· {type.minutes} min</span>
                <p className="text-fg-soft">{type.description}</p>
              </div>
              {on ? (
                <span className="shrink-0 type-meta text-fg-muted">Selected</span>
              ) : (
                <a
                  href={hydrated ? `#${type.id}` : calUrl(type, config)}
                  onClick={onClick}
                  aria-label={`Choose ${type.title}`}
                  className="group inline shrink-0 type-meta text-accent"
                >
                  <span className="group-hover:underline group-hover:underline-offset-[0.2em]">Choose</span>
                  <span aria-hidden="true">{" →"}</span>
                </a>
              )}
            </div>
            {on ? (
              <div className="mt-3">
                <CalEmbed type={type} config={config} />
                <p className="mt-2 type-meta text-fg-muted">
                  Trouble loading?{" "}
                  <a href={calUrl(type, config)} rel="noopener noreferrer" className="hover:underline hover:underline-offset-[0.2em]">
                    Open on cal.com{" ↗"}
                  </a>
                </p>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
