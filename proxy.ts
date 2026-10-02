import { type NextRequest, NextResponse } from "next/server";
import { VIEW_COOKIE, VIEW_QUERY, isView, resolveView } from "@/lib/view/views";

const ONE_YEAR = 60 * 60 * 24 * 365;

// Every public page exists twice, prerendered under /site/... and
// /dashboard/... (app/[view]). This picks the variant from ?view= or the
// view cookie and rewrites internally, so visitors only ever see clean URLs
// and pages never read cookies (which would make them dynamic).
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
  const cookie = request.cookies.get(VIEW_COOKIE)?.value;
  const view = resolveView(query, cookie);

  const url = request.nextUrl.clone();
  url.pathname = `/${view}${pathname}`;
  const response = NextResponse.rewrite(url);
  if (isView(query) && query !== cookie) {
    response.cookies.set(VIEW_COOKIE, query, {
      path: "/",
      maxAge: ONE_YEAR,
      sameSite: "lax",
    });
  }
  return response;
}

export const config = {
  // Skip API routes, Next internals, and any path with a file extension
  // (public/ files such as /images/..., /favicon.ico, /keybase.txt).
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
