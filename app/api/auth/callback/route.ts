import { type NextRequest, NextResponse } from "next/server";
import { setSessionCookies } from "@/lib/auth/cookies";
import { exchangeCode, fetchGithubUserId, safeNext } from "@/lib/auth/github";
import { OAUTH_NEXT_COOKIE, OAUTH_STATE_COOKIE } from "@/lib/auth/names";

// GitHub redirects here. Only ADMIN_GITHUB_ID gets a session; anyone else
// sees "Not allowed" and gets no cookie.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expected = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  if (!code || !state || !expected || state !== expected) {
    return new Response("Sign-in failed: the request expired or didn't match. Start again from /admin/.", { status: 400 });
  }
  const clientId = process.env.AUTH_GITHUB_ID;
  const clientSecret = process.env.AUTH_GITHUB_SECRET;
  const adminId = process.env.ADMIN_GITHUB_ID;
  if (!clientId || !clientSecret || !adminId) return new Response("Sign-in is not configured.", { status: 503 });

  let githubId: string;
  try {
    const token = await exchangeCode(code, { clientId, clientSecret, redirectUri: `${url.origin}/api/auth/callback/` });
    githubId = await fetchGithubUserId(token);
  } catch (e) {
    console.warn("[auth]", e instanceof Error ? e.message : e);
    return new Response("Sign-in failed: GitHub didn't answer as expected.", { status: 502 });
  }
  if (githubId !== adminId) return new Response("Not allowed.", { status: 403 });

  const response = NextResponse.redirect(new URL(safeNext(request.cookies.get(OAUTH_NEXT_COOKIE)?.value), url.origin));
  await setSessionCookies(response, githubId);
  return response;
}
