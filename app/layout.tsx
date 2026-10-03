import type { Metadata } from "next";
import { Fragment_Mono } from "next/font/google";
import { ViewHistoryGuard } from "@/components/view-toggle";
import { OPEN_GRAPH_DEFAULTS, TWITTER_DEFAULTS } from "@/lib/metadata";
import { site } from "@/lib/site";
import { themeScript } from "@/lib/view/theme";
import "./globals.css";

// Self-hosted at build time; exposed as --font-fragment-mono, which
// globals.css maps to --font-mono.
const fragmentMono = Fragment_Mono({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-fragment-mono",
});

// Neue Haas Grotesk Display and Text come from this Adobe Fonts web project.
const ADOBE_FONTS_KIT = "https://use.typekit.net/jgu1ygn.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s · ${site.title}` },
  // Pages that set their own openGraph/twitter use pageMetadata() to keep these.
  openGraph: { ...OPEN_GRAPH_DEFAULTS, title: site.title },
  twitter: { ...TWITTER_DEFAULTS, title: site.title },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme is set by themeScript before hydration, so React must not
    // complain that the server HTML lacked it.
    <html lang="en" className={fragmentMono.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://use.typekit.net" crossOrigin="" />
        <link rel="preconnect" href="https://p.typekit.net" crossOrigin="" />
        <link rel="stylesheet" href={ADOBE_FONTS_KIT} />
      </head>
      <body>
        {/* Here, not under app/[view]: a view switch hides that layout, which
            would drop the listener for a moment. */}
        <ViewHistoryGuard />
        {children}
      </body>
    </html>
  );
}
