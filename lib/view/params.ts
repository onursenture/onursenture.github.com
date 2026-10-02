import { notFound } from "next/navigation";
import { type View, isView } from "./views";

// Narrows the [view] route param. The proxy only ever rewrites to valid
// views, so anything else is a 404.
export function assertView(value: string): View {
  if (!isView(value)) notFound();
  return value;
}
