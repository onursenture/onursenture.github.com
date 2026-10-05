import type { Metadata } from "next";
import { TheatreArchive } from "@/components/life/archive/theatre-archive";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata("Theatre");

export default function TheatrePage() {
  return <TheatreArchive />;
}
