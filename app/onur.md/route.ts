import { cacheLife, cacheTag } from "next/cache";
import { buildOnurMd } from "@/lib/agent/onur-md";
import { agentInput } from "@/lib/agent/read";
import { CONTENT_TAG } from "@/lib/content/read";

// Prerendered at build and regenerated when an admin publish revalidates the
// content tag. Its own cacheLife wins over the content read's, so it follows
// the read's fallback: minutes while the repo stands in, days otherwise.
async function onurMd(): Promise<string> {
  "use cache";
  cacheTag(CONTENT_TAG);
  const { input, fallback } = await agentInput();
  if (fallback) cacheLife("minutes");
  else cacheLife("days");
  return buildOnurMd(input);
}

export async function GET() {
  return new Response(await onurMd(), { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
