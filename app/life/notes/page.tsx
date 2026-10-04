import type { Metadata } from "next";
import { NotesIndex } from "@/components/notes/notes-index";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata("Life notes");

export default function LifeNotesPage() {
  return <NotesIndex side="life" page={1} />;
}
