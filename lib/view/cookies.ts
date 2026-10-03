// The view and theme preference cookies share one set of attributes. proxy.ts
// sets them through NextResponse.cookies; the toggles write document.cookie.
// Both read from here, so the two can't drift apart.
export const PREFERENCE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const PREFERENCE_COOKIE = {
  path: "/",
  maxAge: PREFERENCE_COOKIE_MAX_AGE,
  sameSite: "lax",
} as const;

// A document.cookie assignment string with the shared attributes.
export function serializeCookie(name: string, value: string): string {
  return `${name}=${encodeURIComponent(value)}; path=/; max-age=${PREFERENCE_COOKIE_MAX_AGE}; samesite=lax`;
}

// Matches `name=value` as a whole cookie in a Cookie header or
// document.cookie, capturing the value. `values` is a regex alternation such
// as "light|dark". Anchored at both ends, so "xtheme=dark" and
// "theme=darkish" don't match.
export function cookiePattern(name: string, values: string): RegExp {
  return new RegExp(`(?:^|;\\s*)${name}=(${values})(?:;|$)`);
}
