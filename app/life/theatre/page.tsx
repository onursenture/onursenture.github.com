import type { Metadata } from "next";
import { TheatreArchive } from "@/components/life/archive/theatre-archive";
import { DESCRIPTIONS } from "@/content/descriptions";
import { describedMetadata } from "@/lib/metadata";

export const metadata: Metadata = describedMetadata("Theatre", DESCRIPTIONS.theatre);

export default function TheatrePage() {
  return <TheatreArchive />;
}
