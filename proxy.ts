import { type NextRequest, NextResponse } from "next/server";
import { PREFERENCE_COOKIE } from "@/lib/view/cookies";
import { VIEW_COOKIE, VIEW_QUERY, isView, resolveView } from "@/lib/view/views";

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
    response.cookies.set(VIEW_COOKIE, query, PREFERENCE_COOKIE);
    return response;
  }

  // An invalid ?view= value is ignored and left in the URL.
  const view = resolveView(null, request.cookies.get(VIEW_COOKIE)?.value);
  const url = request.nextUrl.clone();
  url.pathname = `/${view}${pathname}`;
  const response = NextResponse.rewrite(url);
  // Both variants answer the same URL, so no cache may reuse a response
  // without asking again. Next sends prerendered pages and their RSC payloads
  // with `s-maxage, stale-while-revalidate` and keys them only on its router
  // headers (Vary and the `_rsc` hash), never the cookie. Chrome applies the
  // stale-while-revalidate to the client router's prefetches, so after a
  // toggle it hands back the other view's prefetch for the same URL; Next
  // stores that route tree, and the next link click stitches the old view's
  // [view] layout onto a page of the new one. `no-cache` still lets the
  // browser keep a copy and revalidate it (ETag), and keeps the bfcache.
  // Next keeps a Cache-Control set here; it would overwrite a Vary, and it
  // hides the RSC headers from the proxy, hence every response.
  response.headers.set("Cache-Control", "private, no-cache");
  return response;
}

export const config = {
  // Skip /api, /_next (exact segment, so /apiary/ still goes through), and any
  // path with a file extension (public/ files such as /images/..., /favicon.ico,
  // /keybase.txt).
  matcher: ["/((?!(?:api|_next)(?:/|$)|.*\\..*).*)"],
};
