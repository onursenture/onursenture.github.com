import type { Metadata } from "next";
import { NotesIndex } from "@/components/notes/notes-index";
import { DESCRIPTIONS } from "@/content/descriptions";
import { describedMetadata } from "@/lib/metadata";

export const metadata: Metadata = describedMetadata("Life notes", DESCRIPTIONS.lifeNotes);

export default function LifeNotesPage() {
  return <NotesIndex side="life" page={1} />;
}
