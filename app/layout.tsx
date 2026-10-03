import type { Metadata } from "next";
import { Doto, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { OPEN_GRAPH_DEFAULTS, TITLE_TEMPLATE, TWITTER_DEFAULTS } from "@/lib/metadata";
import { site } from "@/lib/site";
import { themeScript } from "@/lib/theme/theme";
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
  weight: ["500", "600"],
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
    // data-theme is set by themeScript before hydration, so React must not
    // complain that the server HTML lacked it.
    <html
      lang="en"
      className={`${plexMono.variable} ${plexSans.variable} ${doto.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
