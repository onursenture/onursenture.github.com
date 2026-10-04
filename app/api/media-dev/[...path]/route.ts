import { existsSync, readFileSync } from "node:fs";
import { getMediaStorage, uploadMode } from "@/lib/media/storage";

const TYPES: Record<string, string> = { avif: "image/avif", jpg: "image/jpeg" };

// Serves local renditions (next start only serves public/ files that existed
// at build time). 404 on Vercel and whenever Blob is configured.
export async function GET(_request: Request, { params }: RouteContext<"/api/media-dev/[...path]">) {
  if (uploadMode() !== "local") return new Response("Not found", { status: 404 });
  const { path } = await params;
  const file = getMediaStorage().resolveLocal(path.join("/"));
  const type = TYPES[path.at(-1)?.split(".").pop() ?? ""];
  if (!file || !type || !existsSync(file)) return new Response("Not found", { status: 404 });
  return new Response(readFileSync(file), { headers: { "content-type": type, "cache-control": "no-store" } });
}
