import { describe, expect, it } from "vitest";
import { HttpError, fetchJson, fetchText, fetchTextRetrying, httpUrl } from "@/lib/sources/http";

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

describe("fetchTextRetrying", () => {
  // Answers with each outcome in turn: an Error is thrown, a number is a status.
  function scriptedFetch(...outcomes: (Error | number)[]) {
    let calls = 0;
    const impl = (async () => {
      const outcome = outcomes[calls++];
      if (outcome instanceof Error) throw outcome;
      return new Response("body", { status: outcome });
    }) as typeof globalThis.fetch;
    return { impl, calls: () => calls };
  }
  const timeout = new DOMException("The operation was aborted due to timeout", "TimeoutError");

  it("tries once more when the request timed out", async () => {
    const { impl, calls } = scriptedFetch(timeout, 200);
    expect(await fetchTextRetrying(impl, "https://a.test/")).toBe("body");
    expect(calls()).toBe(2);
  });

  it("gives up after the second failure", async () => {
    const { impl, calls } = scriptedFetch(timeout, new TypeError("fetch failed"));
    await expect(fetchTextRetrying(impl, "https://a.test/")).rejects.toThrow("fetch failed");
    expect(calls()).toBe(2);
  });

  it("doesn't retry an HTTP error", async () => {
    const { impl, calls } = scriptedFetch(404, 200);
    await expect(fetchTextRetrying(impl, "https://a.test/")).rejects.toBeInstanceOf(HttpError);
    expect(calls()).toBe(1);
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
