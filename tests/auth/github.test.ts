import { describe, expect, it, vi } from "vitest";
import { authorizeUrl, exchangeCode, fetchGithubUserId, safeNext } from "@/lib/auth/github";

describe("GitHub OAuth", () => {
  it("builds the authorize URL with no extra scopes", () => {
    const url = new URL(authorizeUrl("client", "https://onursenture.vercel.app/api/auth/callback/", "abc"));
    expect(url.origin + url.pathname).toBe("https://github.com/login/oauth/authorize");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      client_id: "client",
      redirect_uri: "https://onursenture.vercel.app/api/auth/callback/",
      state: "abc",
      scope: "",
      allow_signup: "false",
    });
  });

  it("exchanges the code for a token", async () => {
    const fetchImpl = vi.fn(async () => Response.json({ access_token: "tok" }));
    const token = await exchangeCode("code", { clientId: "id", clientSecret: "secret", redirectUri: "https://x/cb/" }, fetchImpl);
    expect(token).toBe("tok");
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://github.com/login/oauth/access_token");
    expect(JSON.parse(String(init.body))).toEqual({ client_id: "id", client_secret: "secret", code: "code", redirect_uri: "https://x/cb/" });
  });

  it("fails when GitHub returns no token", async () => {
    const fetchImpl = vi.fn(async () => Response.json({ error: "bad_verification_code" }));
    await expect(exchangeCode("code", { clientId: "id", clientSecret: "s", redirectUri: "https://x/cb/" }, fetchImpl)).rejects.toThrow("bad_verification_code");
  });

  it("reads the numeric user id as a string", async () => {
    const fetchImpl = vi.fn(async () => Response.json({ id: 12345, login: "onursenture" }));
    expect(await fetchGithubUserId("tok", fetchImpl)).toBe("12345");
  });

  it("only returns to admin paths", () => {
    expect(safeNext("/admin/work/nebuu/")).toBe("/admin/work/nebuu/");
    for (const bad of [null, undefined, "", "/", "https://evil.com/admin/", "//evil.com/admin/", "/admin/\\evil"]) expect(safeNext(bad), String(bad)).toBe("/admin/");
  });
});
