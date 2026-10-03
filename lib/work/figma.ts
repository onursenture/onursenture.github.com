import type { FigmaRef } from "@/content/work/types";

// Figma's URLs use node-id=12-345; its API uses 12:345.
export function normalizeNodeId(id: string): string {
  return id.trim().replace(/-/g, ":");
}

function dashed(nodeId: string): string {
  return nodeId.replace(/:/g, "-");
}

export function figmaDesignUrl(ref: FigmaRef): string {
  return `https://www.figma.com/design/${ref.fileKey}?node-id=${dashed(ref.nodeId)}`;
}

// Loaded only after a click (MediaViewer), so Figma's script and cookies
// reach only visitors who ask for them.
export function figmaEmbedUrl(ref: FigmaRef): string {
  return `https://embed.figma.com/design/${ref.fileKey}?node-id=${dashed(ref.nodeId)}&embed-host=onursenture`;
}
