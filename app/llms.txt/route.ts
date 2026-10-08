import { cacheLife, cacheTag } from "next/cache";
import { buildLlmsTxt } from "@/lib/agent/llms-txt";
import { agentInput } from "@/lib/agent/read";
import { CONTENT_TAG } from "@/lib/content/read";

// Cached like /onur.md: the content tag, minutes on the repo fallback, else days.
async function llmsTxt(): Promise<string> {
  "use cache";
  cacheTag(CONTENT_TAG);
  const { input, fallback } = await agentInput();
  if (fallback) cacheLife("minutes");
  else cacheLife("days");
  return buildLlmsTxt(input);
}

export async function GET() {
  return new Response(await llmsTxt(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
