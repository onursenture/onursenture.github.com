import { ORGS, type OrgId } from "@/content/orgs";
import type { BioSegment } from "@/content/profile";

// The bio editor's text form (spec §2.4): an organisation mark is {orgId}.
// Unknown tokens stay as plain text; validateSite reports them on publish.

export function bioToText(segments: BioSegment[]): string {
  return segments.map((segment) => (typeof segment === "string" ? segment : `{${segment.org}}`)).join("");
}

export function textToBio(text: string): BioSegment[] {
  const segments: BioSegment[] = [];
  let last = 0;
  for (const match of text.matchAll(/\{([a-z]+)\}/g)) {
    // Own keys only: "constructor" is `in` ORGS through the prototype.
    if (!Object.hasOwn(ORGS, match[1])) continue;
    if (match.index > last) segments.push(text.slice(last, match.index));
    segments.push({ org: match[1] as OrgId });
    last = match.index + match[0].length;
  }
  if (last < text.length) segments.push(text.slice(last));
  return segments;
}
