export const VIEWS = ["site", "dashboard"] as const;
export type View = (typeof VIEWS)[number];

export const DEFAULT_VIEW: View = "site";
export const VIEW_COOKIE = "view";
export const VIEW_QUERY = "view";

export function isView(value: unknown): value is View {
  return typeof value === "string" && (VIEWS as readonly string[]).includes(value);
}

// ?view= wins (so links can force a view), then the cookie, then the default.
export function resolveView(query: string | null, cookie: string | undefined): View {
  if (isView(query)) return query;
  if (isView(cookie)) return cookie;
  return DEFAULT_VIEW;
}
