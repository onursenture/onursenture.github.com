import { HomeSite } from "@/components/home/home-site";
import { getPublishedNotes } from "@/lib/notes/read";
import { onSide } from "@/lib/notes/views";
import { getHomeContent } from "@/lib/work";

export default async function HomePage() {
  const [content, notes] = await Promise.all([getHomeContent(), getPublishedNotes()]);
  return <HomeSite content={content} notes={onSide(notes, "work").slice(0, 3)} />;
}
