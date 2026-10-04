import { NextResponse, connection } from "next/server";
import { setSessionCookies } from "@/lib/auth/cookies";
import { safeNext } from "@/lib/auth/github";

// Signs in as ADMIN_GITHUB_ID without GitHub, for the admin e2e and local
// development only: it answers only when ADMIN_E2E=1 and the code is not
// running on Vercel. Everywhere else it is a 404.
export async function GET(request: Request) {
  // Without a request-time API Next prerenders this at build, when ADMIN_E2E is
  // unset, and would serve that 404 forever.
  await connection();
  if (process.env.ADMIN_E2E !== "1" || process.env.VERCEL) return new Response("Not found", { status: 404 });
  const adminId = process.env.ADMIN_GITHUB_ID;
  if (!adminId) return new Response("ADMIN_GITHUB_ID is not set.", { status: 503 });
  const url = new URL(request.url);
  const response = NextResponse.redirect(new URL(safeNext(url.searchParams.get("next")), url.origin));
  await setSessionCookies(response, adminId);
  return response;
}
