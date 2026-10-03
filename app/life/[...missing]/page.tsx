import { notFound } from "next/navigation";

// Unknown /life/... URLs 404 inside the Life layout. Cache Components needs
// at least one prerendered param; real misses render on demand.
export function generateStaticParams() {
  return [{ missing: ["not-found"] }];
}

export default function MissingLifePage() {
  notFound();
}
