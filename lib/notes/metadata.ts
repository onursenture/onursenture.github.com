import type { Metadata } from "next";
import { renditionUrl } from "@/lib/images/plan";
import { pageMetadata } from "@/lib/metadata";
import type { PublishedNote } from "./types";
import { canonicalPath, noteTitle } from "./views";

// A note page's metadata (spec §3.4): titled by its text, canonical on its
// side, and a large card with the first image's largest JPEG when it has
// images (social crawlers don't reliably render AVIF).
export function noteMetadata(note: PublishedNote): Metadata {
  const title = `${noteTitle(note)} · Notes`;
  const description = note.text.trim() || noteTitle(note);
  const alternates = { canonical: canonicalPath(note) };
  const first = note.embed?.kind === "images" ? note.embed.images[0] : undefined;
  if (!first) {
    return pageMetadata(title, { description, alternates, openGraph: { type: "article", description } });
  }
  const ogImage = { url: renditionUrl(first.key, first.width, "jpg", first.baseUrl), width: first.width, height: first.height, alt: first.alt };
  return pageMetadata(title, {
    description,
    alternates,
    openGraph: { type: "article", description, images: [ogImage] },
    twitter: { card: "summary_large_image", images: [ogImage.url] },
  });
}
