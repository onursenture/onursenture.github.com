import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pageMetadata } from "@/lib/metadata";

// Catches every URL no other page matches, so it 404s inside the Work layout
// (header and footer) instead of outside it. Cache Components needs
// at least one prerendered param; real misses render on demand.
export function generateStaticParams() {
  return [{ missing: ["not-found"] }];
}

// The 404's title ("Not found · Onur Senture"); Next renders this page's
// metadata with the not-found boundary.
export const metadata: Metadata = pageMetadata("Not found");

export default function MissingPage() {
  notFound();
}
