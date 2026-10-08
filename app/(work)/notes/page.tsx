import type { Metadata } from "next";
import { NotesIndex } from "@/components/notes/notes-index";
import { DESCRIPTIONS } from "@/content/descriptions";
import { describedMetadata } from "@/lib/metadata";

export const metadata: Metadata = describedMetadata("Notes", DESCRIPTIONS.notes);

export default function NotesPage() {
  return <NotesIndex side="work" page={1} />;
}
