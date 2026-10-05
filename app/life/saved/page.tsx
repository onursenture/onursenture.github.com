import type { Metadata } from "next";
import { SavedArchive } from "@/components/life/archive/saved-archive";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata("Saved");

export default function SavedPage() {
  return <SavedArchive />;
}
