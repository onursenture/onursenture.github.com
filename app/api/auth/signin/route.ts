import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { oauthCookieOptions } from "@/lib/auth/cookies";
import { authorizeUrl, safeNext } from "@/lib/auth/github";
import { OAUTH_NEXT_COOKIE, OAUTH_STATE_COOKIE } from "@/lib/auth/names";

// GET /api/auth/signin/?next=/admin/… → GitHub's consent screen.
export async function GET(request: Request) {
  const clientId = process.env.AUTH_GITHUB_ID;
  if (!clientId) return new Response("Sign-in is not configured (AUTH_GITHUB_ID).", { status: 503 });
  const url = new URL(request.url);
  const state = randomBytes(16).toString("hex");
  const response = NextResponse.redirect(authorizeUrl(clientId, `${url.origin}/api/auth/callback/`, state));
  response.cookies.set(OAUTH_STATE_COOKIE, state, oauthCookieOptions());
  response.cookies.set(OAUTH_NEXT_COOKIE, safeNext(url.searchParams.get("next")), oauthCookieOptions());
  return response;
}
