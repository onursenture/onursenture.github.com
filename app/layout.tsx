import type { Metadata } from "next";
import { Doto, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { OPEN_GRAPH_DEFAULTS, TITLE_TEMPLATE, TWITTER_DEFAULTS } from "@/lib/metadata";
import { site } from "@/lib/site";
import "./globals.css";

// Self-hosted at build time. globals.css maps these variables to
// --font-mono, --font-sans and --font-name. latin-ext covers Turkish.
const plexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-plex-mono",
});
const plexSans = IBM_Plex_Sans({
  weight: ["400", "500", "600"],
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-plex-sans",
});
const doto = Doto({
  weight: "900",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-doto",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: TITLE_TEMPLATE },
  // Pages that set their own openGraph/twitter use pageMetadata() to keep these.
  openGraph: { ...OPEN_GRAPH_DEFAULTS, title: site.title },
  twitter: { ...TWITTER_DEFAULTS, title: site.title },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${plexMono.variable} ${plexSans.variable} ${doto.variable}`}>
      <head>
        {/* The Markdown profile for agents (Sprint 11b). In <head> directly, not
            metadata.alternates, which a page's own alternates would replace. */}
        <link rel="alternate" type="text/markdown" href="/onur.md" title="Onur Senture in Markdown" />
      </head>
      <body>{children}</body>
    </html>
  );
}
