import { findImage } from "@/lib/images/manifest";
import { tidFromTime } from "./tid";
import type { NoteImage, NoteLang, NoteSide, NoteEmbed, PublishedNote } from "./types";

// Fixture mode (SOURCE_FIXTURES=1): a fixed set of published notes so the
// Notes pages can be built and tested without a database. Two Work pages
// (33 Work-side notes), 2026 and 2025, both sides, images, a link card and a
// Turkish note. Dev and CI only.

function image(key: string, alt: string): NoteImage {
  const entry = findImage(key);
  if (!entry) throw new Error(`fixture image ${key} is not in the manifest`);
  return { key, alt, width: entry.width, height: entry.height, widths: entry.widths };
}

function note(n: number, at: string, side: NoteSide, text: string, embed: NoteEmbed = null, lang: NoteLang = "en"): PublishedNote {
  const publishedAt = new Date(at).toISOString();
  return {
    id: `fixture-${n}`,
    tid: tidFromTime(Date.parse(at), 0, n),
    text,
    side,
    lang,
    embed,
    status: "published",
    publishAt: null,
    publishedAt,
    createdAt: publishedAt,
    updatedAt: publishedAt,
  };
}

export function fixtureNotes(): PublishedNote[] {
  const notes: PublishedNote[] = [
    note(1, "2026-10-04T11:00:00.000Z", "work", "Shipped /resume.pdf. It's rendered on the server from the same data as the page, so the paper copy can't drift from the site."),
    note(2, "2026-10-03T11:15:00.000Z", "both", "Notes editor, first pass. The counter counts graphemes, not characters: 👍🏽 is one.", {
      kind: "images",
      images: [image("fixtures/photo-landscape", "A fixture photo"), image("fixtures/photo-wide", "Another fixture photo")],
    }),
    note(3, "2026-10-02T16:30:00.000Z", "life", "Yui found the one sunny square on the balcony again.", { kind: "images", images: [image("fixtures/photo-landscape", "A fixture photo")] }),
    note(4, "2026-09-30T08:00:00.000Z", "work", "Good walkthrough of publishing a personal site to the AT Protocol, via @w00f.org #atproto", {
      kind: "link",
      url: "https://stevedylan.dev/posts/using-atproto-for-posse/",
      title: "ATProto, POSSE, and Personal Sites",
      description: "",
      siteName: "stevedylan.dev",
    }),
    note(5, "2026-09-20T09:00:00.000Z", "life", "Bugün Ankara'da ilk yağmur.", null, "tr"),
  ];
  // 30 short Work notes, one per day back from Dec 20, 2025.
  for (let i = 0; i < 30; i++) {
    notes.push(note(6 + i, new Date(Date.UTC(2025, 11, 20 - i, 9)).toISOString(), "work", `Fixture note ${i + 1}.`));
  }
  return notes;
}
