import type { Metadata } from "next";
import { FilmsArchive } from "@/components/life/archive/films-archive";
import { DESCRIPTIONS } from "@/content/descriptions";
import { describedMetadata } from "@/lib/metadata";

export const metadata: Metadata = describedMetadata("Films", DESCRIPTIONS.films);

export default function FilmsPage() {
  return <FilmsArchive year={null} />;
}
