import type { Metadata } from "next";
import { HomeSite } from "@/components/home/home-site";
import { DESCRIPTIONS } from "@/content/descriptions";
import { OPEN_GRAPH_DEFAULTS } from "@/lib/metadata";
import { getPublishedNotes } from "@/lib/notes/read";
import { onSide } from "@/lib/notes/views";
import { site } from "@/lib/site";
import { getHomeContent } from "@/lib/work";

// The home keeps the bare site title; Next replaces the layout's openGraph,
// so it is rebuilt here with the description.
export const metadata: Metadata = {
  description: DESCRIPTIONS.home,
  openGraph: { ...OPEN_GRAPH_DEFAULTS, title: site.title, description: DESCRIPTIONS.home },
};

export default async function HomePage() {
  const [content, notes] = await Promise.all([getHomeContent(), getPublishedNotes()]);
  return <HomeSite content={content} notes={onSide(notes, "work").slice(0, 3)} />;
}
