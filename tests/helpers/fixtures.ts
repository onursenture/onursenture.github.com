import { readFileSync } from "node:fs";
import { join } from "node:path";

export function fixture(name: string): string {
  return readFileSync(join(__dirname, "..", "fixtures", name), "utf8");
}

// A fetch stand-in that answers each URL from a map and 404s everything else.
export function fakeFetch(
  routes: Record<string, { status?: number; body: string }>,
): typeof globalThis.fetch {
  return (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    const route = routes[url];
    if (!route) return new Response("not found", { status: 404 });
    return new Response(route.body, { status: route.status ?? 200 });
  }) as typeof globalThis.fetch;
}
