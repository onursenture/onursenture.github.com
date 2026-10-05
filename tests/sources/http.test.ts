import { describe, expect, it } from "vitest";
import { HttpError, fetchJson, fetchText, httpUrl } from "@/lib/sources/http";

function recordingFetch(status = 200, body = "ok") {
  const calls: { url: string; headers: Headers }[] = [];
  const impl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), headers: new Headers(init?.headers) });
    return new Response(body, { status });
  }) as typeof globalThis.fetch;
  return { impl, calls };
}

describe("fetchText", () => {
  it("merges Headers instances and tuple arrays with the user agent", async () => {
    const { impl, calls } = recordingFetch();
    await fetchText(impl, "https://a.test/", { headers: new Headers({ "X-One": "1" }) });
    await fetchText(impl, "https://a.test/", { headers: [["X-Two", "2"]] });
    expect(calls[0].headers.get("x-one")).toBe("1");
    expect(calls[0].headers.get("user-agent")).toMatch(/onursenture/);
    expect(calls[1].headers.get("x-two")).toBe("2");
    expect(calls[1].headers.get("user-agent")).toMatch(/onursenture/);
  });

  it("throws an HttpError carrying the status", async () => {
    const { impl } = recordingFetch(404, "Not found");
    const error = await fetchText(impl, "https://a.test/x").catch((e) => e);
    expect(error).toBeInstanceOf(HttpError);
    expect(error.status).toBe(404);
    expect(error.message).toBe("https://a.test/x returned 404");
  });

  it("fetchJson keeps an explicit Accept and adds the user agent", async () => {
    const { impl, calls } = recordingFetch(200, "{}");
    await fetchJson(impl, "https://a.test/", { headers: { Accept: "text/plain" } });
    expect(calls[0].headers.get("accept")).toBe("text/plain");
    expect(calls[0].headers.get("user-agent")).toMatch(/onursenture/);
  });
});

describe("httpUrl", () => {
  it("keeps http and https URLs as given", () => {
    expect(httpUrl(" https://a.test/x?y=1 ")).toBe("https://a.test/x?y=1");
    expect(httpUrl("http://a.test")).toBe("http://a.test");
  });
  it("drops anything else", () => {
    for (const bad of ["javascript:alert(1)", "data:image/png;base64,AA", "//a.test/x", "/x", "", null, undefined]) {
      expect(httpUrl(bad)).toBe("");
    }
  });
});
