import { type NextRequest, NextResponse } from "next/server";
import { clearOAuthCookies, setSessionCookies } from "@/lib/auth/cookies";
import { exchangeCode, fetchGithubUserId, safeNext } from "@/lib/auth/github";
import { OAUTH_NEXT_COOKIE, OAUTH_STATE_COOKIE } from "@/lib/auth/names";
import { adminGithubId } from "@/lib/auth/session";

// A final answer that also drops the one-time OAuth cookies.
function fail(message: string, status: number): NextResponse {
  const response = new NextResponse(message, { status });
  clearOAuthCookies(response);
  return response;
}

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
  const adminId = adminGithubId();
  if (!clientId || !clientSecret || !adminId) return new Response("Sign-in is not configured.", { status: 503 });

  let githubId: string;
  try {
    const token = await exchangeCode(code, { clientId, clientSecret, redirectUri: `${url.origin}/api/auth/callback/` });
    githubId = await fetchGithubUserId(token);
  } catch (e) {
    console.warn("[auth]", e instanceof Error ? e.message : e);
    return fail("Sign-in failed: GitHub didn't answer as expected.", 502);
  }
  if (githubId !== adminId) return fail("Not allowed.", 403);

  const response = NextResponse.redirect(new URL(safeNext(request.cookies.get(OAUTH_NEXT_COOKIE)?.value), url.origin));
  await setSessionCookies(response, githubId);
  return response;
}
