import { NextResponse } from "next/server";
import { clearSessionCookies } from "@/lib/auth/cookies";

// POST from the admin's Sign out button.
export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url), 303);
  clearSessionCookies(response);
  return response;
}
