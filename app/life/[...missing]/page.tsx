import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pageMetadata } from "@/lib/metadata";

// Unknown /life/... URLs 404 inside the Life layout. Cache Components needs
// at least one prerendered param; real misses render on demand.
export function generateStaticParams() {
  return [{ missing: ["not-found"] }];
}

// The 404's title ("Not found · Onur Senture"); Next renders this page's
// metadata with the not-found boundary.
export const metadata: Metadata = pageMetadata("Not found");

export default function MissingLifePage() {
  notFound();
}
