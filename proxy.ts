import { type NextRequest, NextResponse } from "next/server";
import { VIEW_COOKIE, VIEW_QUERY, isView, resolveView } from "@/lib/view/views";

const ONE_YEAR = 60 * 60 * 24 * 365;

// Every public page exists twice, prerendered under /site/... and
// /dashboard/... (app/[view]). The view cookie is the single source of truth:
// this rewrites internally to the cookie's variant, so visitors only ever see
// clean URLs and pages never read cookies (which would make them dynamic).
// A ?view= link sets the cookie and redirects to the same URL without the
// param, so the toggle (which also writes the cookie) can never be overridden
// by a stale query string.
export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const firstSegment = pathname.split("/")[1];

  // The prefixed URLs are an implementation detail; bounce direct hits.
  if (isView(firstSegment)) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(firstSegment.length + 1) || "/";
    return NextResponse.redirect(url);
  }

  const query = searchParams.get(VIEW_QUERY);
  if (isView(query)) {
    const url = request.nextUrl.clone();
    url.searchParams.delete(VIEW_QUERY);
    const response = NextResponse.redirect(url);
    response.cookies.set(VIEW_COOKIE, query, {
      path: "/",
      maxAge: ONE_YEAR,
      sameSite: "lax",
    });
    return response;
  }

  // An invalid ?view= value is ignored and left in the URL.
  const view = resolveView(null, request.cookies.get(VIEW_COOKIE)?.value);
  const url = request.nextUrl.clone();
  url.pathname = `/${view}${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip /api, /_next (exact segment, so /apiary/ still goes through), and any
  // path with a file extension (public/ files such as /images/..., /favicon.ico,
  // /keybase.txt).
  matcher: ["/((?!(?:api|_next)(?:/|$)|.*\\..*).*)"],
};
