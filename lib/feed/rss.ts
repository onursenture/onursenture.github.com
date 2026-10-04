import type { Photo } from "@/lib/content/photos";
import { type ImageEntry, renditionUrl } from "@/lib/images/plan";
import { noteSegments } from "@/lib/notes/facets";
import type { PublishedNote } from "@/lib/notes/types";
import { canonicalPath } from "@/lib/notes/views";

// /feed.xml (spec §3.6): every published note and every photo, newest first,
// at the old site's URL. Notes are description-only items (RSS 2.0 allows
// it); their HTML is the text with its links, then the images or the card.
// Server only (facets.ts).

export const FEED_LIMIT = 50;
const DESCRIPTION = "Notes and photos by Onur Senture.";

// Characters XML 1.0 forbids (control characters, U+FFFE, U+FFFF); one in a
// note would make the whole feed unparseable.
const ILLEGAL_XML = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g;

export function escapeXml(value: string): string {
  return value.replace(ILLEGAL_XML, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function absolute(siteUrl: string, url: string): string {
  return url.startsWith("/") ? `${siteUrl}${url}` : url;
}

// The largest rendition up to 1280px wide, as a JPEG (readers and AVIF don't mix).
function feedImage(siteUrl: string, key: string, entry: ImageEntry): string {
  const width = [...entry.widths].reverse().find((w) => w <= 1280) ?? entry.widths[0];
  return absolute(siteUrl, renditionUrl(key, width, "jpg", entry.baseUrl));
}

export function noteHtml(note: PublishedNote, siteUrl: string): string {
  const text = noteSegments(note.text)
    .map((segment) => {
      if (segment.kind === "link") return `<a href="${escapeXml(segment.href)}">${escapeXml(segment.text)}</a>`;
      if (segment.kind === "mention") return `<a href="https://bsky.app/profile/${escapeXml(segment.handle)}">${escapeXml(segment.text)}</a>`;
      return escapeXml(segment.text);
    })
    .join("")
    .replace(/\n/g, "<br>");
  const parts = text.trim() ? [`<p>${text}</p>`] : [];
  const embed = note.embed;
  if (embed?.kind === "images") {
    for (const image of embed.images) parts.push(`<p><img src="${escapeXml(feedImage(siteUrl, image.key, image))}" alt="${escapeXml(image.alt)}"></p>`);
  }
  if (embed?.kind === "link") parts.push(`<p><a href="${escapeXml(embed.url)}">${escapeXml(embed.title || embed.url)}</a></p>`);
  return parts.join("");
}

interface FeedItem {
  title: string | null;
  link: string;
  guid: string;
  guidIsPermaLink: boolean;
  description: string;
  date: string;
}

export interface FeedInput {
  siteUrl: string;
  title: string;
  notes: PublishedNote[];
  photos: { photo: Pick<Photo, "slug" | "title" | "date" | "image">; entry: ImageEntry }[];
}

export function buildFeed({ siteUrl, title, notes, photos }: FeedInput): string {
  const items: FeedItem[] = [
    ...notes.map((note) => ({
      title: null,
      link: `${siteUrl}${canonicalPath(note)}`,
      // Stable and side-independent, so Life→Both never duplicates the item in a reader.
      guid: `tag:onursenture.com,2026:note/${note.tid}`,
      guidIsPermaLink: false,
      description: noteHtml(note, siteUrl),
      date: note.publishedAt,
    })),
    ...photos.map(({ photo, entry }) => ({
      title: photo.title,
      link: `${siteUrl}/life/photos/${photo.slug}/`,
      guid: `${siteUrl}/life/photos/${photo.slug}/`,
      guidIsPermaLink: true,
      description: `<p><img src="${escapeXml(feedImage(siteUrl, photo.image, entry))}" alt="${escapeXml(photo.title)}"></p>`,
      date: `${photo.date}T00:00:00.000Z`,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, FEED_LIMIT);

  const rfc822 = (iso: string) => new Date(iso).toUTCString();
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "<channel>",
    `<title>${escapeXml(title)}</title>`,
    `<link>${siteUrl}/</link>`,
    `<description>${escapeXml(DESCRIPTION)}</description>`,
    "<language>en</language>",
    `<atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>`,
    // The newest item's date, not the build time, so an unchanged feed stays byte-identical.
    ...(items[0] ? [`<lastBuildDate>${rfc822(items[0].date)}</lastBuildDate>`] : []),
    ...items.map((item) =>
      [
        "<item>",
        item.title ? `<title>${escapeXml(item.title)}</title>` : "",
        `<link>${escapeXml(item.link)}</link>`,
        `<guid isPermaLink="${item.guidIsPermaLink}">${escapeXml(item.guid)}</guid>`,
        `<pubDate>${rfc822(item.date)}</pubDate>`,
        `<description>${escapeXml(item.description)}</description>`,
        "</item>",
      ].join(""),
    ),
    "</channel>",
    "</rss>",
  ];
  return `${lines.join("\n")}\n`;
}
