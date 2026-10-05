import type { Metadata } from "next";
import { FilmsArchive } from "@/components/life/archive/films-archive";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata("Films");

export default function FilmsPage() {
  return <FilmsArchive year={null} />;
}
