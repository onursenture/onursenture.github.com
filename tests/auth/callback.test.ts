import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/auth/callback/route";
import { OAUTH_NEXT_COOKIE, OAUTH_STATE_COOKIE, SESSION_COOKIE } from "@/lib/auth/names";

// The OAuth callback with GitHub stubbed: the token exchange, then the user.
function github(userId: number | null) {
  return vi.fn(async (url: string | URL | Request) => {
    if (String(url).includes("access_token")) return Response.json({ access_token: "token" });
    return userId === null ? new Response("down", { status: 500 }) : Response.json({ id: userId });
  });
}

function callback() {
  return new NextRequest("http://localhost/api/auth/callback/?code=c&state=s", {
    headers: { cookie: `${OAUTH_STATE_COOKIE}=s; ${OAUTH_NEXT_COOKIE}=/admin/lab/` },
  });
}

// Cookies the response clears are set again with an empty value.
const cleared = (response: Response) =>
  response.headers
    .getSetCookie()
    .filter((cookie) => /^[^=]+=;/.test(cookie))
    .map((cookie) => cookie.split("=")[0]);

beforeEach(() => {
  vi.stubEnv("AUTH_GITHUB_ID", "id");
  vi.stubEnv("AUTH_GITHUB_SECRET", "secret");
  vi.stubEnv("AUTH_SECRET", "s".repeat(40));
  vi.stubEnv("ADMIN_GITHUB_ID", " 123\n");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("auth callback", () => {
  it("signs in the admin even when ADMIN_GITHUB_ID carries whitespace", async () => {
    vi.stubGlobal("fetch", github(123));
    const response = await GET(callback());
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/admin/lab/");
    expect(response.headers.getSetCookie().some((cookie) => cookie.startsWith(`${SESSION_COOKIE}=ey`))).toBe(true);
    expect(cleared(response)).toEqual(expect.arrayContaining([OAUTH_STATE_COOKIE, OAUTH_NEXT_COOKIE]));
  });

  it("refuses another user and clears the OAuth cookies", async () => {
    vi.stubGlobal("fetch", github(999));
    const response = await GET(callback());
    expect(response.status).toBe(403);
    expect(response.headers.getSetCookie().some((cookie) => cookie.startsWith(`${SESSION_COOKIE}=`))).toBe(false);
    expect(cleared(response).sort()).toEqual([OAUTH_NEXT_COOKIE, OAUTH_STATE_COOKIE].sort());
  });

  it("clears the OAuth cookies when GitHub fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", github(null));
    const response = await GET(callback());
    expect(response.status).toBe(502);
    expect(cleared(response).sort()).toEqual([OAUTH_NEXT_COOKIE, OAUTH_STATE_COOKIE].sort());
  });
});
