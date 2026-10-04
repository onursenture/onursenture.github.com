import type { NextResponse } from "next/server";
import { HINT_COOKIE, OAUTH_NEXT_COOKIE, OAUTH_STATE_COOKIE, SESSION_COOKIE } from "./names";
import { SESSION_DAYS, signSession } from "./session";

// Secure everywhere but `next dev`; browsers accept Secure cookies on
// http://localhost, so the e2e's `next start` works too.
const secure = () => process.env.NODE_ENV === "production";

export function oauthCookieOptions() {
  return { httpOnly: true, secure: secure(), sameSite: "lax" as const, path: "/", maxAge: 600 };
}

export async function setSessionCookies(response: NextResponse, githubId: string): Promise<void> {
  const maxAge = SESSION_DAYS * 86_400;
  response.cookies.set(SESSION_COOKIE, await signSession(githubId), { httpOnly: true, secure: secure(), sameSite: "lax", path: "/", maxAge });
  response.cookies.set(HINT_COOKIE, "1", { httpOnly: false, secure: secure(), sameSite: "lax", path: "/", maxAge });
  response.cookies.delete(OAUTH_STATE_COOKIE);
  response.cookies.delete(OAUTH_NEXT_COOKIE);
}

export function clearSessionCookies(response: NextResponse): void {
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(HINT_COOKIE);
}
