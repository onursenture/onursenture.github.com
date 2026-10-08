import type { Metadata } from "next";
import { SavedArchive } from "@/components/life/archive/saved-archive";
import { DESCRIPTIONS } from "@/content/descriptions";
import { describedMetadata } from "@/lib/metadata";

export const metadata: Metadata = describedMetadata("Saved", DESCRIPTIONS.saved);

export default function SavedPage() {
  return <SavedArchive />;
}
