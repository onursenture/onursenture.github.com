import { notFound } from "next/navigation";

// Catches every URL no other page matches, so it 404s inside the Work layout
// (header and footer) instead of outside it. Cache Components needs
// at least one prerendered param; real misses render on demand.
export function generateStaticParams() {
  return [{ missing: ["not-found"] }];
}

export default function MissingPage() {
  notFound();
}
