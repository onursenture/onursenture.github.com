import { describe, expect, it } from "vitest";
import { fetchLinkCard, parseLinkCard } from "@/lib/notes/link-card";

const html = `<!doctype html><html><head>
<title>Fallback title</title>
<meta property="og:title" content="ATProto, POSSE, and Personal Sites">
<meta property="og:description" content="Using the AT Protocol for POSSE.">
<meta property="og:site_name" content="Steve Simkins">
</head><body></body></html>`;

function stub(body: string, init: { status?: number; type?: string } = {}): typeof fetch {
  return (async () => new Response(body, { status: init.status ?? 200, headers: { "content-type": init.type ?? "text/html; charset=utf-8" } })) as typeof fetch;
}

describe("parseLinkCard", () => {
  it("reads Open Graph tags", () => {
    expect(parseLinkCard(html, "https://stevedylan.dev/posts/x/")).toEqual({
      kind: "link",
      url: "https://stevedylan.dev/posts/x/",
      title: "ATProto, POSSE, and Personal Sites",
      description: "Using the AT Protocol for POSSE.",
      siteName: "Steve Simkins",
    });
  });

  it("falls back to <title>, the description meta and the host", () => {
    const plain = `<html><head><title> Plain </title><meta name="description" content="Desc"></head></html>`;
    expect(parseLinkCard(plain, "https://www.example.com/a")).toEqual({ kind: "link", url: "https://www.example.com/a", title: "Plain", description: "Desc", siteName: "example.com" });
  });
});

describe("fetchLinkCard", () => {
  it("fetches and parses an HTML page", async () => {
    expect(await fetchLinkCard("https://stevedylan.dev/posts/x/", stub(html))).toMatchObject({ title: "ATProto, POSSE, and Personal Sites" });
  });

  it("returns a bare card when the page fails or isn't HTML, so saving still works", async () => {
    const bare = { kind: "link", url: "https://w00f.org/a", title: "", description: "", siteName: "w00f.org" };
    expect(await fetchLinkCard("https://w00f.org/a", stub("nope", { status: 500 }))).toEqual(bare);
    expect(await fetchLinkCard("https://w00f.org/a", stub("{}", { type: "application/json" }))).toEqual(bare);
    expect(await fetchLinkCard("https://w00f.org/a", (async () => Promise.reject(new Error("offline"))) as typeof fetch)).toEqual(bare);
  });

  it("refuses non-http(s) and malformed URLs", async () => {
    expect(await fetchLinkCard("javascript:alert(1)", stub(html))).toBeNull();
    expect(await fetchLinkCard("not a url", stub(html))).toBeNull();
  });
});
