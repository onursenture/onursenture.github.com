// cal.com's official embed loader (the vanilla snippet from cal.com's Embed
// tab, ported to TypeScript). Calling it queues commands until
// app.cal.com/embed/embed.js loads and injects that script on the first call
// only, so /book/ makes no cal.com request before a call type is chosen.
export const CAL_ORIGIN = "https://app.cal.com";
export const CAL_SCRIPT = `${CAL_ORIGIN}/embed/embed.js`;

type Args = unknown[];

interface Queued {
  (...args: Args): void;
  q: Args[];
}

export interface CalGlobal extends Queued {
  loaded: boolean;
  ns: Record<string, Queued>;
}

declare global {
  interface Window {
    Cal?: CalGlobal;
  }
}

export function loadCal(): CalGlobal {
  if (window.Cal) return window.Cal;
  const queued = (): Queued => {
    const api = ((...args: Args) => {
      api.q.push(args);
    }) as Queued;
    api.q = [];
    return api;
  };
  const cal = ((...args: Args) => {
    if (!cal.loaded) {
      const script = document.createElement("script");
      script.src = CAL_SCRIPT;
      script.async = true;
      document.head.appendChild(script);
      cal.loaded = true;
    }
    const [command, namespace] = args;
    if (command === "init" && typeof namespace === "string") {
      cal.ns[namespace] ??= queued();
      cal.ns[namespace].q.push(args);
      cal.q.push(["initNamespace", namespace]);
      return;
    }
    cal.q.push(args);
  }) as CalGlobal;
  cal.q = [];
  cal.ns = {};
  cal.loaded = false;
  window.Cal = cal;
  return cal;
}
