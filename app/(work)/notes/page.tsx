import type { Metadata } from "next";
import { NotesIndex } from "@/components/notes/notes-index";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata("Notes");

export default function NotesPage() {
  return <NotesIndex side="work" page={1} />;
}
