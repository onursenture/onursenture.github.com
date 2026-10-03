import type { Metadata } from "next";
import { site } from "./site";

// Shared Open Graph and Twitter defaults. There is no default image: pages
// without a real one get a text-only summary card.
export const OPEN_GRAPH_DEFAULTS = {
  siteName: site.title,
  locale: "en_US",
  type: "website",
} as const;

export const TWITTER_DEFAULTS = { card: "summary" } as const;

// The one title format: the root layout's template and pageMetadata's Open
// Graph/Twitter titles both come from here.
export const TITLE_TEMPLATE = `%s · ${site.title}`;

export function fullTitle(title: string): string {
  return TITLE_TEMPLATE.replace("%s", title);
}

// Next replaces a parent's `openGraph` / `twitter` with the page's instead of
// merging them, so pages build their metadata here, on top of the defaults.
export function pageMetadata(title: string, extra: Metadata = {}): Metadata {
  const fullTitleText = fullTitle(title);
  return {
    ...extra,
    title,
    openGraph: { ...OPEN_GRAPH_DEFAULTS, title: fullTitleText, ...extra.openGraph },
    twitter: { ...TWITTER_DEFAULTS, title: fullTitleText, ...extra.twitter },
  };
}
